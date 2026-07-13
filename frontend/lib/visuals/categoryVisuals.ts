// categoryVisual.ts - Icon and visual mapping for categories
import {
  Home,
  Car,
  Heart,
  Briefcase,
  Scissors,
  Dumbbell,
  Wrench,
  Paintbrush,
  Laptop,
  Package,
  Sparkles,
  Droplet,
} from "lucide-react";

// Icon mapping by slug or name
export const iconMap: Record<string, any> = {
  // Cleaning
  "cleaning-services": Home,
  cleaning: Home,
  home: Home,

  // Transportation
  "transportation": Car,
  car: Car,
  vehicle: Car,

  // Beauty & Wellness
  "beauty": Heart,
  "wellness": Heart,
  "health": Heart,
  spa: Heart,

  // Professional Services
  "professional": Briefcase,
  business: Briefcase,
  consulting: Briefcase,

  // Personal Care
  "haircut": Scissors,
  "barber": Scissors,
  "salon": Scissors,

  // Fitness
  "fitness": Dumbbell,
  gym: Dumbbell,
  training: Dumbbell,

  // Repair & Maintenance
  "repair": Wrench,
  maintenance: Wrench,
  plumbing: Wrench,

  // Painting & Decoration
  "painting": Paintbrush,
  decoration: Paintbrush,
  art: Paintbrush,

  // Technology
  "tech": Laptop,
  technology: Laptop,
  it: Laptop,

  // Delivery & Logistics
  "delivery": Package,
  logistics: Package,
  shipping: Package,

  // Other services
  "washing": Droplet,
  "housekeeping": Sparkles,
};

// Gradient mapping by category
export const gradientMap: Record<string, string> = {
  "cleaning-services": "from-blue-500/90 to-sky-600/90",
  "transportation": "from-orange-500/90 to-red-600/90",
  "beauty": "from-pink-500/90 to-rose-600/90",
  "wellness": "from-green-500/90 to-emerald-600/90",
  "professional": "from-purple-500/90 to-indigo-600/90",
  "haircut": "from-yellow-500/90 to-amber-600/90",
  "fitness": "from-red-500/90 to-orange-600/90",
  "repair": "from-gray-500/90 to-slate-600/90",
  "painting": "from-violet-500/90 to-purple-600/90",
  "tech": "from-cyan-500/90 to-blue-600/90",
  "delivery": "from-indigo-500/90 to-blue-600/90",
};

// Image mapping by category slug
export const imageMap: Record<string, string> = {
  "cleaning-services": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600",
  "transportation": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=600",
  "beauty": "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600",
  "wellness": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600",
  "professional": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600",
  "haircut": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600",
  "fitness": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600",
  "repair": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=600",
  "painting": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=600",
  "tech": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600",
  "delivery": "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=600",
};

// Helper function to get icon for a category
export function getCategoryIcon(slug: string, name: string) {
  // Try to match by slug first
  const bySlug = iconMap[slug.toLowerCase()];
  if (bySlug) return bySlug;

  // Try to match by first word of name
  const firstWord = name.toLowerCase().split(' ')[0];
  const byName = iconMap[firstWord];
  if (byName) return byName;

  // Default icon
  return Sparkles;
}

// Helper function to get gradient for a category
export function getCategoryGradient(slug: string) {
  return gradientMap[slug] || "from-primary/90 to-primary-600/90";
}

// Helper function to get image for a category
export function getCategoryImage(slug: string) {
  return imageMap[slug] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600";
}
