import { Link } from "react-router-dom";
import {
  ArrowRight, BarChart3, Radio, Undo2, Package,
  FlaskConical, Brain, Activity, Zap, LayoutDashboard,
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Retail<span className="text-primary">Brain</span>
              </span>
              <p className="text-[9px] text-muted-foreground leading-none -mt-0.5">
                Williams-Sonoma Inc.
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {["Modules", "Features", "Architecture"].map((item) => (
              <button
                key={item}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-sm px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium
                hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              Launch Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-muted-foreground mb-6 animate-slide-up">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Phase 1 — Autonomous Supply Chain Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 animate-slide-up-delay-1">
              Retail<span className="text-gradient">Brain</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 animate-slide-up-delay-2">
              A decision-making AI system that{" "}
              <span className="text-foreground font-medium">explains</span>,{" "}
              <span className="text-foreground font-medium">predicts</span>,{" "}
              <span className="text-foreground font-medium">simulates</span>, and{" "}
              <span className="text-foreground font-medium">adapts</span> in real time.
            </p>

            <p className="text-sm text-muted-foreground/60 max-w-lg mx-auto mb-10 animate-slide-up-delay-2">
              Powering intelligent supply chain decisions across Williams Sonoma, Pottery Barn,
              West Elm, and the entire WSI brand portfolio.
            </p>

            <div className="flex items-center justify-center gap-4 animate-slide-up-delay-3">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground
                  font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button className="px-7 py-3.5 rounded-xl text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all font-medium">
                View Architecture
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-6 glow-primary">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Weekly Revenue", value: "$2.4M", change: "+8.3%", color: "text-emerald-400" },
                  { label: "Active Stockouts", value: "3", change: "-40%", color: "text-emerald-400" },
                  { label: "Forecast Accuracy", value: "94.1%", change: "+1.8%", color: "text-emerald-400" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl bg-secondary/30 border border-border/20 p-3">
                    <p className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                      <span className={`text-[10px] font-semibold ${kpi.color}`}>{kpi.change}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-[200px] rounded-xl bg-secondary/20 border border-border/10 flex items-center justify-center overflow-hidden relative">
                {/* Animated wave lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <path
                    d="M0,120 C100,80 200,140 300,100 C400,60 500,130 600,90 C700,50 800,110 800,110 L800,200 L0,200 Z"
                    fill="url(#heroGrad)"
                    className="animate-pulse-glow"
                  />
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="hsl(215 90% 60%)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(260 60% 65%)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className="text-sm text-muted-foreground/40 z-10">Live demand intelligence preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Modules */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              8 Core Intelligence Modules
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Each module works independently and fuses together through the Retail Brain Orchestrator
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: BarChart3,
                title: "Demand Intelligence",
                desc: "7-day SKU forecasts with demand decomposition — base, festival, promo, weather",
                color: "215 90% 60%",
              },
              {
                icon: Zap,
                title: "Demand Shift Detector",
                desc: "Z-score anomaly detection + Intent Acceleration pre-sales spike prediction",
                color: "38 90% 55%",
              },
              {
                icon: Radio,
                title: "Signal Fusion Engine",
                desc: "Combines internal sales data with social/search/event signals + confidence scoring",
                color: "260 60% 65%",
              },
              {
                icon: Undo2,
                title: "Return Intelligence",
                desc: "NLP reason clusters, risk scores, and Phantom Demand Correction formula",
                color: "0 70% 55%",
              },
              {
                icon: Package,
                title: "Inventory Decisions",
                desc: "Automated reorder quantities with stockout/overstock risk per store",
                color: "160 60% 45%",
              },
              {
                icon: FlaskConical,
                title: "What-If Simulation",
                desc: "Model demand surges, return changes, and festival scenarios in real time",
                color: "200 80% 55%",
              },
              {
                icon: Brain,
                title: "Explainable AI Layer",
                desc: "Every output answers WHY — SHAP-style feature importance + narratives",
                color: "280 60% 60%",
              },
              {
                icon: LayoutDashboard,
                title: "Brain Orchestrator",
                desc: "Prioritizes SKUs, determines actions, and ties all modules together",
                color: "45 80% 50%",
              },
            ].map((m, i) => (
              <div
                key={m.title}
                className="group glass rounded-2xl p-5 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1 cursor-default"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{
                    background: `hsl(${m.color} / 0.12)`,
                  }}
                >
                  <m.icon className="w-5 h-5" style={{ color: `hsl(${m.color})` }} />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{m.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-20 px-6 border-t border-border/20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-muted-foreground/50 uppercase tracking-wider font-medium mb-8">
            Powering intelligence across the Williams-Sonoma Inc. portfolio
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              "Williams Sonoma",
              "Pottery Barn",
              "West Elm",
              "PB Kids",
              "PB Teen",
              "Rejuvenation",
              "Mark and Graham",
              "GreenRow",
            ].map((brand) => (
              <span key={brand} className="text-lg md:text-xl font-semibold text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors cursor-default">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to see your supply chain clearly?
          </h2>
          <p className="text-muted-foreground mb-8">
            Explore the full Retail Brain dashboard with live data from all WSI brands.
          </p>
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground
              font-semibold text-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1"
          >
            Launch Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Retail<span className="text-primary font-semibold">Brain</span> · Williams-Sonoma Inc.
            </span>
          </div>
          <span className="text-xs text-muted-foreground/40">Phase 1 · Autonomous Supply Chain Intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
