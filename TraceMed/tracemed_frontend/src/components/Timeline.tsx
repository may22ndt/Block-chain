"use client";

import React from "react";
import { MedicineRecord } from "@/types";
import {
  Package,
  Factory,
  CheckCircle,
  Truck,
  Home,
  ShoppingCart,
  AlertTriangle,
  Circle,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

interface TimelineProps {
  records: MedicineRecord[];
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  Created: <Circle className="w-4 h-4" />,
  Produced: <Factory className="w-4 h-4" />,
  Inspected: <CheckCircle className="w-4 h-4" />,
  InTransit: <Truck className="w-4 h-4" />,
  Delivered: <Home className="w-4 h-4" />,
  Sold: <ShoppingCart className="w-4 h-4" />,
  Recalled: <AlertTriangle className="w-4 h-4" />,
};

const STATUS_ICON_BG: Record<string, string> = {
  Created: "bg-gray-100 text-gray-600",
  Produced: "bg-blue-100 text-blue-600",
  Inspected: "bg-violet-100 text-violet-600",
  InTransit: "bg-amber-100 text-amber-600",
  Delivered: "bg-green-100 text-green-600",
  Sold: "bg-emerald-100 text-emerald-600",
  Recalled: "bg-red-100 text-red-600",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateHash(hash: string, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export default function Timeline({ records }: TimelineProps) {
  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Package className="w-10 h-10 mb-2" />
        <p className="text-sm">No supply chain records yet</p>
      </div>
    );
  }

  const sorted = [...records].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return ta - tb;
  });

  return (
    <div className="relative">
      {sorted.map((record, idx) => {
        const isLast = idx === sorted.length - 1;
        const iconBg =
          STATUS_ICON_BG[record.status] || "bg-gray-100 text-gray-600";
        const icon = STATUS_ICON[record.status] || <Circle className="w-4 h-4" />;

        return (
          <div key={record.id} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${iconBg} z-10`}
              >
                {icon}
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1 mb-1 min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={record.status} size="sm" />
                    {record.quality_status && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {record.quality_status}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDate(record.created_at)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {record.location && (
                    <div>
                      <span className="text-slate-400">Location: </span>
                      <span className="text-slate-700 font-medium">
                        {record.location}
                      </span>
                    </div>
                  )}
                  {record.temperature != null && (
                    <div>
                      <span className="text-slate-400">Temp: </span>
                      <span className="text-slate-700 font-medium">
                        {record.temperature}°C
                      </span>
                    </div>
                  )}
                  {record.humidity != null && (
                    <div>
                      <span className="text-slate-400">Humidity: </span>
                      <span className="text-slate-700 font-medium">
                        {record.humidity}%
                      </span>
                    </div>
                  )}
                  {record.created_by && (
                    <div>
                      <span className="text-slate-400">By: </span>
                      <span className="text-slate-700 font-medium">
                        {record.created_by}
                      </span>
                    </div>
                  )}
                </div>

                {record.note && (
                  <p className="mt-2 text-sm text-slate-600 italic border-t border-gray-100 pt-2">
                    {record.note}
                  </p>
                )}

                {record.blockchain_hash && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-slate-400">Blockchain: </span>
                    <span
                      className="text-xs font-mono text-cyan-600 cursor-pointer hover:underline"
                      title={record.blockchain_hash}
                    >
                      {truncateHash(record.blockchain_hash)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
