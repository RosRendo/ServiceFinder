export interface TradeImageAsset {
  id: string;
  category: string;
  title: string;
  imageUrl: string;
  badge: string;
  technicianName: string;
  rating: number;
}

export interface BeforeAfterPair {
  id: string;
  titleEn: string;
  titleKh: string;
  beforeUrl: string;
  afterUrl: string;
  beforeLabelEn: string;
  beforeLabelKh: string;
  afterLabelEn: string;
  afterLabelKh: string;
  trade: string;
}

export interface MapDistrictNode {
  id: string;
  nameEn: string;
  nameKh: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  zone: string;
}

export interface SimulatedDispatchOrder {
  id: string;
  orderNumber: string;
  titleEn: string;
  titleKh: string;
  technicianName: string;
  tradeSpecialtyEn: string;
  tradeSpecialtyKh: string;
  districtId: string;
  districtNameEn: string;
  districtNameKh: string;
  amountUsd: number;
  etaMinutes: number;
  status: 'dispatched' | 'in_progress' | 'settled';
  pathD: string;
  vehicleCoord: { x: number; y: number };
}

// Curated high-resolution professional trade photography (WebP / high quality)
export const TRADE_IMAGES: Record<string, TradeImageAsset> = {
  ac: {
    id: "ac",
    category: "air-conditioning",
    title: "Air Conditioning (HVAC)",
    imageUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    badge: "Certified HVAC Techs",
    technicianName: "Sokha V.",
    rating: 4.9,
  },
  electrical: {
    id: "electrical",
    category: "electrical",
    title: "Electrical & Wiring",
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    badge: "Licensed Electricians",
    technicianName: "Dara C.",
    rating: 4.95,
  },
  plumbing: {
    id: "plumbing",
    category: "plumbing",
    title: "Plumbing & Drainage",
    imageUrl:
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
    badge: "Master Plumbers",
    technicianName: "Piseth M.",
    rating: 4.88,
  },
  cleaning: {
    id: "cleaning",
    category: "cleaning",
    title: "Deep Residential & Office Cleaning",
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    badge: "Background-Checked Crew",
    technicianName: "Sreypov C.",
    rating: 4.92,
  },
  handyman: {
    id: "handyman",
    category: "handyman",
    title: "Appliance & Handyman",
    imageUrl:
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
    badge: "Multi-Trade Specialists",
    technicianName: "Vannak T.",
    rating: 4.85,
  },
  solar: {
    id: "solar",
    category: "solar",
    title: "Solar Energy & Inverters",
    imageUrl:
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
    badge: "Clean Energy Certified",
    technicianName: "Kosal R.",
    rating: 4.96,
  },
};

// Before & After Transformation Scenarios
export const BEFORE_AFTER_SHOWCASE: BeforeAfterPair[] = [
  {
    id: "ac-coil",
    trade: "Air Conditioning",
    titleEn: "HVAC Evaporator Coil Chemical Deep Clean",
    titleKh: "ការលាងសម្អាតកម្ទេចធូលី និងមេរោគក្នុងម៉ាស៊ីនត្រជាក់",
    beforeUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    afterUrl:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    beforeLabelEn: "Before (Dust & Mold Clogged)",
    beforeLabelKh: "មុនជួសជុល (ធូលី និងស្ទះខ្យល់)",
    afterLabelEn: "After (99% Airflow Restored)",
    afterLabelKh: "ក្រោយជួសជុល (ខ្យល់ត្រជាក់ស្អាត ៩៩%)",
  },
  {
    id: "deep-cleaning",
    trade: "Cleaning Services",
    titleEn: "Post-Renovation Living Space Transformation",
    titleKh: "ការសម្អាតគេហដ្ឋានក្រោយការសាងសង់រួចរាល់",
    beforeUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    afterUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    beforeLabelEn: "Before (Construction Residue)",
    beforeLabelKh: "មុនសម្អាត (ធូលីកំបោរ និងកម្ទេចថ្ម)",
    afterLabelEn: "After (Move-in Ready Pristine)",
    afterLabelKh: "ក្រោយសម្អាត (ស្អាតភ្លឺចែងចាំង ត្រៀមចូលនៅ)",
  },
];

