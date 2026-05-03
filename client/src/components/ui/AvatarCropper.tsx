import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvatarCropperProps {
  /** The raw image src (base64 or object URL) selected by the user */
  imageSrc: string;
  /** Called with the cropped circular image as a base64 PNG */
  onCropComplete: (croppedBase64: string) => void;
  /** Called when the user cancels */
  onCancel: () => void;
  /** Output size in px (default 400) */
  outputSize?: number;
}

export function AvatarCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  outputSize = 400,
}: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Position of image center (in canvas coordinates)
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const CANVAS_SIZE = 300; // display canvas px
  const CIRCLE_R = CANVAS_SIZE / 2 - 4; // radius of the crop circle

  // ── Load image ────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      // Center image and fit it to cover the circle
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const fitScale = (CIRCLE_R * 2) / minDim;
      setScale(fitScale);
      setImgPos({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, imgPos.x - w / 2, imgPos.y - h / 2, w, h);

    // Dark overlay outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // Cut out circle (destination-out on a separate pass)
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_R, 0, Math.PI * 2);
    ctx.stroke();
  }, [imgPos, scale, imgLoaded]);

  useEffect(() => { draw(); }, [draw]);

  // ── Drag (mouse) ──────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    dragStart.current = {
      mx: e.clientX - rect.left,
      my: e.clientY - rect.top,
      ox: imgPos.x,
      oy: imgPos.y,
    };
    setIsDragging(true);
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setImgPos({
      x: dragStart.current.ox + (mx - dragStart.current.mx),
      y: dragStart.current.oy + (my - dragStart.current.my),
    });
  }, []);

  const onMouseUp = useCallback(() => {
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── Non-passive touch/wheel listeners (React JSX handlers are passive by default) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      dragStart.current = {
        mx: t.clientX - rect.left,
        my: t.clientY - rect.top,
        ox: imgPos.x,
        oy: imgPos.y,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStart.current) return;
      e.preventDefault(); // works because passive:false
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      setImgPos({
        x: dragStart.current.ox + (t.clientX - rect.left - dragStart.current.mx),
        y: dragStart.current.oy + (t.clientY - rect.top - dragStart.current.my),
      });
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => Math.min(5, Math.max(0.3, s - e.deltaY * 0.001)));
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("wheel", handleWheel);
    };
  // re-register when imgPos changes so the closure captures fresh values
  }, [imgPos]);

  // ── Drag (touch) — kept as no-ops on JSX since handled above ──────────────
  const onTouchStart = (_e: React.TouchEvent) => {};

  const onTouchEnd = () => { dragStart.current = null; };

  // ── Wheel zoom — handled via non-passive useEffect above ─────────────────

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    const img = imageRef.current;
    if (!img) return;
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    setScale((CIRCLE_R * 2) / minDim);
    setImgPos({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
  };

  // ── Export cropped circle ─────────────────────────────────────────────────
  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const out = document.createElement("canvas");
    out.width = outputSize;
    out.height = outputSize;
    const ctx = out.getContext("2d")!;

    // Scale factor from display canvas to output canvas
    const factor = outputSize / CANVAS_SIZE;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw the image at the same relative position/scale
    const w = img.naturalWidth * scale * factor;
    const h = img.naturalHeight * scale * factor;
    const dx = (imgPos.x - cx) * factor + outputSize / 2 - w / 2;
    const dy = (imgPos.y - cy) * factor + outputSize / 2 - h / 2;
    ctx.drawImage(img, dx, dy, w, h);

    onCropComplete(out.toDataURL("image/png"));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-base">Recortar foto de perfil</h2>
            <Button size="sm" onClick={handleCrop} className="rounded-full px-4 h-8 text-sm font-bold">
              <Check className="h-4 w-4 mr-1" /> Guardar
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex justify-center bg-black p-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className={`rounded-xl ${isDragging ? "cursor-grabbing" : "cursor-grab"} touch-none select-none`}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              />
            </div>
          </div>

          {/* Instructions */}
          <p className="text-center text-xs text-muted-foreground py-2">
            Arrastra para mover • Pinza o rueda para hacer zoom
          </p>

          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-4 px-6 pb-4">
            <button
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
              className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              <ZoomOut className="h-5 w-5" />
            </button>

            {/* Zoom slider */}
            <input
              type="range"
              min="30"
              max="500"
              value={Math.round(scale * 100)}
              onChange={e => setScale(parseInt(e.target.value) / 100)}
              className="flex-1 h-1.5 rounded-full accent-primary cursor-pointer"
            />

            <button
              onClick={() => setScale(s => Math.min(5, s + 0.1))}
              className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              <ZoomIn className="h-5 w-5" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}