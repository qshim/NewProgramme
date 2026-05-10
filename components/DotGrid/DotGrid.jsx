"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { gsap } from "gsap";

import styles from "./DotGrid.module.css";

const throttle = (func, limit) => {
  let lastCall = 0;
  return function throttled(...args) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

const DotGrid = ({
  dotSize = 16,
  gap = 32,
  baseColor = "#C8FFF0",
  activeColor = "#FFFFFF",
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = "",
  style,
}) => {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !window.Path2D) return null;
    const p = new window.Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    const dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        dots.push({ cx, cy, xOffset: 0, yOffset: 0, _animating: false });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  useEffect(() => {
    if (!circlePath) return;
    let rafId;
    const proxSq = proximity * proximity;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let fill = baseColor;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const tRaw = 1 - dist / proximity;
          // 더 "커서 근처는 화이트"로 보이게 비선형 보간
          const t = Math.pow(Math.max(0, Math.min(1, tRaw)), 1.85);
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          fill = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = fill;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, baseColor, activeRgb, baseRgb, circlePath]);

  useEffect(() => {
    buildGrid();
    let ro = null;

    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(buildGrid);
      if (wrapperRef.current) ro.observe(wrapperRef.current);
    } else {
      window.addEventListener("resize", buildGrid);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", buildGrid);
    };
  }, [buildGrid]);

  useEffect(() => {
    const applyKick = (dot, pushX, pushY) => {
      dot._animating = true;
      gsap.killTweensOf(dot);

      // InertiaPlugin 없이도 "튕김→복귀" 감을 만들기 위한 2단 애니메이션
      gsap.to(dot, {
        xOffset: pushX,
        yOffset: pushY,
        duration: 0.28,
        ease: "power3.out",
        onComplete: () => {
          gsap.to(dot, {
            xOffset: 0,
            yOffset: 0,
            duration: returnDuration,
            ease: "elastic.out(1, 0.75)",
            onComplete: () => {
              dot._animating = false;
            },
          });
        },
      });
    };

    const onMove = (e) => {
      const now = performance.now();
      const pr = pointerRef.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);

      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }

      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        if (dot._animating) continue;
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (speed > speedTrigger && dist < proximity) {
          const pushX = (dot.cx - pr.x) * 0.35 + vx * 0.006;
          const pushY = (dot.cy - pr.y) * 0.35 + vy * 0.006;
          const clamp = Math.max(16, Math.min(220, resistance * 0.22));
          applyKick(dot, Math.max(-clamp, Math.min(clamp, pushX)), Math.max(-clamp, Math.min(clamp, pushY)));
        }
      }
    };

    const onClick = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        if (dot._animating) continue;
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius) {
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - cx) * shockStrength * falloff;
          const pushY = (dot.cy - cy) * shockStrength * falloff;
          applyKick(dot, pushX, pushY);
        }
      }
    };

    const throttledMove = throttle(onMove, 50);
    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("click", onClick);
    };
  }, [maxSpeed, proximity, resistance, returnDuration, shockRadius, shockStrength, speedTrigger]);

  return (
    <section className={`${styles.dotGrid} ${className}`} style={style}>
      <div ref={wrapperRef} className={styles.wrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </section>
  );
};

export default DotGrid;

