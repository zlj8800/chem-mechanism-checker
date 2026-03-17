"use client";

import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Blue", value: "#2563eb" },
  { name: "Red", value: "#dc2626" },
  { name: "Green", value: "#16a34a" },
];

export interface DrawingCanvasHandle {
  exportImage: () => Promise<string>;
  clearCanvas: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle>(function DrawingCanvas(
  _props,
  ref
) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      if (!canvasRef.current) return "";
      const dataUrl = await canvasRef.current.exportImage("png");
      return dataUrl;
    },
    clearCanvas: () => {
      canvasRef.current?.clearCanvas();
    },
  }));

  const handlePen = useCallback(() => {
    setIsEraser(false);
    canvasRef.current?.eraseMode(false);
  }, []);

  const handleEraser = useCallback(() => {
    setIsEraser(true);
    canvasRef.current?.eraseMode(true);
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo();
  }, []);

  const handleClear = useCallback(() => {
    canvasRef.current?.clearCanvas();
  }, []);

  const increaseWidth = useCallback(() => {
    setStrokeWidth((w) => Math.min(w + 1, 20));
  }, []);

  const decreaseWidth = useCallback(() => {
    setStrokeWidth((w) => Math.max(w - 1, 1));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 flex-wrap px-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={!isEraser ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
              />
            }
            onClick={handlePen}
          >
            <Pen className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Pen</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={isEraser ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
              />
            }
            onClick={handleEraser}
          >
            <Eraser className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Eraser</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon" className="h-8 w-8" />
            }
            onClick={decreaseWidth}
          >
            <Minus className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Decrease size</TooltipContent>
        </Tooltip>

        <span className="text-xs font-mono w-6 text-center tabular-nums">
          {strokeWidth}
        </span>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon" className="h-8 w-8" />
            }
            onClick={increaseWidth}
          >
            <Plus className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Increase size</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        {COLORS.map((c) => (
          <Tooltip key={c.value}>
            <TooltipTrigger
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                strokeColor === c.value && !isEraser
                  ? "border-ring scale-110"
                  : "border-transparent hover:border-muted-foreground/40"
              }`}
              style={{ backgroundColor: c.value }}
              onClick={() => {
                setStrokeColor(c.value);
                setIsEraser(false);
                canvasRef.current?.eraseMode(false);
              }}
            />
            <TooltipContent>{c.name}</TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon" className="h-8 w-8" />
            }
            onClick={handleUndo}
          >
            <Undo2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon" className="h-8 w-8" />
            }
            onClick={handleRedo}
          >
            <Redo2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-destructive"
              />
            }
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Clear canvas</TooltipContent>
        </Tooltip>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <ReactSketchCanvas
          ref={canvasRef}
          width="100%"
          height="320px"
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          eraserWidth={strokeWidth * 3}
          canvasColor="#ffffff"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
});

export default DrawingCanvas;
