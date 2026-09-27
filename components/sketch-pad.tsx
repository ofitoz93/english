"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "react-sketch-canvas";
import { Undo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = ["#171717", "#ef4444", "#3b82f6", "#22c55e", "#eab308"];

export type SketchPadHandle = {
  exportImage: () => Promise<string>;
};

export const SketchPad = forwardRef<SketchPadHandle>(function SketchPad(_props, ref) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [color, setColor] = useState(COLORS[0]);

  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      if (!canvasRef.current) throw new Error("Çizim alanı hazır değil.");
      return canvasRef.current.exportImage("png");
    },
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={cn(
              "size-6 rounded-full border-2 transition-colors",
              color === c ? "border-foreground" : "border-transparent",
            )}
            style={{ backgroundColor: c }}
            aria-label={`Renk: ${c}`}
          />
        ))}
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => canvasRef.current?.undo()}
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => canvasRef.current?.resetCanvas()}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <ReactSketchCanvas
        ref={canvasRef}
        strokeColor={color}
        strokeWidth={4}
        canvasColor="white"
        height="240px"
        width="100%"
        className="rounded-lg border border-input"
      />
    </div>
  );
});
