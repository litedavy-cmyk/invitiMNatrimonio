/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ScratchCardProps {
  revealText: string; // The secret date / text behind
  onRevealComplete?: () => void;
}

export default function ScratchCard({ revealText, onRevealComplete }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 1. Draw solid background with matte gold/bronze refined gold style
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#FF4B55'); // Festive Bordeaux
    gradient.addColorStop(0.5, '#CEB381'); // Gold highlight
    gradient.addColorStop(1, '#0D2C1E'); // Pine Green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle fine paper/gold flake particle noise
    for (let i = 0; i < 600; i++) {
       ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.12})`;
       ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.2, 1.2);
    }

    // Add editorial borders
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    ctx.strokeStyle = '#CEB381';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);

    // 2. Add instruction text on the scratch overlay in minimalist serif/sans caps
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRATTA PER REVELARE LA DATA ✦', canvas.width / 2, canvas.height / 2);
  }, []);

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if it's touch
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top,
      };
    }
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    checkProgress();
  };

  const checkProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    let clearedCount = 0;
    
    const step = 8;
    let sampledCount = 0;
    for (let i = 0; i < data.length; i += 4 * step) {
      sampledCount++;
      if (data[i + 3] === 0) {
        clearedCount++;
      }
    }

    const percentage = Math.round((clearedCount / sampledCount) * 100);
    setScratchProgress(percentage);

    if (percentage > 40 && !isScratched) {
      setIsScratched(true);
      if (onRevealComplete) {
        onRevealComplete();
      }
    }
  };

  const handleDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const { x, y } = getCoordinates(e.nativeEvent);
    scratch(x, y);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const { x, y } = getCoordinates(e.nativeEvent);
    scratch(x, y);
  };

  const handleUp = () => {
    isDrawing.current = false;
  };

  return (
    <div id="scratch-reveal-module" className="relative w-full max-w-sm mx-auto h-28 bg-[#13442D] rounded-none overflow-hidden flex items-center justify-center border border-[#CEB381]">
      
      {/* Background reveal text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D2C1E] text-center px-4">
        <Sparkles className="w-4 h-4 text-[#FF4B55] mb-1.5 animate-pulse" />
        <p className="font-serif text-base font-semibold tracking-wide text-[#FFFFFF] select-all">
          {revealText}
        </p>
        <span className="text-[8px] font-sans tracking-[0.2em] font-bold uppercase text-[#FF4B55] mt-1.5">
          ✦ SVELATO CON SUCCESSO ✦
        </span>
      </div>

      {/* Interactive scratch canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
        className={`absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-700 select-none ${
          isScratched ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
