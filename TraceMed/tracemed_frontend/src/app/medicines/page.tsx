"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import { getMedicinesApi, searchMedicinesApi, deleteMedicineApi } from "@/lib/api";
import { Medicine, WRITE_ROLES } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Plus,
  Trash2,
  Eye,
  Pill,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MedicinesContent() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [searchInput, setSearchInput] = useState(initialQ);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Medicine | null>(null);

  const canWrite = hasRole(WRITE_ROLES);

  const fetchMedicines = useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    try {
      let data: Medicine[] = [];
      if (q.trim()) {
        const res = await searchMedicinesApi(q.trim());
        data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? (res as unknown as Medicine[])
          : [];
      } else {
        const res = await getMedicinesApi();
        data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? (res as unknown as Medicine[])
          : [];
      }
      setMedicines(data);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicines(searchQuery);
  }, [searchQuery, fetchMedicines]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchInput);
    if (searchInput.trim()) {
      router.replace(`/medicines?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.replace("/medicines");
    }
  }

  async function handleDelete(medicine: Medicine) {
    setDeletingId(medicine._id);
    try {
      await deleteMedicineApi(medicine._id);
      setMedicines((prev) => prev.filter((m) => m._id !== medicine._id));
      setConfirmDelete(null);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to delete medicine");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Medicines</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading..." : `${medicines.length} medicines found`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMedicines(searchQuery)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {canWrite && (
              <Link
                href="/medicines/new"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or batch number..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  router.replace("/medicines");
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

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
                    Medicine
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Batch #
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Manufacturer
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Expires
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : medicines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Pill className="w-10 h-10" />
                        <p className="text-sm">No medicines found</p>
                        {canWrite && (
                          <Link
                            href="/medicines/new"
                            className="text-cyan-600 text-sm hover:underline"
                          >
                            Add your first medicine
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  medicines.map((med) => (
                    <tr
                      key={med._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/medicines/${med._id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                            <Pill className="w-4 h-4 text-cyan-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {med.name}
                            </p>
                            {med.generic_name && (
                              <p className="text-xs text-slate-400">
                                {med.generic_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono text-slate-600">
                          {med.batch_number}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">
                          {med.manufacturer || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(med.expiration_date)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={med.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/medicines/${med._id}`}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canWrite && (
                            <button
                              onClick={() => setConfirmDelete(med)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900">Delete Medicine?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete{" "}
              <strong>{confirmDelete.name}</strong> (
              {confirmDelete.batch_number})? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete._id}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {deletingId === confirmDelete._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MedicinesPage() {
  return (
    <ProtectedLayout title="Medicines">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <MedicinesContent />
      </Suspense>
    </ProtectedLayout>
  );
}
