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

// Single neutral shade for every category/model/seeking pill.
// Callsites still read `.color` and concat hex-alpha suffixes (`${c}12`,
// `${c}22`) for tinted backgrounds — those now resolve to ~7–13% of
// this dark grey, which sits invisibly on the page surface. Effect: the
// rainbow goes away with one constant, no callsite changes needed.
const NEUTRAL = "#1e1e26";

export const categories: Category[] = [
  { id: "all", label: "Alle", icon: "", color: NEUTRAL },
  { id: "ecommerce", label: "E-Commerce", icon: "", color: NEUTRAL },
  { id: "apps", label: "App Dev", icon: "", color: NEUTRAL },
  { id: "trading", label: "Trading", icon: "", color: NEUTRAL },
  { id: "freelancer", label: "Freelancer", icon: "", color: NEUTRAL },
  { id: "marketing", label: "Marketing", icon: "", color: NEUTRAL },
  { id: "saas", label: "SaaS", icon: "", color: NEUTRAL },
  { id: "coaching", label: "Coaching", icon: "", color: NEUTRAL },
  { id: "ai", label: "AI", icon: "", color: NEUTRAL },
  { id: "agency", label: "Agency", icon: "", color: NEUTRAL },
];

export const modelColors: Record<string, string> = {
  Umsatzbeteiligung: NEUTRAL,
  Equity: NEUTRAL,
  "50/50 Partnerschaft": NEUTRAL,
  Provision: NEUTRAL,
  "Bezahltes Projekt": NEUTRAL,
};

export const seekingColors: Record<string, string> = {
  Investoren: NEUTRAL,
  Mitgründer: NEUTRAL,
  Kunden: NEUTRAL,
  Community: NEUTRAL,
  Projektpartner: NEUTRAL,
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

