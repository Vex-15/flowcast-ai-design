<div align="center">

# Flowcast

### Autonomous Retail Intelligence Platform

**AI-driven demand forecasting, inventory orchestration, and pricing intelligence for Williams-Sonoma Inc.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-ML_Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-ML_Models-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

*Built for the Williams-Sonoma Hackathon 2026*

</div>

---

## What is Flowcast?

Flowcast is a **next-generation supply-chain intelligence dashboard** that transforms raw supply chain data into actionable insights across Williams-Sonoma's entire brand portfolio — from KitchenAid mixers at Williams Sonoma to Le Creuset cookware at Pottery Barn.

It combines **edge-trained machine learning models** with **premium micro-animated interfaces** to give supply chain operators, merchandisers, and executives a real-time decision cockpit.

### The Problem

Retail supply chain teams are drowning in data but starving for insight. Decisions around *how much to order*, *when to discount*, and *which SKUs need attention* are made across fragmented spreadsheets with no predictive context. Stockouts cost revenue. Overstocks erode margin. Blind spots compound.

### The Solution

Flowcast unifies **demand forecasting**, **anomaly detection**, **price elasticity modeling**, **registry demand intelligence**, and **inventory orchestration** into a single, high-performance interface — powered by ML models that learn from every SKU's unique behavior.

---

## Key Features

### Executive Overview
Real-time KPI strip with animated count-up transitions, progress bar sweeps, and ambient micro-sparklines. Priority SKU risk table with composite scoring across 56 products.

### Predictive Demand Forecasting
- **Random Forest Regressor** trained per-SKU with seasonal, promotional, and weather features
- 7-day and 14-day forecast horizons with 90% confidence intervals
- Draw-on SVG line animations via MutationObserver
- Demand decomposition waterfall (base + festival + promo + weather)

### SKU Deep Dive Workspace
- **Health Score Gauge** — composite metric (0–100) from stockout risk, velocity, and forecast accuracy
- **Sliding tab pill** with crossfade panel transitions
- **Animated waterfall chart** for demand decomposition
- Inventory orchestration with reorder recommendations

### Price Elasticity Intelligence
- 13-point demand-price response curve with dual Y-axis (units + revenue)
- **Revenue ↔ Profit curve morph** — smooth rAF-driven bar interpolation on mode toggle
- **Dual-handle sweet-spot slider** with live discount range readouts
- Competitor pricing trend analysis with undercut detection
- Seasonal elasticity gauge and pricing strategy recommendations

### Registry Demand Intelligence
- Structured demand forecasting from active gift registries (wedding, baby, housewarming)
- 8-week stacked wave chart (organic + registry)
- Event card carousel with staggered slide-in animations
- Inventory gap projection with animated fill bars

### Explainability Layer
- Multi-agent signal fusion (social, weather, competitor, registry, return signals)
- Feature importance visualization
- Intent spike predictor with countdown arc

### Catalog Intelligence
- Cross-brand SKU catalog with search, filtering, and category views
- Return risk classification and migration risk assessment
- SKU health indicators with pulsing status badges

---

## Architecture

```
flowcast-ai-design/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── executive/            # Executive overview + KPI strip
│   │   ├── demand/               # Forecast chart + decomposition
│   │   ├── skuDeepDive/          # SKU workspace + tabs
│   │   ├── pricing/              # Price elasticity intelligence
│   │   ├── catalog/              # Catalog intel views
│   │   ├── inventory/            # Inventory orchestration
│   │   ├── signals/              # Signal fusion panels
│   │   ├── simulation/           # What-if scenario simulator
│   │   ├── explainability/       # Model explainability
│   │   ├── notifications/        # Alert system
│   │   ├── returns/              # Return risk analysis
│   │   └── layout/               # App shell + sidebar
│   ├── data/
│   │   ├── brands.ts             # 8 brands, 56 SKUs, 8 stores
│   │   ├── generators.ts         # Statistically-grounded data generators
│   │   └── types.ts              # Full TypeScript type system
│   ├── hooks/
│   │   └── useRetailBrain.ts     # Central state + ML bridge
│   └── pages/
│       ├── Index.tsx              # Landing page
│       └── Dashboard.tsx          # Main dashboard shell
│
├── backend/                      # ML Backend (Python + FastAPI)
│   ├── main.py                   # API server + model lifecycle
│   ├── models/
│   │   ├── demand_model.py       # Random Forest demand forecasting
│   │   ├── return_model.py       # Logistic Regression return risk
│   │   └── anomaly_model.py      # Isolation Forest anomaly detection
│   ├── services/
│   │   └── data_service.py       # Synthetic training data generation
│   └── requirements.txt
│
└── start_ml_backend.ps1          # One-click backend launcher
```

---

## ML Models

