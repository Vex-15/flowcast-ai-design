import { useState, useMemo } from "react";
import type { IntentAccelerationResult } from "@/data/types";

/* ================================================================
   CSS injected once for the spike‑arc animation
   ================================================================ */
const STYLE_ID = "intent-spike-predictor-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .spike-arc-transition {
      transition: stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                  stroke 0.4s ease;
    }
    .spike-label-transition {
      transition: color 0.4s ease, opacity 0.4s ease;
    }
    .spike-metric-row {
      transition: opacity 0.35s ease, transform 0.35s ease;
    }

    /* ── Custom range slider ── */
    .spike-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      background: transparent;
    }
    /* Track – Webkit */
    .spike-slider::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 3px;
      background: var(--spike-slider-track, hsl(0 0% 20%));
    }
    /* Thumb – Webkit */
    .spike-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--spike-slider-thumb, hsl(38 92% 50%));
      border: 2px solid hsl(0 0% 8%);
      margin-top: -6px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.35);
      transition: background 0.3s ease, transform 0.15s ease;
    }
    .spike-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
    }
    /* Track – Firefox */
    .spike-slider::-moz-range-track {
      height: 6px;
      border-radius: 3px;
      background: var(--spike-slider-track, hsl(0 0% 20%));
      border: none;
    }
    /* Progress (filled part) – Firefox */
    .spike-slider::-moz-range-progress {
      height: 6px;
      border-radius: 3px;
      background: var(--spike-slider-thumb, hsl(38 92% 50%));
    }
    /* Thumb – Firefox */
    .spike-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--spike-slider-thumb, hsl(38 92% 50%));
      border: 2px solid hsl(0 0% 8%);
      box-shadow: 0 1px 6px rgba(0,0,0,0.35);
    }
  `;
  document.head.appendChild(style);
}

/* ================================================================
   Scenario definitions
   ================================================================ */
type Scenario = "incoming" | "critical" | "dormant";

interface ScenarioConfig {
  label: string;
  hoursToSpike: number;
  confidence: number;
  arcColor: string;
  statusLabel: string;
  statusDot: string;
  suggestedAction: string;
  signals: {
    label: string;
    value: string;
    change: string;
    changeColor: string;
  }[];
}

function buildScenario(
  scenario: Scenario,
  sliderHours: number,
  baseIntent: IntentAccelerationResult
): ScenarioConfig {
  const baseSaves = baseIntent.signals[0]?.current || 320;
  const baseViews = baseIntent.signals[1]?.current || 4200;
  const baseDwell = baseIntent.signals[2]?.current || 28;
  const baseCart = Math.round(baseViews * 0.05);

  let m = 1.0;
  if (scenario === "incoming") m = 1.2 + (1 - sliderHours / 72) * 1.5;
  if (scenario === "critical") m = 3.5;

  const views = Math.round(baseViews * m * (1 + (m * 0.02)));
  const saves = Math.round(baseSaves * m * (1 + (m * 0.05)));
  const dwell = Math.round(baseDwell * (1 + (m - 1) * 0.3));
  const cart = Math.round(baseCart * Math.pow(m, 1.4)); 

  const formatUnit = (val: number) => val >= 1000 ? (val / 1000).toFixed(1) + "k" : val.toLocaleString();
  
  const fViews = formatUnit(views);
  const fSaves = formatUnit(saves);
  const fCart = formatUnit(cart);
  const fDwell = dwell >= 60 ? `${Math.floor(dwell / 60)}m ${dwell % 60}s` : `${dwell}s`;

  const safeChangePercent = (current: number, previous: number, fallbackBase: number) => 
    previous > 0 ? Math.round(((current - previous) / previous) * 100) + fallbackBase : 0;

  const cViews = safeChangePercent(views, baseViews, Math.max(2, Math.abs(baseIntent.signals[1]?.changePercent || 0)));
  const cSaves = safeChangePercent(saves, baseSaves, Math.max(3, Math.abs(baseIntent.signals[0]?.changePercent || 0)));
  const cDwell = safeChangePercent(dwell, baseDwell, Math.max(1, Math.abs(baseIntent.signals[2]?.changePercent || 0)));
  const cCart = safeChangePercent(cart, baseCart, 5);

  const dynamicSignals = [
    { label: "Page views", value: fViews, change: `+${cViews}%`, changeColor: scenario === "dormant" ? "text-muted-foreground" : "text-emerald-400" },
    { label: "Product saves", value: fSaves, change: `+${cSaves}%`, changeColor: scenario === "dormant" ? "text-muted-foreground" : "text-emerald-400" },
    { label: "Avg dwell", value: fDwell, change: `+${cDwell}%`, changeColor: scenario === "dormant" ? "text-muted-foreground" : "text-emerald-400" },
    { label: "Add-to-cart", value: fCart, change: `+${cCart}%`, changeColor: scenario === "dormant" ? "text-muted-foreground" : "text-emerald-400" },
  ];

  switch (scenario) {
    case "incoming": {
      const h = sliderHours;
      const conf = Math.round(55 + (1 - h / 72) * 25); 
      return {
        label: "Spike incoming",
        hoursToSpike: h,
        confidence: conf,
        arcColor: "hsl(38 92% 50%)",
        statusLabel: `Spike in ~${h}h`,
        statusDot: "bg-amber-400",
        suggestedAction:
          h <= 16
            ? `Pre-position ${Math.round(120 + (72 - h) * 3)} units and notify regional warehouse. Lead time is tight.`
            : `Monitor closely. Consider pre-ordering ${Math.round(80 + (72 - h) * 2)} units within the next ${Math.round(h / 2)}h window.`,
        signals: dynamicSignals,
      };
    }
    case "critical": {
      return {
        label: "Critical — imminent",
        hoursToSpike: 8,
        confidence: 94,
        arcColor: "hsl(0 72% 48%)",
        statusLabel: "Critical — act now",
        statusDot: "bg-red-500 animate-pulse",
        suggestedAction:
          "Emergency reorder triggered. Alert warehouse and expedite shipping from 2 DCs.",
        signals: dynamicSignals,
      };
    }
    case "dormant":
    default: {
      return {
        label: "No spike detected",
        hoursToSpike: 72,
        confidence: Math.round(baseIntent.confidence * 100 * 0.3), 
        arcColor: "hsl(var(--border))",
        statusLabel: "Monitoring",
        statusDot: "bg-muted-foreground/30",
        suggestedAction:
          "No action required. Intent signals are within normal range. Continue automated monitoring.",
        signals: dynamicSignals,
      };
    }
  }
}

/* ================================================================
   Countdown Arc SVG
   ================================================================ */
const CountdownArc = ({
  hoursToSpike,
  confidence,
  arcColor,
  isDormant,
}: {
  hoursToSpike: number;
  confidence: number;
  arcColor: string;
  isDormant: boolean;
}) => {
  const size = 200;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2 - 4;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Fill % = 1 - hoursRemaining / 72
  const fillFraction = isDormant ? 0 : Math.max(0, 1 - hoursToSpike / 72);
  const dashOffset = circumference * (1 - fillFraction);

  const hours = Math.round(hoursToSpike);
  const displayTime = hours >= 24 ? `${Math.round(hours / 24)}d` : `${hours}h`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isDormant ? "hsl(var(--border))" : "hsl(var(--border))"}
          strokeWidth={strokeWidth}
          opacity={isDormant ? 0.4 : 0.3}
        />
        {/* Filled arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="spike-arc-transition"
          opacity={isDormant ? 0.15 : 1}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center spike-label-transition">
        <span
          className="font-mono-data font-light tracking-tighter leading-none"
          style={{
            fontSize: "40px",
            color: isDormant ? "hsl(var(--muted-foreground))" : arcColor,
            opacity: isDormant ? 0.3 : 1,
            transition: "color 0.4s ease, opacity 0.4s ease",
          }}
        >
          {isDormant ? "—" : displayTime}
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-widest mt-1"
          style={{
            color: isDormant ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
            opacity: isDormant ? 0.3 : 0.7,
            transition: "color 0.4s ease, opacity 0.4s ease",
          }}
        >
          {isDormant ? "DORMANT" : "TO SPIKE"}
        </span>
        {!isDormant && (
          <span
            className="text-[11px] font-mono-data mt-1"
            style={{ color: arcColor, transition: "color 0.4s ease" }}
          >
            {confidence}% conf.
          </span>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   Main Component
   ================================================================ */
const IntentSpikePredictor = ({
  baseIntent,
}: {
  baseIntent: IntentAccelerationResult;
}) => {
  const [scenario, setScenario] = useState<Scenario>("incoming");
  const [sliderHours, setSliderHours] = useState(36);

  const config = useMemo(
    () => buildScenario(scenario, sliderHours, baseIntent),
    [scenario, sliderHours, baseIntent]
  );

  const isDormant = scenario === "dormant";
  const isCritical = scenario === "critical";

  // In critical mode, override slider to 8
  const effectiveHours = isCritical ? 8 : isDormant ? 72 : sliderHours;

  return (
    <div className="space-y-5">
      {/* ─── Title ─── */}
      <div>
        <h2 className="text-lg font-light tracking-tight text-foreground">
          Intent <span className="font-semibold">spike predictor</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Adjust scenario to see countdown arc respond
        </p>
      </div>

      {/* ─── Scenario Buttons ─── */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "incoming" as Scenario, label: "Spike incoming" },
          { id: "critical" as Scenario, label: "Critical — imminent" },
          { id: "dormant" as Scenario, label: "No spike detected" },
        ]).map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setScenario(s.id);
              if (s.id === "incoming") setSliderHours(36);
            }}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium border transition-all
              ${scenario === s.id
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-foreground border-border/40 hover:border-foreground/30 hover:bg-secondary/20"
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── Slider (only in "incoming" mode) ─── */}
      {scenario === "incoming" && (() => {
        // Urgency color: amber at 72h → red at 1h
        const urgency = 1 - sliderHours / 72;
        const hue = Math.round(38 - urgency * 38);          // 38 (amber) → 0 (red)
        const sat = Math.round(92 - urgency * 20);           // keep vivid
        const lum = Math.round(50 - urgency * 5);
        const thumbColor = `hsl(${hue} ${sat}% ${lum}%)`;
        // Filled portion = percentage of slider from left
        const pct = ((sliderHours - 1) / 71) * 100;
        const trackBg = `linear-gradient(to right, ${thumbColor} ${pct}%, hsl(0 0% 18%) ${pct}%)`;

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Hours to spike</span>
              <span
                className="text-[12px] font-mono-data font-semibold tabular-nums"
                style={{ color: thumbColor, transition: "color 0.2s ease" }}
              >
                {sliderHours}h
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={72}
              value={sliderHours}
              onChange={(e) => setSliderHours(Number(e.target.value))}
              className="spike-slider"
              style={{
                "--spike-slider-thumb": thumbColor,
                "--spike-slider-track": trackBg,
              } as React.CSSProperties}
            />
            <div className="flex items-center justify-between text-[9px] text-muted-foreground/40 font-mono-data">
              <span>1h</span>
              <span>72h</span>
            </div>
          </div>
        );
      })()}

      {/* ─── Spike Countdown + Intent Signals ─── */}
      <div className="grid grid-cols-[auto_1fr] gap-6 items-start">
        {/* Left: Countdown Arc */}
        <div className="flex flex-col items-center gap-2">
          <CountdownArc
            hoursToSpike={effectiveHours}
            confidence={config.confidence}
            arcColor={config.arcColor}
            isDormant={isDormant}
          />
          {/* Status badge below arc */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${config.statusDot}`} />
            <span
              className="text-[11px] font-semibold"
              style={{
                color: isDormant
                  ? "hsl(var(--muted-foreground))"
                  : isCritical
                  ? "hsl(0 72% 48%)"
                  : "hsl(38 92% 50%)",
              }}
            >
              {config.statusLabel}
            </span>
          </div>
        </div>

        {/* Right: Intent signals + confidence + action */}
        <div className="space-y-4 min-w-0">
          {/* Section label */}
          <p className="label-micro text-[9px]">INTENT SIGNALS</p>

          {/* Signal rows */}
          <div className="space-y-2.5">
            {config.signals.map((sig, idx) => (
              <div
                key={sig.label}
                className="flex items-center justify-between spike-metric-row"
                style={{
                  opacity: isDormant ? 0.4 : 1,
                  transform: isDormant ? "translateX(0)" : "translateX(0)",
                  transitionDelay: `${idx * 50}ms`,
                }}
              >
                <span className="text-[12px] text-foreground/70">{sig.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-mono-data font-semibold text-foreground tabular-nums">
                    {sig.value}
                  </span>
                  <span className={`text-[11px] font-mono-data font-semibold tabular-nums ${sig.changeColor}`}>
                    {sig.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Spike confidence bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Spike confidence</span>
              <span className="text-[12px] font-mono-data font-semibold text-foreground tabular-nums">
                {config.confidence}%
              </span>
            </div>
            <div className="w-full h-[4px] bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${config.confidence}%`,
                  background: isDormant
                    ? "hsl(var(--muted-foreground))"
                    : `linear-gradient(90deg, ${config.arcColor}, ${isCritical ? "hsl(0 60% 40%)" : "hsl(38 80% 40%)"})`,
                  opacity: isDormant ? 0.2 : 1,
                  transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1), background 0.4s ease, opacity 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Suggested action */}
          <div
            className="p-3.5 rounded-xl border transition-all duration-400"
            style={{
              background: isDormant
                ? "hsl(var(--secondary) / 0.1)"
                : isCritical
                ? "hsl(0 72% 48% / 0.05)"
                : "hsl(38 92% 50% / 0.04)",
              borderColor: isDormant
                ? "hsl(var(--border) / 0.15)"
                : isCritical
                ? "hsl(0 72% 48% / 0.15)"
                : "hsl(38 92% 50% / 0.12)",
            }}
          >
            <p className="label-micro text-[8px] mb-1.5">SUGGESTED ACTION</p>
            <p
              className="text-[12px] leading-relaxed"
              style={{
                color: isDormant
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--foreground))",
                opacity: isDormant ? 0.5 : 0.85,
                transition: "color 0.4s ease, opacity 0.4s ease",
              }}
            >
              {config.suggestedAction}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntentSpikePredictor;
