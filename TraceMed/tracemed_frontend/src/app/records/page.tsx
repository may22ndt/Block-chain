"use client";

import React, { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import { getRecordsApi } from "@/lib/api";
import { MedicineRecord, MedicineStatus } from "@/types";
import { ClipboardList, RefreshCw, Filter, X } from "lucide-react";

const ALL_STATUSES: MedicineStatus[] = [
  "Created",
  "Produced",
  "Inspected",
  "InTransit",
  "Delivered",
  "Sold",
  "Recalled",
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<MedicineStatus | "">("");
  const [showFilter, setShowFilter] = useState(false);

  async function fetchRecords() {
    setLoading(true);
    setError("");
    try {
      const res = await getRecordsApi();
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? (res as unknown as MedicineRecord[])
        : [];
      setRecords(data);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecords();
  }, []);

  const filtered = statusFilter
    ? records.filter((r) => r.status === statusFilter)
    : records;

  const sorted = [...filtered].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });

  return (
    <ProtectedLayout title="Records">
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Supply Chain Records
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading..." : `${sorted.length} records`}
              {statusFilter && ` · Filtered by: ${statusFilter}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter
                  ? "bg-cyan-100 text-cyan-700"
                  : "bg-gray-100 text-slate-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {statusFilter && (
                <span
                  className="w-4 h-4 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter("");
                  }}
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
            <button
              onClick={fetchRecords}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter dropdown */}
        {showFilter && (
          <div className="mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 mb-3">
              Filter by Status
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setStatusFilter("");
                  setShowFilter(false);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !statusFilter
                    ? "bg-slate-900 text-white"
                    : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setShowFilter(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-slate-900 text-white"
                      : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">
                    Batch #
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Location
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Temp
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Humidity
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Blockchain
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <ClipboardList className="w-10 h-10" />
                        <p className="text-sm">No records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono text-slate-700">
                          {record.batch_number}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-600">
                          {record.location || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={record.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-600">
                          {record.temperature != null
                            ? `${record.temperature}°C`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-600">
                          {record.humidity != null
                            ? `${record.humidity}%`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {record.blockchain_hash ? (
                          <span
                            className="text-xs font-mono text-cyan-600 hover:underline cursor-pointer"
                            title={record.blockchain_hash}
                          >
                            {truncateHash(record.blockchain_hash)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-500">
                          {formatDate(record.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