// Phnom Penh Stylized Vector Map Landmarks & Coordinates (viewBox 0 0 500 320)
export const PHNOM_PENH_DISTRICTS: MapDistrictNode[] = [
  {
    id: "tk",
    nameEn: "Toul Kork",
    nameKh: "ទួលគោក",
    x: 28,
    y: 35,
    zone: "Commercial / Residential",
  },
  {
    id: "bkk1",
    nameEn: "BKK 1",
    nameKh: "បឹងកេងកង ១",
    x: 58,
    y: 62,
    zone: "Embassy / High-End",
  },
  {
    id: "dp",
    nameEn: "Daun Penh",
    nameKh: "ដូនពេញ",
    x: 62,
    y: 32,
    zone: "Business Center / Riverside",
  },
  {
    id: "ss",
    nameEn: "Sen Sok",
    nameKh: "សែនសុខ",
    x: 18,
    y: 20,
    zone: "Aeon 2 / Gated Boreys",
  },
  {
    id: "cc",
    nameEn: "Chroy Changvar",
    nameKh: "ជ្រោយចង្វារ",
    x: 75,
    y: 18,
    zone: "Peninsula Development",
  },
];

// Active Simulated Dispatch Orders
export const SIMULATED_DISPATCH_ORDERS: SimulatedDispatchOrder[] = [
  {
    id: "wo-8421",
    orderNumber: "WO-8421",
    titleEn: "AC Chemical Deep Wash & Gas Recharge",
    titleKh: "លាងម៉ាស៊ីនត្រជាក់ និងបញ្ចូលហ្គាស R32",
    technicianName: "Sokha Vireak",
    tradeSpecialtyEn: "Senior HVAC Technician",
    tradeSpecialtyKh: "ជាងម៉ាស៊ីនត្រជាក់ជាន់ខ្ពស់",
    districtId: "tk",
    districtNameEn: "Toul Kork (St. 289)",
    districtNameKh: "ទួលគោក (ផ្លូវ ២៨៩)",
    amountUsd: 45.0,
    etaMinutes: 8,
    status: "dispatched",
    pathD: "M 90 65 Q 120 90 140 112",
    vehicleCoord: { x: 120, y: 92 },
  },
  {
    id: "wo-8422",
    orderNumber: "WO-8422",
    titleEn: "Main Breaker Diagnostic & Power Restoration",
    titleKh: "ជួសជុលទុស្សេឌីសង់ទ័រ និងប្រព័ន្ធភ្លើងមេ",
    technicianName: "Dara Chem",
    tradeSpecialtyEn: "Licensed Electrician",
    tradeSpecialtyKh: "ជាងអគ្គិសនីមានអាជ្ញាប័ណ្ណ",
    districtId: "bkk1",
    districtNameEn: "BKK 1 (St. 310)",
    districtNameKh: "បឹងកេងកង ១ (ផ្លូវ ៣១០)",
    amountUsd: 65.0,
    etaMinutes: 0,
    status: "settled",
    pathD: "M 220 180 Q 260 190 290 200",
    vehicleCoord: { x: 290, y: 200 },
  },
  {
    id: "wo-8423",
    orderNumber: "WO-8423",
    titleEn: "Water Pump Pressure Valve Replacement",
    titleKh: "ប្តូរវ៉ានសម្ពាធម៉ូទ័រទឹក និងទុយោមេ",
    technicianName: "Piseth Mao",
    tradeSpecialtyEn: "Certified Plumber",
    tradeSpecialtyKh: "ជាងទុយោទឹកជំនាញ",
    districtId: "ss",
    districtNameEn: "Sen Sok (Borey Peng Huoth)",
    districtNameKh: "សែនសុខ (បុរី ប៉េង ហួត)",
    amountUsd: 38.0,
    etaMinutes: 14,
    status: "in_progress",
    pathD: "M 60 40 Q 75 55 90 65",
    vehicleCoord: { x: 75, y: 55 },
  },
];
