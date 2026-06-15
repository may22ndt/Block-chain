"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import { getMedicinesApi, getRecordsApi } from "@/lib/api";
import { Medicine, MedicineRecord, MedicineStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
  Pill,
  ClipboardList,
  TrendingUp,
  Plus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const ALL_STATUSES: MedicineStatus[] = [
  "Created",
  "Produced",
  "Inspected",
  "InTransit",
  "Delivered",
  "Sold",
  "Recalled",
];

const STATUS_COLORS: Record<MedicineStatus, string> = {
  Created: "bg-gray-400",
  Produced: "bg-blue-500",
  Inspected: "bg-violet-500",
  InTransit: "bg-amber-500",
  Delivered: "bg-green-500",
  Sold: "bg-emerald-500",
  Recalled: "bg-red-500",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [records, setRecords] = useState<MedicineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [medRes, recRes] = await Promise.all([
        getMedicinesApi(),
        getRecordsApi(),
      ]);
      setMedicines(
        Array.isArray(medRes.data)
          ? medRes.data
          : Array.isArray(medRes)
          ? (medRes as unknown as Medicine[])
          : []
      );
      setRecords(
        Array.isArray(recRes.data)
          ? recRes.data
          : Array.isArray(recRes)
          ? (recRes as unknown as MedicineRecord[])
          : []
      );
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const s of ALL_STATUSES) statusCounts[s] = 0;
  for (const m of medicines) {
    if (m.status) statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(statusCounts), 1);

  const recentMedicines = [...medicines]
    .sort((a, b) => {
      const ta = new Date(a.updated_at || a.created_at || 0).getTime();
      const tb = new Date(b.updated_at || b.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  const blockchainSynced = medicines.filter(
    (m) => m.blockchain_sync_status === "synced"
  ).length;

  return (
    <ProtectedLayout title="Dashboard">
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Good {getGreeting()},{" "}
            <span className="text-cyan-600">{user?.username || "User"}</span>!
          </h2>
          <p className="text-slate-500 mt-1">
            Here's your supply chain overview.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            {error}
            <button onClick={fetchData} className="ml-auto text-red-600 hover:text-red-800">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Medicines"
            value={loading ? "—" : String(medicines.length)}
            icon={<Pill className="w-5 h-5" />}
            color="bg-cyan-50 text-cyan-600"
            loading={loading}
          />
          <StatCard
            label="Supply Records"
            value={loading ? "—" : String(records.length)}
            icon={<ClipboardList className="w-5 h-5" />}
            color="bg-violet-50 text-violet-600"
            loading={loading}
          />
          <StatCard
            label="Blockchain Synced"
            value={loading ? "—" : String(blockchainSynced)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="bg-emerald-50 text-emerald-600"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Medicines */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-900">Recent Medicines</h3>
              <Link
                href="/medicines"
                className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3 mb-2" />
                    <div className="h-3 bg-gray-50 rounded animate-pulse w-1/3" />
                  </div>
                ))
              ) : recentMedicines.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-400 text-sm">
                  No medicines found
                </div>
              ) : (
                recentMedicines.map((med) => (
                  <Link
                    key={med.id}
                    href={`/medicines/${med.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-cyan-700">
                        {med.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {med.batch_number} · Exp: {formatDate(med.expiration_date)}
                      </p>
                    </div>
                    <StatusBadge status={med.status} size="sm" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-4">
                Status Distribution
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ALL_STATUSES.map((status) => {
                    const count = statusCounts[status] || 0;
                    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{status}</span>
                          <span className="font-medium text-slate-700">{count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${STATUS_COLORS[status]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/medicines/new"
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Medicine
                </Link>
                <Link
                  href="/records"
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  View Records
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}
