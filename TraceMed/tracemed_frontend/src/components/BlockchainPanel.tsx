"use client";

import React, { useState } from "react";
import { Medicine, OnChainLot, OnChainEvent } from "@/types";
import { fetchLotOnChain, fetchLotHistory, stageToStatus, truncateHash } from "@/lib/blockchain";
import { Link2, RefreshCw, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface BlockchainPanelProps {
  medicine: Medicine;
}

function formatTimestamp(ts: bigint): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BlockchainPanel({ medicine }: BlockchainPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lotData, setLotData] = useState<OnChainLot | null>(null);
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const [fetched, setFetched] = useState(false);

  // Auto-fetch on mount when lot_id is available
  React.useEffect(() => {
    if (medicine.blockchain_lot_id && !fetched && !loading) {
      handleFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicine.blockchain_lot_id]);

  if (!medicine.blockchain_lot_id) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Blockchain Status</h3>
            <p className="text-sm text-slate-500">Not synced to blockchain</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
          <XCircle className="w-4 h-4 text-gray-400" />
          <span>This medicine has not been registered on the blockchain yet.</span>
        </div>
      </div>
    );
  }

  async function handleFetch() {
    if (!medicine.blockchain_lot_id) return;
    setLoading(true);
    setError(null);
    try {
      const [lot, hist] = await Promise.all([
        fetchLotOnChain(medicine.blockchain_lot_id),
        fetchLotHistory(medicine.blockchain_lot_id),
      ]);
      setLotData(lot);
      setEvents(hist);
      setFetched(true);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to fetch from blockchain");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Blockchain Data</h3>
            <p className="text-sm text-slate-500">
              Lot ID: #{medicine.blockchain_lot_id}
            </p>
          </div>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {fetched ? "Refresh" : "Fetch from Chain"}
        </button>
      </div>

      {/* Quick info row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-slate-400 mb-1">Sync Status</p>
          <div className="flex items-center gap-1.5">
            {medicine.blockchain_sync_status === "synced" ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Synced</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 capitalize">
                  {medicine.blockchain_sync_status || "Unknown"}
                </span>
              </>
            )}
          </div>
        </div>
        {medicine.blockchain_hash && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">TX Hash</p>
            <span
              className="text-sm font-mono text-cyan-600 hover:underline cursor-pointer"
              title={medicine.blockchain_hash}
            >
              {truncateHash(medicine.blockchain_hash)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {fetched && lotData && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              On-Chain Lot Info
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-slate-400">Lot Name: </span>
                <span className="font-medium text-slate-800">
                  {lotData.tenlothuoc || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Stage: </span>
                <span className="font-medium text-slate-800">
                  {stageToStatus(lotData.giaiDoan)} ({lotData.giaiDoan})
                </span>
              </div>
              <div>
                <span className="text-slate-400">Manufacturer ID: </span>
                <span className="font-medium text-slate-800">
                  {lotData.nhaSanXuat.toString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Inspector ID: </span>
                <span className="font-medium text-slate-800">
                  {lotData.donViKiemDinh.toString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Transport ID: </span>
                <span className="font-medium text-slate-800">
                  {lotData.donViVanChuyen.toString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Pharmacy ID: </span>
                <span className="font-medium text-slate-800">
                  {lotData.nhaThuoc.toString()}
                </span>
              </div>
            </div>
          </div>

          {events.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                On-Chain Events ({events.length})
              </h4>
              <div className="space-y-2">
                {events.map((ev, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-100 rounded-xl p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">
                        Stage: {stageToStatus(ev.giaiDoan)}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {formatTimestamp(ev.thoiGian)}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-500 text-xs">
                      <span>By: </span>
                      <span className="font-mono">{ev.nguoiCapNhat}</span>
                    </div>
                    {ev.ghiChu && (
                      <div className="mt-1 text-slate-600 italic">{ev.ghiChu}</div>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-cyan-600 text-xs">
                      <ExternalLink className="w-3 h-3" />
                      <span
                        className="font-mono cursor-pointer hover:underline"
                        title={ev.transactionHash}
                      >
                        {truncateHash(ev.transactionHash)}
                      </span>
                      <span className="text-slate-400 ml-1">
                        block #{ev.blockNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-2">
              No blockchain events found for this lot.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