| Model | Algorithm | Purpose | Features |
|-------|-----------|---------|----------|
| **Demand Forecaster** | Random Forest Regressor | Predict daily unit demand per SKU | day_of_week, month, is_weekend, is_holiday, promo_active, weather_score, trend, base_demand |
| **Return Risk** | Logistic Regression | Classify return probability | price, category_encoded, avg_rating, days_since_purchase, is_gift, season |
| **Anomaly Detector** | Isolation Forest | Detect demand anomalies | demand, rolling_avg, rolling_std, day_of_week, price |

All models are trained on-the-fly at server startup with synthetic data that mirrors Williams-Sonoma's actual product catalog structure and seasonal patterns.

---

## Animation System

Flowcast features a **production-grade animation layer** built entirely with native browser APIs:

| Technique | Where Used |
|-----------|------------|
| `requestAnimationFrame` count-up | KPI values, health scores, gauges |
| CSS `cubic-bezier(0.16,1,0.3,1)` | All ease-out transitions system-wide |
| `MutationObserver` + `strokeDashoffset` | Recharts SVG draw-on line animations |
| `setPointerCapture` drag handling | Dual-handle sweet-spot slider |
| Staggered `animationDelay` | KPI cards, event pills, registry cards |
| `ResizeObserver` | Sliding tab indicator pill recalculation |
| rAF-driven interpolation | Revenue ↔ Profit curve morph (600ms) |
| CSS keyframe injection | Registry demand section animations |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (or **Bun** ≥ 1.0)
- **Python** ≥ 3.9 (for ML backend)
- **pip** (Python package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/Arnav-Shende007/flowcast-ai-design.git
cd flowcast-ai-design
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Start the ML Backend

```powershell
# Windows (PowerShell)
.\start_ml_backend.ps1

# Or manually:
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The backend will:
- Train all three ML models on startup (~2-3 seconds)
- Expose REST endpoints at `http://localhost:8000`
- Auto-reload on file changes

### 4. Start the Frontend

```bash
npm run dev
```

The app launches at **http://localhost:8080**

> **Note:** The frontend works fully without the backend — it falls back to local statistical generators if the API is unreachable. The backend adds real ML predictions.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict/demand` | POST | Predict demand for a given SKU + horizon |
| `/predict/return-risk` | POST | Classify return probability for an order |
| `/predict/anomalies` | POST | Detect anomalies in a demand time series |
| `/health` | GET | Backend health check + model status |
| `/docs` | GET | Interactive Swagger API documentation |

---

## Brand Portfolio

Flowcast models the complete Williams-Sonoma Inc. portfolio:

| Brand | Code | SKUs | Categories |
|-------|------|------|------------|
| Williams Sonoma | WS | 8 | Appliances, Cookware, Cutlery, Bakeware |
| Pottery Barn | PB | 8 | Living Room, Bedroom, Dining, Outdoor |
| West Elm | WE | 8 | Furniture, Lighting, Decor, Rugs |
| Pottery Barn Kids | PBK | 8 | Nursery, Bedding, Decor, Furniture |
| Pottery Barn Teen | PBT | 8 | Bedding, Furniture, Decor, Lighting |
| Rejuvenation | REJ | 4 | Lighting, Hardware |
| Mark and Graham | MG | 4 | Accessories, Home |
| GreenRow | GR | 4 | Sustainable Living |

**56 SKUs** across **8 brands** with store-level inventory across **8 flagship locations**.

---

## Tech Stack

### Frontend
- **React 18** — Component architecture with hooks
- **TypeScript 5.8** — End-to-end type safety
- **Vite 5** — Sub-second HMR and optimized builds
- **Tailwind CSS 3** — Utility-first styling with custom design tokens
- **Recharts** — Composable charting (ComposedChart, Line, Bar, Area)
- **Radix UI** — Accessible primitives (dialogs, tooltips, dropdowns)
- **Lucide React** — Icon system (120+ icons used)
- **React Router 6** — Client-side routing

### Backend
- **FastAPI** — High-performance async Python API
- **scikit-learn** — Random Forest, Logistic Regression, Isolation Forest
- **pandas + NumPy** — Data manipulation and feature engineering
- **Uvicorn** — ASGI server with hot reload

### Tooling
- **ESLint 9** — Code quality
- **Vitest** — Unit testing
- **Playwright** — E2E testing
- **PostCSS + Autoprefixer** — CSS processing

---

## Screenshots

| View | Description |
|------|-------------|
| **Executive Overview** | KPI strip with sparklines, priority SKUs, live alerts |
| **Demand Intelligence** | Forecast chart with confidence bands, decomposition |
| **SKU Workspace** | Health gauge, product performance, waterfall chart |
| **Price Elasticity** | Demand curve, sweet-spot slider, competitor analysis |
| **Registry Demand** | Event timeline, wave chart, inventory gap projection |
| **Catalog Intel** | Cross-brand SKU table with risk badges |

---

## Development

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## License

This project was built for the **Williams-Sonoma Design Hackathon 2026**.

---

<div align="center">

**Built with ❤️ by Team Recursive Rebels**

*Turning supply chain chaos into intelligent action.*

</div>