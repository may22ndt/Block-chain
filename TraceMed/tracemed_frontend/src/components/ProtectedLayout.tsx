"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function ProtectedLayout({ children, title }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !didRedirect.current) {
      didRedirect.current = true;
      router.replace("/login");
    }
    // router excluded from deps — it's not stable in App Router and re-adding
    // it would cause this effect to fire on every navigation, defeating the ref guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-16 lg:ml-60 transition-all duration-300">
        <Navbar title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
