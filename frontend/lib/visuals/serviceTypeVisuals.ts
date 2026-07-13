// serviceTypeVisuals.ts - Dynamic icon and visual mapping for service types
import {
  Home,
  Building2,
  Sparkles,
  Truck,
  Waves,
  ChefHat,
  ShowerHead,
  Zap,
  Wrench,
  Paintbrush,
  Hammer,
  Wind,
  Droplet,
  Leaf,
  Car,
  Package,
  Scissors,
  Heart,
  Dumbbell,
  Laptop,
  Settings,
  Router,
  CloudLightning,
} from "lucide-react";

// Icon mapping by slug or keywords
export const serviceTypeIconMap: Record<string, any> = {
  // Cleaning
  residential: Home,
  commercial: Building2,
  deep: Sparkles,
  "move-in": Truck,
  "move-out": Truck,
  move: Truck,
  carpet: Waves,
  upholstery: Waves,
  kitchen: ChefHat,
  bathroom: ShowerHead,
  window: Sparkles,

  // Repair & Maintenance
  plumbing: ShowerHead,
  electrical: Zap,
  repair: Wrench,
  maintenance: Wrench,
  hvac: Wind,
  "air-conditioning": Wind,
  heating: Wind,
  painting: Paintbrush,
  carpentry: Hammer,

  // Home Services
  lawn: Leaf,
  garden: Leaf,
  landscaping: Leaf,
  pest: CloudLightning,

  // Transportation
  taxi: Car,
  delivery: Package,
  moving: Truck,

  // Personal Care
  haircut: Scissors,
  salon: Scissors,
  spa: Heart,
  massage: Heart,

  // Fitness
  training: Dumbbell,
  fitness: Dumbbell,
  gym: Dumbbell,

  // Technology
  it: Laptop,
  tech: Laptop,
  computer: Laptop,
  network: Router,
  wifi: Router,

  // Default
  general: Settings,
};

// Gradient mapping
export const serviceTypeGradientMap: Record<string, string> = {
  residential: "from-sky-500/90 to-blue-600/90",
  commercial: "from-violet-500/90 to-purple-600/90",
  deep: "from-amber-500/90 to-orange-600/90",
  "move-in": "from-emerald-500/90 to-green-600/90",
  "move-out": "from-emerald-500/90 to-green-600/90",
  move: "from-emerald-500/90 to-green-600/90",
  carpet: "from-pink-500/90 to-rose-600/90",
  upholstery: "from-pink-500/90 to-rose-600/90",
  kitchen: "from-red-500/90 to-orange-600/90",
  bathroom: "from-cyan-500/90 to-blue-600/90",
  window: "from-sky-500/90 to-cyan-600/90",
  plumbing: "from-cyan-500/90 to-blue-600/90",
  electrical: "from-yellow-500/90 to-amber-600/90",
  repair: "from-gray-500/90 to-slate-600/90",
  maintenance: "from-gray-500/90 to-slate-600/90",
  hvac: "from-indigo-500/90 to-blue-600/90",
  painting: "from-purple-500/90 to-pink-600/90",
  carpentry: "from-orange-500/90 to-red-600/90",
  lawn: "from-green-500/90 to-emerald-600/90",
  garden: "from-green-500/90 to-lime-600/90",
  landscaping: "from-green-600/90 to-teal-600/90",
  taxi: "from-yellow-500/90 to-orange-600/90",
  delivery: "from-blue-500/90 to-indigo-600/90",
  haircut: "from-amber-500/90 to-yellow-600/90",
  salon: "from-pink-500/90 to-rose-600/90",
  spa: "from-rose-500/90 to-pink-600/90",
  massage: "from-purple-500/90 to-pink-600/90",
  training: "from-red-500/90 to-orange-600/90",
  fitness: "from-orange-500/90 to-red-600/90",
  it: "from-cyan-500/90 to-blue-600/90",
  tech: "from-blue-500/90 to-cyan-600/90",
  computer: "from-indigo-500/90 to-blue-600/90",
};

// Image mapping
export const serviceTypeImageMap: Record<string, string> = {
  residential: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600",
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600",
  deep: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600",
  "move-in": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600",
  "move-out": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600",
  move: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600",
  carpet: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600",
  upholstery: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600",
  kitchen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=600",
  bathroom: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=600",
  plumbing: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600",
  electrical: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600",
  repair: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=600",
  maintenance: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=600",
  painting: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=600",
  carpentry: "https://images.unsplash.com/photo-1606137991226-b1c92f6ee3c7?q=80&w=600",
  lawn: "https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=600",
  garden: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600",
  landscaping: "https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=600",
  taxi: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=600",
  delivery: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=600",
  haircut: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600",
  salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600",
  training: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600",
  it: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600",
  tech: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600",
};

// Helper function to get icon for service type
export function getServiceTypeIcon(slug: string, name: string) {
  // Try exact slug match
  const bySlug = serviceTypeIconMap[slug.toLowerCase()];
  if (bySlug) return bySlug;

  // Try partial slug match (e.g., "move-in-cleaning" contains "move")
  const partialMatch = Object.keys(serviceTypeIconMap).find(key =>
    slug.toLowerCase().includes(key) || key.includes(slug.toLowerCase())
  );
  if (partialMatch) return serviceTypeIconMap[partialMatch];

  // Try first word of name
  const firstWord = name.toLowerCase().split(' ')[0];
  const byName = serviceTypeIconMap[firstWord];
  if (byName) return byName;

  // Default icon
  return Sparkles;
}

// Helper function to get gradient
export function getServiceTypeGradient(slug: string) {
  // Try exact match
  const exact = serviceTypeGradientMap[slug];
  if (exact) return exact;

  // Try partial match
  const partialMatch = Object.keys(serviceTypeGradientMap).find(key =>
    slug.toLowerCase().includes(key) || key.includes(slug.toLowerCase())
  );
  if (partialMatch) return serviceTypeGradientMap[partialMatch];

  // Default gradient
  return "from-primary/90 to-primary-600/90";
}

// Helper function to get image
export function getServiceTypeImage(slug: string) {
  // Try exact match
  const exact = serviceTypeImageMap[slug];
  if (exact) return exact;

  // Try partial match
  const partialMatch = Object.keys(serviceTypeImageMap).find(key =>
    slug.toLowerCase().includes(key) || key.includes(slug.toLowerCase())
  );
  if (partialMatch) return serviceTypeImageMap[partialMatch];

  // Default image
  return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600";
}
