export type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export type Company = {
  name: string;
  role: string;
  year: string;
  type: string;
  active: boolean;
};

export type User = {
  id: number;
  name: string;
  age: number;
  category: string;
  role: string;
  location: string;
  followers: number;
  following: number;
  tags: string[];
  bio: string;
  seeking: string;
  avatar: string;
  color: string;
  companies: Company[];
};

export type Project = {
  id: number;
  userId: number;
  title: string;
  desc: string;
  category: string;
  location: string;
  model: string;
  tags: string[];
  applicants: number;
  color: string;
  avatar: string;
  userName: string;
  timeAgo: string;
};

export const categories: Category[] = [
  { id: "all", label: "Alle", icon: "◈", color: "#ffffff" },
  { id: "ecommerce", label: "E-Commerce", icon: "🛒", color: "#f97316" },
  { id: "apps", label: "App Dev", icon: "⚡", color: "#6366f1" },
  { id: "trading", label: "Trading", icon: "📈", color: "#10b981" },
  { id: "freelancer", label: "Freelancer", icon: "✦", color: "#f59e0b" },
  { id: "marketing", label: "Marketing", icon: "◎", color: "#ec4899" },
  { id: "saas", label: "SaaS", icon: "☁", color: "#3b82f6" },
  { id: "coaching", label: "Coaching", icon: "◉", color: "#8b5cf6" },
];

export const modelColors: Record<string, string> = {
  Umsatzbeteiligung: "#f97316",
  Equity: "#6366f1",
  "50/50 Partnerschaft": "#10b981",
  Provision: "#3b82f6",
  "Bezahltes Projekt": "#f59e0b",
};

export const seekingColors: Record<string, string> = {
  Investoren: "#f97316",
  Mitgründer: "#6366f1",
  Kunden: "#f59e0b",
  Community: "#10b981",
  Projektpartner: "#ec4899",
};

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m}m`;
  if (h < 24) return `vor ${h}h`;
  return `vor ${d}d`;
}
