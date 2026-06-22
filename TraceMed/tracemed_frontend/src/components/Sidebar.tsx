"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Pill,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Link2,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Medicines",
    href: "/medicines",
    icon: <Pill className="w-5 h-5" />,
  },
  {
    label: "Records",
    href: "/records",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: "Blockchain",
    href: "/blockchain",
    icon: <Link2 className="w-5 h-5" />,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    adminOnly: true,
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 flex flex-col z-40 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">
            TraceMed
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-2 py-4 border-t border-slate-700 space-y-1">
        <div
          className={`flex items-center gap-3 px-3 py-2.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-slate-100 text-sm font-medium truncate">
                {user?.username || "User"}
              </p>
              <p className="text-slate-400 text-xs truncate capitalize">
                {user?.roles?.[0] || (user?.is_staff ? "Staff" : "User")}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-cyan-600 hover:text-white transition-colors shadow-md z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
