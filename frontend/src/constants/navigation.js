import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  Gauge,
  LayoutDashboard,
  MessageSquareText,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Platform", href: "#platform" },
];

export const dashboardLinks = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Resume Management",
    path: "/resume",
    icon: FileText,
  },
  {
    label: "Interview Creation",
    path: "/interviews/create",
    icon: BriefcaseBusiness,
  },
  {
    label: "Interview Session",
    path: "/interviews/session",
    icon: MessageSquareText,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: Gauge,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
];
