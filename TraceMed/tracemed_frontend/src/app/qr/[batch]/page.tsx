"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBatchHistoryApi } from "@/lib/api";
import { BatchHistory } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import {
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Calendar,
  MapPin,
  Thermometer,
  Package,
  AlertTriangle,
} from "lucide-react";

const STATUS_BANNER: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  Created: {
    bg: "from-gray-500 to-gray-600",
    text: "text-gray-100",
    icon: <Package className="w-6 h-6" />,
  },
  Produced: {
    bg: "from-blue-500 to-blue-600",
    text: "text-blue-100",
    icon: <Package className="w-6 h-6" />,
  },
  Inspected: {
    bg: "from-violet-500 to-violet-600",
    text: "text-violet-100",
    icon: <CheckCircle className="w-6 h-6" />,
  },
  InTransit: {
    bg: "from-amber-500 to-amber-600",
    text: "text-amber-100",
    icon: <RefreshCw className="w-6 h-6" />,
  },
  Delivered: {
    bg: "from-green-500 to-green-600",
    text: "text-green-100",
    icon: <CheckCircle className="w-6 h-6" />,
  },
  Sold: {
    bg: "from-emerald-500 to-emerald-600",
    text: "text-emerald-100",
    icon: <CheckCircle className="w-6 h-6" />,
  },
  Recalled: {
    bg: "from-red-500 to-red-600",
    text: "text-red-100",
    icon: <AlertTriangle className="w-6 h-6" />,
  },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function QRPage() {
  const { batch } = useParams<{ batch: string }>();
  const [data, setData] = useState<BatchHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const batchDecoded = decodeURIComponent(batch);

  async function fetchHistory() {
    setLoading(true);
    setError("");
    try {
      const res = await getBatchHistoryApi(batchDecoded);
      if (res.status === "error") {
        throw new Error(res.message || "Batch not found");
      }
      setData((res.data as BatchHistory) || (res as unknown as BatchHistory));
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to load batch history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (batch) fetchHistory();
  }, [batch]);

  const medicine = data?.medicine;
  const bannerConfig =
    medicine?.status
      ? STATUS_BANNER[medicine.status] || STATUS_BANNER["Created"]
      : STATUS_BANNER["Created"];
  const isVerified = !!(medicine?.blockchain_hash || medicine?.blockchain_lot_id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-600" />
          <span className="font-bold text-slate-900">TraceMed</span>
          <span className="text-slate-300 mx-1">|</span>
          <span className="text-sm text-slate-500">Supply Chain Verification</span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-60 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        ) : error || !medicine ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Batch Not Found
            </h2>
            <p className="text-slate-500 text-sm mb-2">
              Batch number: <strong>{batchDecoded}</strong>
            </p>
            <p className="text-slate-400 text-sm">
              {error || "No medicine found with this batch number."}
            </p>
            <Link
              href="/"
              className="inline-block mt-5 text-sm text-cyan-600 hover:text-cyan-700"
            >
              Return to home
            </Link>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* Status Banner */}
            <div
              className={`bg-gradient-to-r ${bannerConfig.bg} rounded-2xl p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 ${bannerConfig.text}`}>
                  {bannerConfig.icon}
                  <span className="font-semibold text-lg">{medicine.status}</span>
                </div>
                {isVerified ? (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white">
                    <CheckCircle className="w-4 h-4" />
                    Blockchain Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1 text-sm text-white/70">
                    <XCircle className="w-4 h-4" />
                    Not on blockchain
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {medicine.name}
              </h1>
              <p className="text-white/80 text-sm">by {medicine.manufacturer}</p>
            </div>

            {/* Key Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-3 border-b border-gray-100">
                Medicine Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<Package className="w-4 h-4 text-slate-400" />}
                  label="Batch Number"
                  value={medicine.batch_number}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-slate-400" />}
                  label="Expiration Date"
                  value={formatDate(medicine.expiration_date)}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-slate-400" />}
                  label="Manufacture Date"
                  value={formatDate(medicine.manufacture_date)}
                />
                <InfoItem
                  icon={<MapPin className="w-4 h-4 text-slate-400" />}
                  label="Current Location"
                  value={medicine.location || "—"}
                />
                {medicine.temperature != null && (
                  <InfoItem
                    icon={<Thermometer className="w-4 h-4 text-slate-400" />}
                    label="Temperature"
                    value={`${medicine.temperature}°C`}
                  />
                )}
                {medicine.dosage_form && (
                  <InfoItem
                    icon={<Package className="w-4 h-4 text-slate-400" />}
                    label="Dosage Form"
                    value={medicine.dosage_form}
                  />
                )}
                {medicine.strength && (
                  <InfoItem
                    icon={<Package className="w-4 h-4 text-slate-400" />}
                    label="Strength"
                    value={medicine.strength}
                  />
                )}
                {medicine.generic_name && (
                  <InfoItem
                    icon={<Package className="w-4 h-4 text-slate-400" />}
                    label="Generic Name"
                    value={medicine.generic_name}
                  />
                )}
              </div>

              {/* Current status badge */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Status:</span>
                <StatusBadge status={medicine.status} />
              </div>
            </div>

            {/* Blockchain Badge */}
            {isVerified && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">
                    Verified on Blockchain
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    This medicine's supply chain has been recorded on an immutable
                    blockchain ledger.
                  </p>
                  {medicine.blockchain_hash && (
                    <p
                      className="text-xs font-mono text-emerald-700 mt-1 truncate"
                      title={medicine.blockchain_hash}
                    >
                      Hash: {medicine.blockchain_hash.slice(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recalled Warning */}
            {medicine.status === "Recalled" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800 text-sm">
                    MEDICINE RECALLED
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    This medicine has been recalled. Do not use. Please return to
                    the point of purchase or contact the manufacturer.
                  </p>
                </div>
              </div>
            )}

            {/* Supply Chain History */}
            {data?.history && data.history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-3 border-b border-gray-100">
                  Supply Chain History
                </h2>
                <Timeline records={data.history} />
              </div>
            )}

            {/* Footer note */}
            <div className="text-center pb-4">
              <p className="text-xs text-slate-400">
                This information is provided by TraceMed's blockchain-verified
                supply chain system.
              </p>
              <Link
                href="/"
                className="text-xs text-cyan-600 hover:underline mt-1 inline-block"
              >
                Learn more about TraceMed
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
      </div>
    </div>
  );
}
