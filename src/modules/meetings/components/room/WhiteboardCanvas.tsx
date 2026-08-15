"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  PenTool,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Type,
  StickyNote,
  Undo2,
  Redo2,
  Trash2,
  Lock,
  Unlock,
  Save,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useMeetingWhiteboard,
  useUpdateWhiteboard,
  useClearWhiteboard,
} from "../../hooks/useMeetings";
import type { WhiteboardElement } from "../../types/meetings.types";
import toast from "react-hot-toast";

interface WhiteboardCanvasProps {
  meetingId: number | string;
  isHost?: boolean;
}

type ToolType = "pencil" | "rectangle" | "circle" | "line" | "arrow" | "text" | "sticky";

const COLORS = [
  "#0f172a", // Dark slate
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

const STROKE_WIDTHS = [2, 4, 6, 8];

export default function WhiteboardCanvas({ meetingId, isHost = false }: WhiteboardCanvasProps) {
  const t = useTranslations("meetings.whiteboard");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<ToolType>("pencil");
  const [color, setColor] = useState<string>("#3b82f6");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const currentElementRef = useRef<WhiteboardElement | null>(null);

  // Queries & Mutations
  const { data: whiteboardData } = useMeetingWhiteboard(meetingId);
  const { mutate: saveWhiteboard, isPending: isSaving } = useUpdateWhiteboard();
  const { mutate: clearBoardApi } = useClearWhiteboard();

  // Load initial elements from API
  useEffect(() => {
    if (whiteboardData?.content?.elements) {
      setElements(whiteboardData.content.elements);
      setIsLocked(Boolean(whiteboardData.is_locked));
    }
  }, [whiteboardData]);

  // Redraw canvas whenever elements change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all stored elements
    elements.forEach((el) => {
      ctx.strokeStyle = el.style?.color || "#0f172a";
      ctx.fillStyle = el.style?.background_color || el.style?.color || "#0f172a";
      ctx.lineWidth = el.style?.stroke_width || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.type === "pencil" && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === "rectangle" && el.width && el.height) {
        ctx.beginPath();
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === "circle" && el.width && el.height) {
        ctx.beginPath();
        const radius = Math.sqrt(el.width * el.width + el.height * el.height) / 2;
        ctx.arc(el.x + el.width / 2, el.y + el.height / 2, Math.abs(radius), 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.type === "line" && el.width !== undefined && el.height !== undefined) {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();
      } else if (el.type === "arrow" && el.width !== undefined && el.height !== undefined) {
        const fromX = el.x;
        const fromY = el.y;
        const toX = el.x + el.width;
        const toY = el.y + el.height;
        const headLength = 14;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - headLength * Math.cos(angle - Math.PI / 6),
          toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - headLength * Math.cos(angle + Math.PI / 6),
          toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (el.type === "sticky" && el.width && el.height) {
        ctx.fillStyle = el.style?.background_color || "#fef08a"; // yellow sticky
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.strokeStyle = "#eab308";
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        if (el.text) {
          ctx.fillStyle = "#1f2937";
          ctx.font = "14px Tajawal, sans-serif";
          ctx.fillText(el.text, el.x + 10, el.y + 25);
        }
      } else if (el.type === "text" && el.text) {
        ctx.font = "16px Tajawal, sans-serif";
        ctx.fillText(el.text, el.x, el.y);
      }
    });

    // Draw current active element if in progress
    if (currentElementRef.current) {
      const el = currentElementRef.current;
      ctx.strokeStyle = el.style?.color || color;
      ctx.fillStyle = el.style?.background_color || el.style?.color || color;
      ctx.lineWidth = el.style?.stroke_width || strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.type === "pencil" && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === "rectangle" && el.width && el.height) {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === "circle" && el.width && el.height) {
        ctx.beginPath();
        const radius = Math.sqrt(el.width * el.width + el.height * el.height) / 2;
        ctx.arc(el.x + el.width / 2, el.y + el.height / 2, Math.abs(radius), 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.type === "line" && el.width !== undefined && el.height !== undefined) {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();
      }
    }
  }, [elements, color, strokeWidth]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Adjust canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 900;
      canvas.height = canvas.parentElement?.clientHeight || 560;
      redrawCanvas();
    }
  }, [redrawCanvas]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked && !isHost) {
      toast.error("السبورة مغلقة حالياً من قِبل المضيف");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const newId = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    if (tool === "text") {
      const text = prompt("أدخل النص المراد كتابته:");
      if (text) {
        const newEl: WhiteboardElement = {
          id: newId,
          type: "text",
          x,
          y,
          text,
          style: { color, stroke_width: strokeWidth },
        };
        setHistory((prev) => [...prev, elements]);
        setElements((prev) => [...prev, newEl]);
        setRedoStack([]);
      }
      setIsDrawing(false);
      return;
    }

    if (tool === "sticky") {
      const text = prompt("أدخل محتوى الملاحظة اللاصقة:");
      if (text) {
        const newEl: WhiteboardElement = {
          id: newId,
          type: "sticky",
          x,
          y,
          width: 140,
          height: 100,
          text,
          style: { background_color: "#fef08a", color: "#854d0e" },
        };
        setHistory((prev) => [...prev, elements]);
        setElements((prev) => [...prev, newEl]);
        setRedoStack([]);
      }
      setIsDrawing(false);
      return;
    }

    currentElementRef.current = {
      id: newId,
      type: tool,
      x,
      y,
      width: 0,
      height: 0,
      points: tool === "pencil" ? [{ x, y }] : undefined,
      style: { color, stroke_width: strokeWidth },
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElementRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pencil") {
      currentElementRef.current.points?.push({ x, y });
    } else {
      currentElementRef.current.width = x - currentElementRef.current.x;
      currentElementRef.current.height = y - currentElementRef.current.y;
    }

    redrawCanvas();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElementRef.current) return;
    setIsDrawing(false);

    setHistory((prev) => [...prev, elements]);
    setElements((prev) => [...prev, currentElementRef.current!]);
    setRedoStack([]);
    currentElementRef.current = null;
  };

  // Undo & Redo
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, elements]);
    setElements(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, elements]);
    setElements(next);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    if (confirm("هل أنت متأكد من رغبتك في مسح كامل محتوى السبورة؟")) {
      setHistory((prev) => [...prev, elements]);
      setElements([]);
      setRedoStack([]);
      clearBoardApi(meetingId);
    }
  };

  const handleSaveToApi = () => {
    saveWhiteboard(
      { meetingId, elements },
      {
        onSuccess: () => toast.success(t("save") + " بنجاح"),
      }
    );
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${meetingId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col h-[580px] w-full bg-white dark:bg-slate-950 rounded-2xl border shadow-sm overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-2.5 bg-muted/30 border-b flex-wrap gap-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 bg-background border rounded-lg p-1">
          <Button
            variant={tool === "pencil" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("pencil")}
            className="h-8 w-8 p-0"
            title={t("pencil")}
          >
            <PenTool className="w-4 h-4" />
          </Button>

          <Button
            variant={tool === "rectangle" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("rectangle")}
            className="h-8 w-8 p-0"
            title={t("rectangle")}
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            variant={tool === "circle" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("circle")}
            className="h-8 w-8 p-0"
            title={t("circle")}
          >
            <Circle className="w-4 h-4" />
          </Button>

          <Button
            variant={tool === "line" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("line")}
            className="h-8 w-8 p-0"
            title={t("line")}
          >
            <Minus className="w-4 h-4" />
          </Button>

          <Button
            variant={tool === "arrow" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("arrow")}
            className="h-8 w-8 p-0"
            title={t("arrow")}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant={tool === "text" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("text")}
            className="h-8 w-8 p-0"
            title={t("text")}
          >
            <Type className="w-4 h-4" />
          </Button>

          <Button
            variant={tool === "sticky" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("sticky")}
            className="h-8 w-8 p-0"
            title={t("sticky")}
          >
            <StickyNote className="w-4 h-4" />
          </Button>
        </div>

        {/* Color Picker & Stroke Width */}
        <div className="flex items-center gap-2">
          {/* Colors */}
          <div className="flex items-center gap-1 bg-background border rounded-lg p-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  color === c ? "scale-125 ring-2 ring-primary ring-offset-1" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Stroke Widths */}
          <div className="flex items-center gap-1 bg-background border rounded-lg p-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
                  strokeWidth === w ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Board Operations */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="h-8 w-8 p-0"
            title={t("undo")}
          >
            <Undo2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="h-8 w-8 p-0"
            title={t("redo")}
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title={t("clear")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadImage}
            className="h-8 w-8 p-0"
            title="تصدير كصورة"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSaveToApi}
            disabled={isSaving}
            className="h-8 px-3 text-xs gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t("save")}</span>
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 w-full h-full bg-white dark:bg-slate-900 cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
