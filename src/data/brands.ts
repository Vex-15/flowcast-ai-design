import type { Brand, SKU, Store } from "./types";

// ─── Brands ───────────────────────────────────────────────
export const brands: Brand[] = [
  { id: "ws",   name: "Williams Sonoma",    shortName: "WS",   color: "215 90% 60%",  icon: "🍳" },
  { id: "pb",   name: "Pottery Barn",       shortName: "PB",   color: "32 85% 55%",   icon: "🛋️" },
  { id: "we",   name: "West Elm",           shortName: "WE",   color: "160 60% 45%",  icon: "🪑" },
  { id: "pbk",  name: "Pottery Barn Kids",  shortName: "PBK",  color: "280 60% 60%",  icon: "🧒" },
  { id: "pbt",  name: "Pottery Barn Teen",  shortName: "PBT",  color: "340 70% 55%",  icon: "🎧" },
  { id: "rej",  name: "Rejuvenation",       shortName: "REJ",  color: "45 80% 50%",   icon: "💡" },
  { id: "mg",   name: "Mark and Graham",    shortName: "MG",   color: "200 70% 50%",  icon: "🎁" },
  { id: "gr",   name: "GreenRow",           shortName: "GR",   color: "140 50% 45%",  icon: "🌿" },
];

// ─── Stores ───────────────────────────────────────────────
export const stores: Store[] = [
  { id: "sf",      name: "San Francisco Flagship", city: "San Francisco", state: "CA" },
  { id: "nyc",     name: "NYC SoHo",               city: "New York",     state: "NY" },
  { id: "la",      name: "Beverly Hills",           city: "Los Angeles",  state: "CA" },
  { id: "chi",     name: "Michigan Avenue",          city: "Chicago",      state: "IL" },
  { id: "dal",     name: "NorthPark Center",         city: "Dallas",       state: "TX" },
  { id: "sea",     name: "University Village",       city: "Seattle",      state: "WA" },
  { id: "atl",     name: "Lenox Square",             city: "Atlanta",      state: "GA" },
  { id: "bos",     name: "Copley Place",             city: "Boston",       state: "MA" },
];

