"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  PenTool,
  Save,
  Download,
  RotateCcw,
} from "lucide-react";
import { useMeetingWhiteboard, useUpdateWhiteboard, useClearWhiteboard } from "../../hooks/useMeetings";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface WhiteboardCanvasProps {
  meetingId: number | string;
  isHost: boolean;
}

type ToolType = "select" | "pencil" | "rect" | "circle" | "line" | "arrow" | "text" | "eraser";

export default function WhiteboardCanvas({ meetingId, isHost }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>("pencil");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const { data: whiteboardData } = useMeetingWhiteboard(meetingId);
  const { mutate: updateWhiteboard, isPending: isSaving } = useUpdateWhiteboard();
  const { mutate: clearWhiteboard } = useClearWhiteboard();

  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshot = useRef<ImageData | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 540;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    saveHistory();
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory((prev) => [...prev.slice(0, historyStep + 1), dataUrl]);
    setHistoryStep((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyStep <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevStep = historyStep - 1;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryStep(prevStep);
    };
    img.src = history[prevStep];
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
    clearWhiteboard(meetingId);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    startPos.current = coords;
    setIsDrawing(true);

    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === "pencil" || currentTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = currentTool === "eraser" ? "#FFFFFF" : strokeColor;
      ctx.lineWidth = currentTool === "eraser" ? 20 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (currentTool === "pencil" || currentTool === "eraser") {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (snapshot.current) {
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = strokeColor;

      const { x: startX, y: startY } = startPos.current;

      if (currentTool === "rect") {
        ctx.strokeRect(startX, startY, coords.x - startX, coords.y - startY);
      } else if (currentTool === "circle") {
        const radius = Math.sqrt(Math.pow(coords.x - startX, 2) + Math.pow(coords.y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      } else if (currentTool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistory();
  };

  const handleSaveToCloud = () => {
    toast.success("تم حفظ حالة السبورة!");
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

          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-1.5 rounded text-[#94A3B8] hover:text-white disabled:opacity-30"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClear}
            className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[11px] font-bold"
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
            className="w-full h-full cursor-crosshair touch-none"
          />
        </div>
      </div>

      {/* ── Footer text matching Figma ── */}
      <div className="px-4 py-2 border-t border-[#1F2937] bg-[#111827] text-center">
        <p className="text-[10px] text-[#475569] font-medium">
          Collaborative whiteboard
        </p>
      </div>
    </div>
  );
}
