import { useEffect, useRef } from 'react';

interface LimeVoiceOrbProps {
  isActive: boolean;
  isAgentSpeaking: boolean;
  speakerLevel: number;
  speakerBands: number[];
}

export function LimeVoiceOrb({
  isActive,
  isAgentSpeaking,
  speakerLevel,
  speakerBands,
}: LimeVoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(0);
  const bandsRef = useRef<number[]>(Array(20).fill(0));
  const activeRef = useRef(false);
  const speakingRef = useRef(false);
  const smoothActiveRef = useRef(0);
  const targetActiveRef = useRef(0);

  useEffect(() => {
    levelRef.current = speakerLevel;
    bandsRef.current = speakerBands;
    activeRef.current = isActive;
    targetActiveRef.current = 1; // Always show orb
    if (!isActive) speakingRef.current = false;
  }, [isActive, isAgentSpeaking, speakerBands, speakerLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frame = 0;
    let raf = 0;
    let displayLevel = 0;

    const fitCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return {
        width: width / dpr,
        height: height / dpr,
      };
    };

    const makeOrbPath = (cx: number, cy: number, radius: number, pulse: number, time: number, smoothA: number) => {
      const path = new Path2D();
      const bands = bandsRef.current.length ? bandsRef.current : Array(20).fill(0);
      const live = smoothA > 0.1 && speakingRef.current;
      const count = 128;
      const points: Array<{ x: number; y: number }> = [];

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const band = bands[i % bands.length] || 0;
        const wave1 = Math.sin(angle * 3.0 + time * 0.8) * 1.2;
        const wave2 = Math.sin(angle * 5.2 - time * 0.5) * 0.7;
        const wave3 = Math.sin(angle * 1.7 + time * 1.1) * 0.5;
        const surface = (wave1 + wave2 + wave3) * (live ? 1.0 : 0.3) + band * (live ? 7.0 : 0.5) * smoothA;
        const r = radius + pulse * 6 + surface;

        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        });
      }

      points.forEach((point, index) => {
        const next = points[(index + 1) % points.length];
        const midX = (point.x + next.x) / 2;
        const midY = (point.y + next.y) / 2;

        if (index === 0) {
          path.moveTo(midX, midY);
        } else {
          path.quadraticCurveTo(point.x, point.y, midX, midY);
        }
      });

      path.closePath();
      return path;
    };

    const drawGlow = (cx: number, cy: number, radius: number, inner: string, outer: string) => {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, inner);
      gradient.addColorStop(1, outer);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      const { width, height } = fitCanvas();
      const cx = width / 2;
      const cy = height / 2;
      const time = frame / 60;

      smoothActiveRef.current += (targetActiveRef.current - smoothActiveRef.current) * 0.08;
      const smoothA = smoothActiveRef.current;

      const rawLevel = activeRef.current ? Math.max(levelRef.current, speakingRef.current ? 0.03 : 0) : 0;
      displayLevel += (rawLevel - displayLevel) * 0.12;
      const bands = bandsRef.current.length ? bandsRef.current : Array(20).fill(0);
      const bandEnergy = bands.reduce((sum, band) => sum + band, 0) / Math.max(bands.length, 1);
      const pulse = Math.min(1, Math.max(displayLevel, bandEnergy * 1.1));
      const live = smoothA > 0.3 && speakingRef.current;
      const baseRadius = 90;

      ctx.clearRect(0, 0, width, height);

      const glowAlpha = smoothA * (0.35 + pulse * 0.25);
      ctx.save();
      ctx.globalAlpha = glowAlpha;
      ctx.filter = 'blur(38px)';
      drawGlow(cx, cy, 130 + pulse * 20, 'rgba(190,242,100,0.5)', 'rgba(22,101,52,0)');
      ctx.restore();

      const ringAlpha = smoothA * (0.2 + pulse * 0.2);
      ctx.save();
      ctx.globalAlpha = ringAlpha;
      ctx.strokeStyle = 'rgba(190,242,100,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 112 + pulse * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const orbPath = makeOrbPath(cx, cy, baseRadius, pulse, time, smoothA);

      ctx.save();
      ctx.shadowColor = 'rgba(190,242,100,0.45)';
      ctx.shadowBlur = 32 + pulse * 24;
      const bodyGradient = ctx.createRadialGradient(cx - 30, cy - 40, 6, cx, cy, 120);
      bodyGradient.addColorStop(0, `rgba(236,252,203,${0.72 * smoothA})`);
      bodyGradient.addColorStop(0.25, `rgba(180,235,80,${0.55 * smoothA})`);
      bodyGradient.addColorStop(0.55, `rgba(50,195,90,${0.42 * smoothA})`);
      bodyGradient.addColorStop(1, `rgba(5,46,22,${0.92 * smoothA})`);
      ctx.fillStyle = bodyGradient;
      ctx.fill(orbPath);
      ctx.restore();

      ctx.save();
      ctx.clip(orbPath);
      ctx.globalCompositeOperation = 'screen';

      const glow1X = cx - 35 + Math.sin(time * 0.6) * 10;
      const glow1Y = cy - 30 + Math.cos(time * 0.5) * 8;
      const grad1 = ctx.createRadialGradient(glow1X, glow1Y, 0, glow1X, glow1Y, 70 + pulse * 10);
      grad1.addColorStop(0, `rgba(236,252,203,${0.48 * smoothA})`);
      grad1.addColorStop(1, 'rgba(236,252,203,0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const glow2X = cx + 38 + Math.cos(time * 0.55) * 12;
      const glow2Y = cy + 22 + Math.sin(time * 0.7) * 10;
      const grad2 = ctx.createRadialGradient(glow2X, glow2Y, 0, glow2X, glow2Y, 80 + pulse * 14);
      grad2.addColorStop(0, `rgba(20,180,120,${0.38 * smoothA})`);
      grad2.addColorStop(1, 'rgba(20,180,120,0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      const glow3X = cx - 5 + Math.sin(time * 0.45) * 14;
      const glow3Y = cy + 32 + Math.cos(time * 0.4) * 8;
      const grad3 = ctx.createRadialGradient(glow3X, glow3Y, 0, glow3X, glow3Y, 85);
      grad3.addColorStop(0, `rgba(140,210,40,${0.18 * smoothA})`);
      grad3.addColorStop(1, 'rgba(140,210,40,0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      const strokeAlpha = smoothA * (0.12 + pulse * 0.22);
      ctx.save();
      ctx.strokeStyle = `rgba(217,249,157,${strokeAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke(orbPath);
      ctx.restore();

      if (smoothA > 0.5) {
        const highlightAlpha = (live ? 0.12 + pulse * 0.16 : 0.04) * smoothA;
        ctx.save();
        ctx.globalAlpha = highlightAlpha;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.ellipse(cx - 32, cy - 42, 20 + pulse * 5, 9 + pulse * 2, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      frame += 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}