// ─── SKU Catalog ──────────────────────────────────────────
export const skuCatalog: SKU[] = [
  // Williams Sonoma
  { id: "ws-001", name: "KitchenAid Artisan Stand Mixer",    category: "Appliances",     brand: "ws",  price: 449.95,  stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["holiday","wedding"],   returnRiskBase: 0.04 },
  { id: "ws-002", name: "Le Creuset Dutch Oven 5.5qt",       category: "Cookware",       brand: "ws",  price: 419.95,  stores: ["sf","nyc","la","chi","sea","bos"],             seasonalPeak: ["holiday"],             returnRiskBase: 0.03 },
  { id: "ws-003", name: "Breville Barista Express",          category: "Appliances",     brand: "ws",  price: 749.95,  stores: ["sf","nyc","la","chi","sea"],                   seasonalPeak: ["holiday","fathers"],    returnRiskBase: 0.06 },
  { id: "ws-004", name: "Wüsthof Classic 7-Piece Knife Set", category: "Cutlery",        brand: "ws",  price: 599.95,  stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["holiday","wedding"],   returnRiskBase: 0.02 },

  // Pottery Barn
  { id: "pb-001", name: "York Slope Arm Sofa",               category: "Living Room",    brand: "pb",  price: 2199.00, stores: ["sf","nyc","la","chi","dal","atl"],             seasonalPeak: ["spring","holiday"],     returnRiskBase: 0.12 },
  { id: "pb-002", name: "Belgian Flax Linen Duvet Cover",    category: "Bedding",        brand: "pb",  price: 279.00,  stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["spring"],              returnRiskBase: 0.15 },
  { id: "pb-003", name: "PB Classic Glass Lanterns Set",      category: "Decor",          brand: "pb",  price: 149.00,  stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["summer","holiday"],     returnRiskBase: 0.05 },
  { id: "pb-004", name: "Pearce Roll Arm Sectional",         category: "Living Room",    brand: "pb",  price: 3499.00, stores: ["sf","nyc","la","chi"],                         seasonalPeak: ["spring","holiday"],     returnRiskBase: 0.18 },

  // West Elm
  { id: "we-001", name: "Mid-Century Nightstand",            category: "Bedroom",        brand: "we",  price: 449.00,  stores: ["sf","nyc","la","chi","sea","atl"],             seasonalPeak: ["spring","back-to-school"], returnRiskBase: 0.08 },
  { id: "we-002", name: "Harmony Sofa 82\"",                 category: "Living Room",    brand: "we",  price: 1799.00, stores: ["sf","nyc","la","chi","dal","sea"],             seasonalPeak: ["spring"],              returnRiskBase: 0.14 },
  { id: "we-003", name: "Terrace Outdoor Dining Table",      category: "Outdoor",        brand: "we",  price: 899.00,  stores: ["sf","la","dal","atl"],                         seasonalPeak: ["spring","summer"],      returnRiskBase: 0.07 },
  { id: "we-004", name: "Andes Leather Ottoman",             category: "Living Room",    brand: "we",  price: 799.00,  stores: ["sf","nyc","la","chi","sea"],                   seasonalPeak: ["holiday"],             returnRiskBase: 0.10 },

  // Pottery Barn Kids
  { id: "pbk-001", name: "Camp Twin-Over-Twin Bunk Bed",     category: "Beds",           brand: "pbk", price: 1299.00, stores: ["sf","nyc","la","chi","dal","atl"],             seasonalPeak: ["back-to-school"],       returnRiskBase: 0.09 },
  { id: "pbk-002", name: "Organic Cotton Sheet Set — Twin",  category: "Bedding",        brand: "pbk", price: 89.00,   stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["back-to-school","spring"], returnRiskBase: 0.06 },
  { id: "pbk-003", name: "Anywhere Chair® — Sherpa",         category: "Seating",        brand: "pbk", price: 199.00,  stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["holiday"],             returnRiskBase: 0.04 },

  // Pottery Barn Teen
  { id: "pbt-001", name: "Cushy Lounge Sectional Set",       category: "Seating",        brand: "pbt", price: 1599.00, stores: ["sf","nyc","la","chi","dal"],                   seasonalPeak: ["back-to-school"],       returnRiskBase: 0.11 },
  { id: "pbt-002", name: "Superstorage Loft Bed",            category: "Beds",           brand: "pbt", price: 2199.00, stores: ["sf","nyc","la","chi"],                         seasonalPeak: ["back-to-school","summer"], returnRiskBase: 0.13 },

  // Rejuvenation
  { id: "rej-001", name: "Eastmoreland Pendant Light",       category: "Lighting",       brand: "rej", price: 349.00,  stores: ["sf","nyc","la","sea"],                         seasonalPeak: ["spring","holiday"],     returnRiskBase: 0.05 },
  { id: "rej-002", name: "Vintage Schoolhouse Sconce",       category: "Lighting",       brand: "rej", price: 189.00,  stores: ["sf","nyc","la","chi","sea","bos"],             seasonalPeak: ["spring"],              returnRiskBase: 0.03 },
  { id: "rej-003", name: "Latham Knob Collection",           category: "Hardware",       brand: "rej", price: 24.00,   stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["spring","summer"],      returnRiskBase: 0.02 },

  // Mark and Graham
  { id: "mg-001",  name: "Monogrammed Leather Weekender",    category: "Travel",         brand: "mg",  price: 399.00,  stores: ["sf","nyc","la","chi","dal","atl"],             seasonalPeak: ["holiday","mothers","fathers"], returnRiskBase: 0.06 },
  { id: "mg-002",  name: "Personalized Jewelry Box",         category: "Accessories",    brand: "mg",  price: 149.00,  stores: ["sf","nyc","la","chi","dal","sea","atl","bos"], seasonalPeak: ["holiday","valentines","mothers"], returnRiskBase: 0.04 },

  // GreenRow
  { id: "gr-001",  name: "Sustainably Sourced Linen Sofa",   category: "Living Room",    brand: "gr",  price: 2499.00, stores: ["sf","nyc","la","sea"],                         seasonalPeak: ["spring"],              returnRiskBase: 0.10 },
  { id: "gr-002",  name: "Reclaimed Wood Dining Table",      category: "Dining",         brand: "gr",  price: 1899.00, stores: ["sf","nyc","la"],                               seasonalPeak: ["spring","holiday"],     returnRiskBase: 0.08 },
];

// ─── Helpers ──────────────────────────────────────────────
export const getBrand = (id: string): Brand =>
  brands.find((b) => b.id === id) || brands[0];

export const getSKU = (id: string): SKU =>
  skuCatalog.find((s) => s.id === id) || skuCatalog[0];

export const getStore = (id: string): Store =>
  stores.find((s) => s.id === id) || stores[0];

export const getSKUsByBrand = (brandId: string): SKU[] =>
  skuCatalog.filter((s) => s.brand === brandId);

export const getAllBrandIds = (): string[] => brands.map((b) => b.id);
