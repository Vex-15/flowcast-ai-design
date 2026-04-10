import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import type { SignalFusionResult, IntentAccelerationResult } from "@/data/types";

/* ================================================================
   CSS-in-JS keyframes injected once into <head>
   ================================================================ */
const STYLE_ID = "signal-fusion-animations";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* ── Radar sweep rotation ── */
    @keyframes radarSweep {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* ── Pulse ring expand + fade ── */
    @keyframes pulseRing {
      0%   { r: 4; opacity: 0.7; stroke-width: 2; }
      100% { r: 18; opacity: 0; stroke-width: 0.5; }
    }

    /* ── Blinking cursor ── */
    @keyframes cursorBlink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0; }
    }

    .typewriter-cursor {
      display: inline-block;
      width: 2px;
      height: 1em;
      background: hsl(217 91% 60%);
      margin-left: 2px;
      vertical-align: text-bottom;
      animation: cursorBlink 0.7s steps(1) infinite;
    }
  `;
  document.head.appendChild(style);
}

/* ================================================================
   Typewriter hook — replays whenever `text` changes
   ================================================================ */
function useTypewriter(text: string, speed = 22) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idxRef.current = 0;

    if (!text) return;

    const timer = setInterval(() => {
      idxRef.current += 1;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayed(text.slice(0, idxRef.current));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

/* ================================================================
   Radar Sweep SVG Overlay
   ================================================================ */
const RadarSweepOverlay = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{ zIndex: 5 }}
  >
    <svg
      viewBox="0 0 320 320"
      className="w-full h-full"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Sweep wedge gradient — fades from transparent to semi-opaque */}
        <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      <g
        style={{
          transformOrigin: "160px 160px",
          animation: "radarSweep 3s linear infinite",
        }}
      >
        {/* Sweep line */}
        <line
          x1="160" y1="160" x2="160" y2="40"
          stroke="hsl(217 91% 60%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Fading wedge arc (30° cone behind the sweep line) */}
        <path
          d={`
            M 160 160
            L 160 40
            A 120 120 0 0 0 ${160 + 120 * Math.sin(-Math.PI / 6)} ${160 - 120 * Math.cos(-Math.PI / 6)}
            Z
          `}
          fill="url(#sweepGrad)"
          opacity="0.6"
        />
      </g>
    </svg>
  </div>
);

/* ================================================================
   Pulse Rings for up-trending signals
   ================================================================ */
interface PulseRingsProps {
  signals: { name: string; trend: string; value: number }[];
}

const PulseRings = ({ signals }: PulseRingsProps) => {
  const upSignals = useMemo(
    () => signals.filter((s) => s.trend === "up"),
    [signals]
  );

  if (upSignals.length === 0) return null;

  // Distribute each signal's pulse rings around the center with staggered delays
  const total = signals.length;
  const angleStep = (2 * Math.PI) / total;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 4 }}
    >
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {signals.map((signal, i) => {
          if (signal.trend !== "up") return null;
          // Position on the radar polygon (75% radius from center)
          const angle = angleStep * i - Math.PI / 2; // start from top
          const r = 120 * 0.75;
          const cx = 160 + r * Math.cos(angle);
          const cy = 160 + r * Math.sin(angle);
          const delay = i * 0.6; // stagger so they don't pulse together

          return (
            <g key={signal.name}>
              {/* Double ring — first ring */}
              <circle
                cx={cx} cy={cy} r="4"
                fill="none"
                stroke="hsl(217 91% 60%)"
                style={{
                  animation: `pulseRing 2.2s ease-out ${delay}s infinite`,
                }}
              />
              {/* Second ring, slightly delayed */}
              <circle
                cx={cx} cy={cy} r="4"
                fill="none"
                stroke="hsl(217 91% 60%)"
                style={{
                  animation: `pulseRing 2.2s ease-out ${delay + 0.45}s infinite`,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ================================================================
   Main Component
   ================================================================ */
const SignalsView = ({
  fusion,
  intent,
}: {
  fusion: SignalFusionResult;
  intent: IntentAccelerationResult;
}) => {
  const radarData = fusion.signals.map((s) => ({
    signal: s.name.replace(/ /g, "\n"),
    value: Math.round(s.value * 100),
    fullMark: 100,
  }));

  const internal = fusion.signals.filter((s) => s.type === "internal");
  const external = fusion.signals.filter((s) => s.type === "external");

  /* ── Typewriter on the narrative ── */
  const { displayed: typedNarrative, done: typingDone } = useTypewriter(
    fusion.narrative
  );

  /* ── Signal bar mount animation ── */
  const [barsVisible, setBarsVisible] = useState(false);
  useEffect(() => {
    // Reset then animate in when fusion data changes (new SKU)
    setBarsVisible(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarsVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, [fusion]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Signal <span className="font-semibold">Fusion</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Multi-source demand signal convergence</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-extralight tracking-tighter font-mono-data text-foreground leading-none">
            {(fusion.combinedConfidence * 100).toFixed(0)}
            <span className="text-lg text-muted-foreground/40 ml-0.5">%</span>
          </p>
          <p className="label-micro text-[9px] mt-1">COMBINED CONFIDENCE</p>
        </div>
      </div>

      {/* ─── Narrative with typewriter ─── */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/[0.04] to-accent/[0.04] border-l-2 border-primary/30">
        <p className="text-sm text-foreground/80 leading-relaxed italic">
          &ldquo;{typedNarrative}&rdquo;
          {!typingDone && <span className="typewriter-cursor" />}
        </p>
      </div>

      {/* ─── Radar + Signal List ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar chart with sweep overlay */}
        <div className="relative">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="2 2"
                />
                <PolarAngleAxis
                  dataKey="signal"
                  tick={{ fontSize: 9, fill: "hsl(220 10% 46%)" }}
                />
                <Radar
                  name="Signal Strength"
                  dataKey="value"
                  stroke="hsl(217 91% 60%)"
                  fill="hsl(217 91% 60%)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(217 91% 60%)", stroke: "hsl(228 14% 5%)", strokeWidth: 2 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Strength"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar sweep rotating line + wedge */}
          <RadarSweepOverlay />

          {/* Pulse rings on up-trending signals */}
          <PulseRings signals={fusion.signals} />

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 6 }}>
            <div className="w-16 h-16 rounded-full bg-primary/[0.06] border border-primary/10 flex items-center justify-center backdrop-blur-sm">
              <span className="text-xs font-mono-data text-primary font-semibold">
                {(fusion.combinedConfidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Signal breakdown with animated bars */}
        <div className="space-y-5">
          {/* Internal */}
          <div>
            <p className="label-micro text-[9px] mb-3">INTERNAL SIGNALS</p>
            <div className="space-y-2">
              {internal.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-3 group">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-foreground/80">{s.name}</span>
                      <span className="text-[12px] font-mono-data font-semibold text-primary">
                        {(s.value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-[3px] bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: barsVisible ? `${s.value * 100}%` : "0%",
                          background: "hsl(217 91% 60%)",
                          transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.12}s`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External */}
          <div>
            <p className="label-micro text-[9px] mb-3">EXTERNAL SIGNALS</p>
            <div className="space-y-2">
              {external.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-foreground/80">{s.name}</span>
                      <span className="text-[12px] font-mono-data font-semibold text-accent">
                        {(s.value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-[3px] bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: barsVisible ? `${s.value * 100}%` : "0%",
                          background: "hsl(265 60% 62%)",
                          transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${(internal.length + idx) * 0.12}s`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalsView;
