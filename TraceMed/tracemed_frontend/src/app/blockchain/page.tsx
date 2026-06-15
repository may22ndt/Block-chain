"use client";

import React, { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import { useWallet } from "@/hooks/useWallet";
import { fetchLotOnChain, fetchLotHistory, stageToStatus, truncateHash } from "@/lib/blockchain";
import { OnChainLot, OnChainEvent } from "@/types";
import {
  Link2,
  Search,
  Wallet,
  CheckCircle,
  XCircle,
  ExternalLink,
  Hash,
  Activity,
  Boxes,
  AlertCircle,
} from "lucide-react";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) * 1000;
  if (ms === 0) return "—";
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function BlockchainPage() {
  const { account, chainId, isConnected, isConnecting, connect, disconnect, error: walletError } = useWallet();

  const [lotId, setLotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lotData, setLotData] = useState<OnChainLot | null>(null);
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const [queried, setQueried] = useState(false);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "Not configured";

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(lotId.trim());
    if (isNaN(id) || id < 0) {
      setError("Please enter a valid Lot ID (non-negative integer).");
      return;
    }
    setLoading(true);
    setError(null);
    setLotData(null);
    setEvents([]);
    setQueried(false);
    try {
      const [lot, hist] = await Promise.all([
        fetchLotOnChain(id),
        fetchLotHistory(id),
      ]);
      setLotData(lot);
      setEvents(hist);
      setQueried(true);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to query blockchain.");
    } finally {
      setLoading(false);
    }
  }

  const currentStatus = lotData ? stageToStatus(lotData.giaiDoan) : null;

  return (
    <ProtectedLayout title="Blockchain Explorer">
      <div className="p-6 space-y-6 max-w-4xl">

        {/* Wallet status banner */}
        <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isConnected ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isConnected ? "bg-emerald-100" : "bg-slate-200"
            }`}>
              <Wallet className={`w-5 h-5 ${isConnected ? "text-emerald-600" : "text-slate-500"}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {isConnected ? "Wallet Connected" : "No Wallet Connected"}
              </p>
              {isConnected && account ? (
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm font-mono text-emerald-700">{account}</span>
                  {chainId && (
                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                      Chain ID: {chainId}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-0.5">
                  Connect MetaMask to sign transactions. Read-only queries work without a wallet.
                </p>
              )}
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 rounded-xl text-sm font-medium transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          )}
        </div>

        {walletError && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {walletError}
          </div>
        )}

        {/* Contract info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-5 h-5 text-cyan-600" />
            <h2 className="font-semibold text-slate-900">Smart Contract</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Contract Address</p>
              <p className="text-sm font-mono text-slate-700 break-all">{contractAddress}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Network</p>
              <p className="text-sm text-slate-700">
                {chainId === 11155111 ? "Sepolia Testnet" :
                 chainId === 1 ? "Ethereum Mainnet" :
                 chainId === 31337 || chainId === 1337 ? "Local Hardhat/Ganache" :
                 chainId ? `Chain ID ${chainId}` : "Not connected"}
              </p>
            </div>
          </div>
        </div>

        {/* Lot query form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-cyan-600" />
            <h2 className="font-semibold text-slate-900">Query Lot On-Chain</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Read medicine lot data and status history directly from the smart contract.
            No wallet required for read-only queries.
          </p>
          <form onSubmit={handleQuery} className="flex gap-3">
            <input
              type="number"
              min="0"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              placeholder="Enter Lot ID (e.g. 1, 2, 3…)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !lotId.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Querying…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Query Chain
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {queried && lotData && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Lot ID"
                value={`#${lotData.id.toString()}`}
                icon={<Hash className="w-5 h-5 text-cyan-600" />}
                color="bg-cyan-50"
              />
              <StatCard
                label="Current Stage"
                value={currentStatus ?? "—"}
                icon={<Activity className="w-5 h-5 text-violet-600" />}
                color="bg-violet-50"
              />
              <StatCard
                label="On-Chain Events"
                value={String(events.length)}
                icon={<Boxes className="w-5 h-5 text-emerald-600" />}
                color="bg-emerald-50"
              />
              <StatCard
                label="Blockchain"
                value={isConnected ? "Live" : "Read-Only"}
                icon={isConnected
                  ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                  : <Link2 className="w-5 h-5 text-amber-600" />}
                color={isConnected ? "bg-emerald-50" : "bg-amber-50"}
              />
            </div>

            {/* Lot detail card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">On-Chain Lot Data</h2>
                {currentStatus && <StatusBadge status={currentStatus} />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Lot Name", value: lotData.tenlothuoc || "—" },
                  { label: "Stage (raw)", value: `${lotData.giaiDoan} — ${stageToStatus(lotData.giaiDoan)}` },
                  { label: "Manufacturer ID", value: lotData.nhaSanXuat.toString() },
                  { label: "Inspector ID", value: lotData.donViKiemDinh.toString() },
                  { label: "Transport ID", value: lotData.donViVanChuyen.toString() },
                  { label: "Pharmacy ID", value: lotData.nhaThuoc.toString() },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-medium text-slate-800 break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Events timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-cyan-600" />
                <h2 className="font-semibold text-slate-900">
                  CapNhatTrangThai Events ({events.length})
                </h2>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No events found for Lot #{lotId} on this network.
                </div>
              ) : (
                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                  <div className="space-y-4">
                    {events.map((ev, idx) => {
                      const status = stageToStatus(ev.giaiDoan);
                      return (
                        <div key={idx} className="relative pl-10">
                          {/* dot */}
                          <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-cyan-100 border-2 border-cyan-500 flex items-center justify-center z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={status} size="sm" />
                                <span className="text-xs text-slate-400">
                                  Stage {ev.giaiDoan}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {formatTimestamp(ev.thoiGian)}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-600">Updated by:</span>
                                <span className="font-mono">{ev.nguoiCapNhat}</span>
                              </div>
                              {ev.ghiChu && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-600">Note:</span>
                                  <span className="italic text-slate-600">{ev.ghiChu}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 pt-1">
                                <ExternalLink className="w-3 h-3 text-cyan-500" />
                                <span
                                  className="font-mono text-cyan-600 hover:underline cursor-pointer"
                                  title={ev.transactionHash}
                                >
                                  {truncateHash(ev.transactionHash)}
                                </span>
                                <span className="text-slate-400">· block #{ev.blockNumber}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Explain how ethers.js is being used */}
        <div className="bg-slate-900 rounded-2xl p-5 text-slate-300 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-semibold">How ethers.js is used here</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-400">
            <li><span className="text-slate-200">Wallet connect:</span> <code className="text-cyan-400">ethers.BrowserProvider(window.ethereum)</code> to request MetaMask accounts</li>
            <li><span className="text-slate-200">Read contract:</span> <code className="text-cyan-400">contract.cacLoThuoc(lotId)</code> reads lot data from chain</li>
            <li><span className="text-slate-200">Event history:</span> <code className="text-cyan-400">contract.queryFilter(CapNhatTrangThai)</code> queries all status-change events</li>
            <li><span className="text-slate-200">Fallback provider:</span> <code className="text-cyan-400">ethers.JsonRpcProvider(RPC_URL)</code> when MetaMask is absent</li>
          </ul>
        </div>
      </div>
    </ProtectedLayout>
  );
}
