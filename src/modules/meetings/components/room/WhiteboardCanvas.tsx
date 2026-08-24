"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  PenTool,
  Save,
  Download,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  useMeetingWhiteboard,
  useUpdateWhiteboard,
  useDrawWhiteboardElement,
  useDeleteWhiteboardElement,
  useUpdateWhiteboardElement,
  useToggleWhiteboardElementLock,
  useToggleWhiteboardLock,
  useUndoWhiteboard,
  useRedoWhiteboard,
  useClearWhiteboard,
} from "../../hooks/useMeetings";
import type { WhiteboardElement } from "../../types/meetings.types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface WhiteboardCanvasProps {
  meetingId: number | string;
  isHost: boolean;
}

type ToolType = "select" | "pencil" | "rect" | "circle" | "line" | "arrow" | "text" | "eraser";

const CANVAS_HEIGHT = 540;

export default function WhiteboardCanvas({ meetingId, isHost }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>("pencil");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [lineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);

  /** Shapes accepted by this client but not yet echoed back by the server. */
  const [pending, setPending] = useState<WhiteboardElement[]>([]);
  /** The shape currently being dragged out, drawn as a preview only. */
  const [draft, setDraft] = useState<WhiteboardElement | null>(null);

  const { data: whiteboardData } = useMeetingWhiteboard(meetingId);
  const { mutate: replaceBoard, isPending: isSaving } = useUpdateWhiteboard();
  const { mutate: drawElement } = useDrawWhiteboardElement();
  const { mutate: deleteElement } = useDeleteWhiteboardElement();
  const { mutate: undoBoard } = useUndoWhiteboard();
  const { mutate: redoBoard } = useRedoWhiteboard();
  const { mutate: updateElement } = useUpdateWhiteboardElement();
  const { mutate: toggleElementLock } = useToggleWhiteboardElementLock();
  const { mutate: toggleBoardLock } = useToggleWhiteboardLock();
  const { mutate: clearWhiteboard } = useClearWhiteboard();

  /** Element chosen with the select tool, target of the layer/lock actions. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Elements removed by undo, so redo has something to restore. */
  const [redoStack, setRedoStack] = useState<WhiteboardElement[]>([]);

  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const boardLocked = Boolean(whiteboardData?.is_locked);
  const isLocked = boardLocked && !isHost;
  const serverElements = whiteboardData?.content?.elements ?? [];

  // Server state wins; anything it has confirmed drops out of `pending`.
  const elements: WhiteboardElement[] = [
    ...serverElements,
    ...pending.filter((p) => !serverElements.some((e) => e.id === p.id)),
  ];

  useEffect(() => {
    const confirmed = whiteboardData?.content?.elements ?? [];
    if (!confirmed.length) return;
    setPending((prev) => prev.filter((p) => !confirmed.some((e) => e.id === p.id)));
  }, [whiteboardData]);

  // ─── Rendering ─────────────────────────────────────────────────────────────
  const paintElement = (ctx: CanvasRenderingContext2D, el: WhiteboardElement) => {
    ctx.strokeStyle = el.style?.color || "#000000";
    ctx.fillStyle = el.style?.color || "#000000";
    ctx.lineWidth = el.style?.stroke_width ?? 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (el.type) {
      case "rectangle":
        ctx.strokeRect(el.x, el.y, el.width ?? 0, el.height ?? 0);
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius ?? 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case "line":
      case "arrow": {
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = el;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (el.type === "arrow") {
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const head = 12;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - head * Math.cos(angle - Math.PI / 6),
            y2 - head * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - head * Math.cos(angle + Math.PI / 6),
            y2 - head * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;
      }
      case "text":
        ctx.font = `${el.style?.font_size ?? 18}px sans-serif`;
        ctx.fillText(el.text ?? "", el.x, el.y);
        break;
      case "freehand": {
        const pts = el.points ?? [];
        if (pts.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
        break;
      }
    }
  };

  const boundsOf = (el: WhiteboardElement) => {
    switch (el.type) {
      case "rectangle": {
        const w = el.width ?? 0;
        const h = el.height ?? 0;
        return { x: Math.min(el.x, el.x + w), y: Math.min(el.y, el.y + h), w: Math.abs(w), h: Math.abs(h) };
      }
      case "circle": {
        const r = el.radius ?? 0;
        return { x: el.x - r, y: el.y - r, w: r * 2, h: r * 2 };
      }
      case "line":
      case "arrow": {
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = el;
        return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
      }
      case "freehand": {
        const pts = el.points ?? [];
        if (!pts.length) return { x: el.x, y: el.y, w: 0, h: 0 };
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          w: Math.max(...xs) - Math.min(...xs),
          h: Math.max(...ys) - Math.min(...ys),
        };
      }
      default:
        return { x: el.x - 4, y: el.y - 16, w: (el.text?.length ?? 2) * 9, h: 22 };
    }
  };

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    [...elements]
      .sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0))
      .forEach((el) => paintElement(ctx, el));
    if (draft) paintElement(ctx, draft);

    const active = elements.find((el) => el.id === selectedId);
    if (active) {
      ctx.save();
      ctx.strokeStyle = active.is_locked ? "#F59E0B" : "#25C6DA";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      const box = boundsOf(active);
      ctx.strokeRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12);
      ctx.restore();
    }
  }, [elements, draft, selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = CANVAS_HEIGHT;
    repaint();
  }, [repaint]);

  // ─── Element construction ──────────────────────────────────────────────────
  const style = () => ({ color: strokeColor, stroke_width: lineWidth });

  const buildElement = (end: { x: number; y: number }): WhiteboardElement | null => {
    const { x, y } = startPos.current;
    // The API rejects any id that is not a UUID.
    const id = crypto.randomUUID();

    switch (currentTool) {
      case "rect":
        return { id, type: "rectangle", x, y, width: end.x - x, height: end.y - y, style: style() };
      case "circle":
        return {
          id,
          type: "circle",
          x,
          y,
          radius: Math.hypot(end.x - x, end.y - y),
          style: style(),
        };
      case "line":
      case "arrow":
        return {
          id,
          type: currentTool === "line" ? "line" : "arrow",
          x,
          y,
          x1: x,
          y1: y,
          x2: end.x,
          y2: end.y,
          style: style(),
        };
      case "pencil":
        return pointsRef.current.length > 1
          ? { id, type: "freehand", x, y, points: [...pointsRef.current], style: style() }
          : null;
      default:
        return null;
    }
  };

  const commit = (el: WhiteboardElement) => {
    setPending((prev) => [...prev, el]);
    drawElement({ meetingId, element: el });
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /** Rough hit test so the eraser can pick a shape to delete. */
  const hitTest = (pt: { x: number; y: number }) =>
    [...elements].reverse().find((el) => {
      const near = (ax: number, ay: number) => Math.hypot(ax - pt.x, ay - pt.y) < 14;
      switch (el.type) {
        case "rectangle": {
          const x2 = el.x + (el.width ?? 0);
          const y2 = el.y + (el.height ?? 0);
          return (
            pt.x >= Math.min(el.x, x2) - 6 && pt.x <= Math.max(el.x, x2) + 6 &&
            pt.y >= Math.min(el.y, y2) - 6 && pt.y <= Math.max(el.y, y2) + 6
          );
        }
        case "circle":
          return Math.abs(Math.hypot(pt.x - el.x, pt.y - el.y) - (el.radius ?? 0)) < 12;
        case "line":
        case "arrow":
          return near(el.x1 ?? 0, el.y1 ?? 0) || near(el.x2 ?? 0, el.y2 ?? 0);
        case "text":
          return near(el.x, el.y);
        case "freehand":
          return (el.points ?? []).some((p) => near(p.x, p.y));
        default:
          return false;
      }
    });

  // ─── Pointer handlers ──────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked) {
      toast.error("The whiteboard is locked by the host");
      return;
    }
    const coords = getCanvasCoords(e);
    startPos.current = coords;

    if (currentTool === "select") {
      setSelectedId(hitTest(coords)?.id ?? null);
      return;
    }

    if (currentTool === "eraser") {
      const target = hitTest(coords);
      if (target?.is_locked) {
        toast.error("That element is locked");
        return;
      }
      if (target) {
        setPending((prev) => prev.filter((p) => p.id !== target.id));
        deleteElement({ meetingId, elementId: target.id });
      }
      return;
    }

    if (currentTool === "text") {
      const text = window.prompt("Text to add:")?.trim();
      if (text) {
        commit({
          id: crypto.randomUUID(),
          type: "text",
          x: coords.x,
          y: coords.y,
          text,
          style: { ...style(), font_size: 18 },
        });
      }
      return;
    }

    pointsRef.current = [coords];
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    if (currentTool === "pencil") pointsRef.current.push(coords);
    setDraft(buildElement(coords));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const el = buildElement(getCanvasCoords(e));
    setDraft(null);
    pointsRef.current = [];
    if (el) commit(el);
  };

  // ─── Board-level actions ───────────────────────────────────────────────────
  const selected = elements.find((el) => el.id === selectedId) || null;

  const handleUndo = () => {
    if (!elements.length) return;
    const last = elements[elements.length - 1];
    setPending((prev) => prev.filter((p) => p.id !== last.id));
    setRedoStack((prev) => [...prev, last]);
    if (selectedId === last.id) setSelectedId(null);
    undoBoard({ meetingId, elements: elements.slice(0, -1) });
  };

  const handleRedo = () => {
    const restored = redoStack[redoStack.length - 1];
    if (!restored) return;
    setRedoStack((prev) => prev.slice(0, -1));
    setPending((prev) => [...prev, restored]);
    redoBoard({ meetingId, elements: [...elements, restored] });
  };

  /** Moves the selected element in the stacking order via its z_index. */
  const handleLayer = (direction: "forward" | "backward") => {
    if (!selected) return;
    const current = selected.z_index ?? elements.indexOf(selected);
    const z_index = direction === "forward" ? current + 1 : Math.max(0, current - 1);
    setPending((prev) =>
      prev.map((el) => (el.id === selected.id ? { ...el, z_index } : el))
    );
    updateElement({ meetingId, elementId: selected.id, element: { z_index } });
  };

  const handleElementLock = () => {
    if (!selected) return;
    const locked = !selected.is_locked;
    setPending((prev) =>
      prev.map((el) => (el.id === selected.id ? { ...el, is_locked: locked } : el))
    );
    toggleElementLock({ meetingId, elementId: selected.id, locked });
  };

  const handleDeleteSelected = () => {
    if (!selected) return;
    if (selected.is_locked) {
      toast.error("That element is locked");
      return;
    }
    setPending((prev) => prev.filter((p) => p.id !== selected.id));
    deleteElement({ meetingId, elementId: selected.id });
    setSelectedId(null);
  };

  const handleClear = () => {
    setPending([]);
    setRedoStack([]);
    setSelectedId(null);
    clearWhiteboard(meetingId);
  };

  const handleSaveToCloud = () => {
    replaceBoard(
      { meetingId, elements },
      {
        onSuccess: () => toast.success("Whiteboard saved"),
        onError: () => toast.error("Could not save the whiteboard"),
      }
    );
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${meetingId}-whiteboard.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full rounded-[14px] bg-[#111827] border border-[#1F2937] overflow-hidden text-white shadow-xl">
      {/* ── Top Header matching Figma (whiteboard) ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#111827]">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#25C6DA]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#64748B]">
            whiteboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-[8px] bg-[#1A2236] text-[#94A3B8] hover:text-white border border-[#2A3756]"
            title="Download PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Toolbar matching Figma exactly ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1F2937] bg-[#161F33] flex-wrap gap-2">
        {/* Tool buttons: ↖, ✏️, □, ○, —, →, T, ⌫ */}
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-[8px] border border-[#2A3756]">
          <button
            onClick={() => setCurrentTool("select")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-bold transition-colors",
              currentTool === "select" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Select (↖)"
          >
            ↖
          </button>

          <button
            onClick={() => setCurrentTool("pencil")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs transition-colors",
              currentTool === "pencil" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Pencil (✏️)"
          >
            ✏️
          </button>

          <button
            onClick={() => setCurrentTool("rect")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-bold transition-colors",
              currentTool === "rect" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Rectangle (□)"
          >
            □
          </button>

          <button
            onClick={() => setCurrentTool("circle")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-bold transition-colors",
              currentTool === "circle" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Circle (○)"
          >
            ○
          </button>

          <button
            onClick={() => setCurrentTool("line")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-bold transition-colors",
              currentTool === "line" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Line (—)"
          >
            —
          </button>

          <button
            onClick={() => setCurrentTool("arrow")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-bold transition-colors",
              currentTool === "arrow" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Arrow (→)"
          >
            →
          </button>

          <button
            onClick={() => setCurrentTool("text")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-bold transition-colors",
              currentTool === "text" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Text (T)"
          >
            T
          </button>

          <button
            onClick={() => setCurrentTool("eraser")}
            className={cn(
              "w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-bold transition-colors",
              currentTool === "eraser" ? "bg-[#25C6DA] text-white" : "text-[#94A3B8] hover:text-white"
            )}
            title="Eraser (⌫)"
          >
            ⌫
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {["#000000", "#F44336", "#4CAF50", "#25C6DA", "#9810FA", "#E8D636"].map((c) => (
            <button
              key={c}
              onClick={() => setStrokeColor(c)}
              className={cn(
                "w-5 h-5 rounded-full border border-white/20 transition-transform",
                strokeColor === c && "scale-125 ring-2 ring-[#25C6DA]"
              )}
              style={{ backgroundColor: c }}
            />
          ))}

          {/* Selection actions — enabled once the select tool picks something */}
          <div className="flex items-center gap-0.5 ps-1.5 ms-0.5 border-s border-[#2A3756]">
            <button
              onClick={() => handleLayer("backward")}
              disabled={!selected}
              className="p-1.5 rounded text-[#94A3B8] hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Send backward"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleLayer("forward")}
              disabled={!selected}
              className="p-1.5 rounded text-[#94A3B8] hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Bring forward"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleElementLock}
              disabled={!selected}
              className={cn(
                "p-1.5 rounded hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed",
                selected?.is_locked ? "text-amber-400" : "text-[#94A3B8]"
              )}
              title={selected?.is_locked ? "Unlock element" : "Lock element"}
            >
              {selected?.is_locked ? (
                <Unlock className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={handleDeleteSelected}
              disabled={!selected}
              className="p-1.5 rounded text-[#94A3B8] hover:text-red-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Delete selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 ps-1.5 ms-0.5 border-s border-[#2A3756]">
            <button
              onClick={handleUndo}
              disabled={elements.length === 0}
              className="p-1.5 rounded text-[#94A3B8] hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded text-[#94A3B8] hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Redo"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Board-wide lock is host-only, matching the API */}
            {isHost && (
              <button
                onClick={() => toggleBoardLock({ meetingId, locked: !boardLocked })}
                className={cn(
                  "p-1.5 rounded hover:text-white cursor-pointer",
                  boardLocked ? "text-amber-400" : "text-[#94A3B8]"
                )}
                title={boardLocked ? "Unlock the whole board" : "Lock the whole board"}
              >
                {boardLocked ? (
                  <Unlock className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <button
            onClick={handleClear}
            className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[11px] font-bold cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Canvas Container matching Figma (14px radius, white surface) ── */}
      <div className="flex-1 p-3 flex flex-col items-center justify-center bg-[#0B0F19]">
        <div className="w-full h-full rounded-[14px] overflow-hidden bg-white shadow-2xl border border-[#2A3756]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={cn(
              "w-full h-full touch-none",
              isLocked ? "cursor-not-allowed" : "cursor-crosshair"
            )}
          />
        </div>
      </div>

      {/* ── Footer text matching Figma ── */}
      <div className="px-4 py-2 border-t border-[#1F2937] bg-[#111827] text-center">
        <p className="text-[10px] text-[#475569] font-medium">
          {isLocked ? "Whiteboard locked by the host" : "Collaborative whiteboard"}
        </p>
      </div>
    </div>
  );
}
