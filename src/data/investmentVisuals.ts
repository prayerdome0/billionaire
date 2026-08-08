/**
 * Investment Visual Stories — real photos showing school building, AI, real estate, agriculture, solar, tech hubs
 * All images use Pexels CDN (same source as existing hero images) — free to use, no keys.
 */

export interface InvestmentPhoto {
  id: string;
  title: string;
  category: "School Building" | "AI Business" | "Real Estate" | "Solar Energy" | "Agriculture" | "Tech Hub" | "Finance";
  location: string;
  image: string;
  description: string;
  stats: { label: string; value: string }[];
  color: string;
}

export const investmentPhotos: InvestmentPhoto[] = [
  {
    id: "school-1",
    title: "Modern STEM Classroom Construction",
    category: "School Building",
    location: "Lusaka, Zambia",
    image: "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "State-of-the-art STEM classrooms with solar power and AI-ready fiber — part of Seedwel Phase 1. 15 campuses planned across Lusaka & Copperbelt.",
    stats: [{ label: "Students/Campus", value: "800+" }, { label: "Solar", value: "100%" }, { label: "Jobs Created", value: "120+" }],
    color: "from-amber-400 to-yellow-500"
  },
  {
    id: "school-2",
    title: "Library & Digital Learning Center",
    category: "School Building",
    location: "Copperbelt University Partnership",
    image: "https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "Digital libraries with 10,000+ e-books, Starlink-backed connectivity, and AI tutoring stations.",
    stats: [{ label: "Books", value: "10k+" }, { label: "E-Learning", value: "24/7" }, { label: "Connectivity", value: "Fiber" }],
    color: "from-sky-400 to-blue-500"
  },
  {
    id: "school-3",
    title: "Science Laboratory Build",
    category: "School Building",
    location: "Ndola, Zambia",
    image: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "Fully equipped chemistry, physics, and biology labs — creating Africa's next generation of scientists.",
    stats: [{ label: "Labs", value: "3 per campus" }, { label: "Equipment", value: "Global Std" }, { label: "Safety", value: "ISO" }],
    color: "from-emerald-400 to-teal-500"
  },
  {
    id: "ai-1",
    title: "AI Developer Hub — Code That Builds Nations",
    category: "AI Business",
    location: "Pan-African Tech Hub",
    image: "https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "Elite Zambian developers building enterprise AI for agriculture, mining & finance. 25%+ IRR target, recurring SaaS revenue.",
    stats: [{ label: "Developers", value: "50+" }, { label: "AI Products", value: "12" }, { label: "Clients", value: "Global" }],
    color: "from-violet-400 to-purple-500"
  },
  {
    id: "ai-2",
    title: "Machine Learning Training Cluster",
    category: "AI Business",
    location: "Lusaka AI Lab",
    image: "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "GPU clusters training vertical AI models for Zambian agriculture yield prediction and copper mining optimization.",
    stats: [{ label: "GPU Hours", value: "10k+" }, { label: "Models", value: "8 live" }, { label: "Accuracy", value: "94%" }],
    color: "from-fuchsia-400 to-pink-500"
  },
  {
    id: "ai-3",
    title: "AI-Powered Agriculture Drone",
    category: "AI Business",
    location: "Southern Province Farms",
    image: "https://images.pexels.com/photos/6022449/pexels-photo-6022449.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "AI drones monitoring crop health across 5,000 hectares — yield up 32% for smallholder farmers.",
    stats: [{ label: "Hectares", value: "5k+" }, { label: "Yield ↑", value: "32%" }, { label: "Farmers", value: "400+" }],
    color: "from-lime-400 to-emerald-500"
  },
  {
    id: "realestate-1",
    title: "Student Housing & Tech Campus",
    category: "Real Estate",
    location: "Lusaka Growth Corridor",
    image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "Affordable student housing with co-working, solar microgrid, and triple-net lease agreements with educational operators.",
    stats: [{ label: "Units", value: "200" }, { label: "Yield", value: "16%" }, { label: "Occupancy", value: "96%" }],
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "realestate-2",
    title: "Commercial Tech Hub Exterior",
    category: "Real Estate",
    location: "Lusaka Central",
    image: "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "Mixed-use development: ground floor retail, upper floors AI incubator and classrooms — diversified revenue.",
    stats: [{ label: "Floors", value: "6" }, { label: "Tenants", value: "18" }, { label: "Footfall", value: "2k/day" }],
    color: "from-indigo-400 to-blue-500"
  },
  {
    id: "solar-1",
    title: "Solar Microgrid for Schools",
    category: "Solar Energy",
    location: "Rural Zambia",
    image: "https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "150kW solar + battery storage powering entire campus. Energy independence = learning never stops.",
    stats: [{ label: "Capacity", value: "150kW" }, { label: "Storage", value: "400kWh" }, { label: "Uptime", value: "99.9%" }],
    color: "from-yellow-400 to-amber-500"
  },
  {
    id: "agri-1",
    title: "Smart Greenhouse Project",
    category: "Agriculture",
    location: "Chisamba, Zambia",
    image: "https://images.pexels.com/photos/21393/garden-4k-wallpaper-berries-orchard-21393.jpg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "IoT greenhouse with AI irrigation — revenue funds student scholarships. Investment + impact model.",
    stats: [{ label: "Yield", value: "8x" }, { label: "Water Saved", value: "40%" }, { label: "Scholarships", value: "50" }],
    color: "from-green-400 to-emerald-600"
  },
  {
    id: "techhub-1",
    title: "Co-Working & Incubator Floor",
    category: "Tech Hub",
    location: "Lusaka Innovation Hub",
    image: "https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "Where Zambian founders meet global investors. Pitch nights, demo days, and seed funding — pipeline for AI fund.",
    stats: [{ label: "Startups", value: "35+" }, { label: "Funding", value: "$2M+" }, { label: "Demo Days", value: "Monthly" }],
    color: "from-rose-400 to-red-500"
  },
  {
    id: "finance-1",
    title: "Investment Strategy Session",
    category: "Finance",
    location: "Seedwel Boardroom",
    image: "https://images.pexels.com/photos/318820/pexels-photo-318820.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    description: "Founder Mr. Seedwell Masuku & Country Director Zacheus Simbaya reviewing investor milestone releases and quarterly distributions.",
    stats: [{ label: "Investors", value: "120+" }, { label: "Reviews", value: "Quarterly" }, { label: "Transparency", value: "100%" }],
    color: "from-amber-400 to-yellow-500"
  }
];

export const categories = ["All", "School Building", "AI Business", "Real Estate", "Solar Energy", "Agriculture", "Tech Hub", "Finance"] as const;
