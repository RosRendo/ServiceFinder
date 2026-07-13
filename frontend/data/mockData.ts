// Mock data for the customer portal

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  category: string;
  priceRange: string;
  services: Service[];
  gallery: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  companyId: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  companyId: string;
  companyName: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  totalPrice: number;
  staffName?: string;
  notes?: string;
  location: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  serviceName: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  method: string;
  date: string;
}

export interface Review {
  id: string;
  companyId: string;
  companyName: string;
  serviceName: string;
  rating: number;
  text: string;
  date: string;
  customerName: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  loyaltyPoints: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  workerId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export interface Worker {
  id: string;
  name: string;
  avatar: string;
  profession: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  isOnline: boolean;
  completedJobs: number;
  responseTime: string;
  about: string;
  skills: string[];
}

export const categories = [
  "All Categories",
  "Cleaning",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Landscaping",
  "Painting",
  "Moving",
  "Pest Control",
];

export const companies: Company[] = [
  {
    id: "1",
    name: "SparkleClean Pro",
    logoUrl:
      "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=200&h=200&fit=crop",
    rating: 4.8,
    reviewCount: 324,
    location: "Downtown",
    address: "123 Main Street, Suite 100",
    phone: "(555) 123-4567",
    email: "info@sparkleclean.com",
    description:
      "Professional cleaning services for homes and offices. We use eco-friendly products and have over 10 years of experience delivering spotless results.",
    category: "Cleaning",
    priceRange: "$50 - $200",
    services: [
      {
        id: "s1",
        name: "Deep House Cleaning",
        description: "Comprehensive cleaning of all rooms",
        price: 150,
        duration: "3-4 hours",
        companyId: "1",
      },
      {
        id: "s2",
        name: "Office Cleaning",
        description: "Professional office cleaning service",
        price: 200,
        duration: "2-3 hours",
        companyId: "1",
      },
      {
        id: "s3",
        name: "Move-in/Move-out Cleaning",
        description: "Thorough cleaning for transitions",
        price: 250,
        duration: "4-5 hours",
        companyId: "1",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1527515545081-5db817172677?w=400",
    ],
  },
  {
    id: "2",
    name: "FlowFix Plumbing",
    logoUrl:
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=200&h=200&fit=crop",
    rating: 4.6,
    reviewCount: 189,
    location: "Westside",
    address: "456 Oak Avenue",
    phone: "(555) 234-5678",
    email: "service@flowfix.com",
    description:
      "Licensed plumbers available 24/7. From leaky faucets to complete pipe replacements, we handle it all with expertise and care.",
    category: "Plumbing",
    priceRange: "$80 - $500",
    services: [
      {
        id: "s4",
        name: "Drain Cleaning",
        description: "Professional drain unclogging",
        price: 100,
        duration: "1-2 hours",
        companyId: "2",
      },
      {
        id: "s5",
        name: "Pipe Repair",
        description: "Fix leaks and broken pipes",
        price: 150,
        duration: "2-3 hours",
        companyId: "2",
      },
      {
        id: "s6",
        name: "Water Heater Service",
        description: "Installation and repair",
        price: 300,
        duration: "3-4 hours",
        companyId: "2",
      },
    ],
    gallery: [],
  },
  {
    id: "3",
    name: "BrightSpark Electric",
    logoUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&h=200&fit=crop",
    rating: 4.9,
    reviewCount: 256,
    location: "Northside",
    address: "789 Electric Blvd",
    phone: "(555) 345-6789",
    email: "hello@brightspark.com",
    description:
      "Certified electricians for residential and commercial projects. Safety-first approach with competitive pricing.",
    category: "Electrical",
    priceRange: "$100 - $600",
    services: [
      {
        id: "s7",
        name: "Electrical Inspection",
        description: "Complete home electrical assessment",
        price: 120,
        duration: "1-2 hours",
        companyId: "3",
      },
      {
        id: "s8",
        name: "Panel Upgrade",
        description: "Upgrade your electrical panel",
        price: 500,
        duration: "4-6 hours",
        companyId: "3",
      },
      {
        id: "s9",
        name: "Outlet Installation",
        description: "Install new outlets or switches",
        price: 80,
        duration: "1 hour",
        companyId: "3",
      },
    ],
    gallery: [],
  },
  {
    id: "4",
    name: "CoolBreeze HVAC",
    logoUrl:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop",
    rating: 4.7,
    reviewCount: 142,
    location: "Eastside",
    address: "321 Climate Court",
    phone: "(555) 456-7890",
    email: "support@coolbreeze.com",
    description:
      "Expert heating and cooling solutions. Installation, maintenance, and emergency repairs available.",
    category: "HVAC",
    priceRange: "$150 - $800",
    services: [
      {
        id: "s10",
        name: "AC Maintenance",
        description: "Annual AC tune-up and inspection",
        price: 150,
        duration: "1-2 hours",
        companyId: "4",
      },
      {
        id: "s11",
        name: "Furnace Repair",
        description: "Diagnose and fix furnace issues",
        price: 200,
        duration: "2-3 hours",
        companyId: "4",
      },
      {
        id: "s12",
        name: "Duct Cleaning",
        description: "Clean air ducts throughout home",
        price: 350,
        duration: "3-4 hours",
        companyId: "4",
      },
    ],
    gallery: [],
  },
  {
    id: "5",
    name: "GreenThumb Gardens",
    logoUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop",
    rating: 4.5,
    reviewCount: 98,
    location: "Suburbs",
    address: "555 Garden Lane",
    phone: "(555) 567-8901",
    email: "grow@greenthumb.com",
    description:
      "Transform your outdoor space with our landscaping expertise. Design, installation, and maintenance services.",
    category: "Landscaping",
    priceRange: "$100 - $1000",
    services: [
      {
        id: "s13",
        name: "Lawn Mowing",
        description: "Weekly or bi-weekly lawn care",
        price: 50,
        duration: "1 hour",
        companyId: "5",
      },
      {
        id: "s14",
        name: "Garden Design",
        description: "Custom garden planning and planting",
        price: 300,
        duration: "Half day",
        companyId: "5",
      },
      {
        id: "s15",
        name: "Tree Trimming",
        description: "Professional tree maintenance",
        price: 200,
        duration: "2-3 hours",
        companyId: "5",
      },
    ],
    gallery: [],
  },
  {
    id: "6",
    name: "ColorCraft Painters",
    logoUrl:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200&h=200&fit=crop",
    rating: 4.8,
    reviewCount: 176,
    location: "Central",
    address: "888 Palette Place",
    phone: "(555) 678-9012",
    email: "paint@colorcraft.com",
    description:
      "Interior and exterior painting with premium quality paints. Free color consultations available.",
    category: "Painting",
    priceRange: "$200 - $2000",
    services: [
      {
        id: "s16",
        name: "Interior Room Painting",
        description: "Single room painting service",
        price: 300,
        duration: "1 day",
        companyId: "6",
      },
      {
        id: "s17",
        name: "Exterior Painting",
        description: "Full house exterior",
        price: 1500,
        duration: "3-5 days",
        companyId: "6",
      },
      {
        id: "s18",
        name: "Cabinet Refinishing",
        description: "Kitchen cabinet painting",
        price: 800,
        duration: "2-3 days",
        companyId: "6",
      },
    ],
    gallery: [],
  },
];

export const bookings: Booking[] = [
  {
    id: "BK001",
    serviceId: "s1",
    serviceName: "Deep House Cleaning",
    companyId: "1",
    companyName: "SparkleClean Pro",
    date: "2024-01-15",
    time: "09:00 AM",
    status: "completed",
    totalPrice: 150,
    staffName: "Maria Rodriguez",
    location: "123 Customer St, Apt 4B",
  },
  {
    id: "BK002",
    serviceId: "s4",
    serviceName: "Drain Cleaning",
    companyId: "2",
    companyName: "FlowFix Plumbing",
    date: "2024-01-20",
    time: "02:00 PM",
    status: "confirmed",
    totalPrice: 100,
    staffName: "John Smith",
    location: "123 Customer St, Apt 4B",
  },
  {
    id: "BK003",
    serviceId: "s7",
    serviceName: "Electrical Inspection",
    companyId: "3",
    companyName: "BrightSpark Electric",
    date: "2024-01-25",
    time: "10:00 AM",
    status: "pending",
    totalPrice: 120,
    location: "123 Customer St, Apt 4B",
  },
  {
    id: "BK004",
    serviceId: "s10",
    serviceName: "AC Maintenance",
    companyId: "4",
    companyName: "CoolBreeze HVAC",
    date: "2024-01-10",
    time: "11:00 AM",
    status: "canceled",
    totalPrice: 150,
    notes: "Customer requested reschedule",
    location: "123 Customer St, Apt 4B",
  },
];

export const payments: Payment[] = [
  {
    id: "1",
    bookingId: "BK001",
    serviceName: "Deep House Cleaning",
    amount: 150,
    status: "paid",
    method: "Credit Card",
    date: "2024-01-15",
  },
  {
    id: "PAY002",
    bookingId: "BK002",
    serviceName: "Drain Cleaning",
    amount: 100,
    status: "pending",
    method: "Credit Card",
    date: "2024-01-20",
  },
  {
    id: "PAY003",
    bookingId: "BK003",
    serviceName: "Electrical Inspection",
    amount: 120,
    status: "pending",
    method: "PayPal",
    date: "2024-01-25",
  },
];

export const reviews: Review[] = [
  {
    id: "REV001",
    companyId: "1",
    companyName: "SparkleClean Pro",
    serviceName: "Deep House Cleaning",
    rating: 5,
    text: "Absolutely amazing service! Maria was professional, thorough, and left my apartment spotless. Will definitely book again.",
    date: "2024-01-16",
    customerName: "Alex Johnson",
  },
  {
    id: "REV002",
    companyId: "3",
    companyName: "BrightSpark Electric",
    serviceName: "Outlet Installation",
    rating: 4,
    text: "Quick and efficient work. The electrician explained everything clearly. Only minor issue was a slight delay in arrival.",
    date: "2024-01-05",
    customerName: "Alex Johnson",
  },
];

export const userProfile: UserProfile = {
  id: "USR001",
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  phone: "(555) 999-8888",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  loyaltyPoints: 250,
};

export const workers: Worker[] = [
  {
    id: "1",
    name: "James Wilson",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    profession: "Professional Plumber",
    rating: 4.9,
    reviewCount: 127,
    hourlyRate: 45,
    location: "Brooklyn, NY",
    isOnline: true,
    completedJobs: 312,
    responseTime: "Usually responds in 1 hour",
    about:
      "Licensed plumber with 12+ years of experience. Specializing in residential and commercial plumbing repairs, installations, and emergency services. I take pride in quality work and customer satisfaction.",
    skills: [
      "Pipe Repair",
      "Drain Cleaning",
      "Water Heater",
      "Fixture Installation",
      "Emergency Services",
    ],
  },
  {
    id: "2",
    name: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    profession: "Interior Designer",
    rating: 4.8,
    reviewCount: 89,
    hourlyRate: 75,
    location: "Manhattan, NY",
    isOnline: false,
    completedJobs: 156,
    responseTime: "Usually responds in 2 hours",
    about:
      "Award-winning interior designer transforming spaces for over 8 years. From cozy apartments to luxury penthouses, I bring your vision to life with attention to detail and timeless design.",
    skills: [
      "Space Planning",
      "Color Consultation",
      "Furniture Selection",
      "Lighting Design",
      "3D Rendering",
    ],
  },
  {
    id: "3",
    name: "Marcus Johnson",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    profession: "Electrician",
    rating: 5.0,
    reviewCount: 203,
    hourlyRate: 55,
    location: "Queens, NY",
    isOnline: true,
    completedJobs: 478,
    responseTime: "Usually responds in 30 mins",
    about:
      "Master electrician licensed and insured. Handling everything from simple outlet repairs to complete home rewiring. Safety and quality are my top priorities.",
    skills: [
      "Wiring",
      "Panel Upgrades",
      "Lighting",
      "Smart Home",
      "Inspections",
    ],
  },
];

export const currentUserId = "user-1";

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    workerId: "1",
    lastMessage: "Thanks for reaching out! I can come by tomorrow afternoon.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    unreadCount: 2,
  },
  {
    id: "conv-2",
    workerId: "3",
    lastMessage: "The job is complete. Let me know if you need anything else!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
    unreadCount: 0,
  },
];

export const messages: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "m1",
      senderId: currentUserId,
      text: "Hi James, I have a leaky faucet in my kitchen. Are you available this week?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      isRead: true,
    },
    {
      id: "m2",
      senderId: "1",
      text: "Hello! Yes, I'd be happy to help with that. Can you describe the issue?",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      isRead: true,
    },
    {
      id: "m3",
      senderId: currentUserId,
      text: "It's been dripping constantly for about a week now. Getting worse.",
      timestamp: new Date(Date.now() - 1000 * 60 * 40),
      isRead: true,
    },
    {
      id: "m4",
      senderId: "1",
      text: "Thanks for reaching out! I can come by tomorrow afternoon.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: false,
    },
  ],
  "conv-2": [
    {
      id: "m5",
      senderId: currentUserId,
      text: "Hi Marcus, I need some outlets installed in my home office.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      isRead: true,
    },
    {
      id: "m6",
      senderId: "3",
      text: "The job is complete. Let me know if you need anything else!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      isRead: true,
    },
  ],
};
