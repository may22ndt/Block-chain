"use client";

import React, { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import { useWallet } from "@/hooks/useWallet";
import {
  fetchLotOnChain,
  fetchLotHistory,
  fetchCounter,
  fetchOwner,
  stageToStatus,
  truncateHash,
  sepoliaEtherscanTx,
  sepoliaEtherscanAddress,
  createLot,
  supplyLot,
  transportLot,
  pharmacyReceiveLot,
  sellLot,
  cancelLot,
  addManufacturer,
  addInspector,
  addTransporter,
  addPharmacy,
  ContractCounters,
} from "@/lib/blockchain";
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
  RefreshCw,
  Send,
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xf9592BDC391C778F2BE7Eb3F736784e505E0B534";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) * 1000;
  if (ms === 0) return "—";
  return new Date(ms).toLocaleString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function TxRow({ label, txHash }: { label: string; txHash: string }) {
  return (
    <a
      href={sepoliaEtherscanTx(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {label}: {truncateHash(txHash)}
    </a>
  );
}

// ─── Write Panel ──────────────────────────────────────────────────────────────

type WriteFn = () => Promise<void>;

function WriteSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {icon}
          {title}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function TxButton({
  label,
  onClick,
  variant = "primary",
}: {
  label: string;
  onClick: WriteFn;
  variant?: "primary" | "danger";
}) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await (onClick() as unknown as Promise<string>);
      setTxHash(hash);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message?.slice(0, 120) || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
          variant === "danger"
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-cyan-600 hover:bg-cyan-700 text-white"
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? "Sending…" : label}
      </button>
      {txHash && <TxRow label="Tx" txHash={txHash} />}
      {error && (
        <p className="text-xs text-red-600 mt-1 break-all">{error}</p>
      )}
    </div>
  );
}

function InputTxButton({
  label,
  placeholder,
  onSubmit,
  extra,
  variant,
}: {
  label: string;
  placeholder: string;
  onSubmit: (value: string, extras: Record<string, string>) => Promise<string>;
  extra?: { label: string; placeholder: string; key: string }[];
  variant?: "primary" | "danger";
}) {
  const [value, setValue] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await onSubmit(value.trim(), extras);
      setTxHash(hash);
      setValue("");
      setExtras({});
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message?.slice(0, 120) || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-cyan-600 hover:bg-cyan-700 text-white"
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {loading ? "…" : label}
        </button>
      </div>
      {extra?.map((ex) => (
        <input
          key={ex.key}
          type="text"
          value={extras[ex.key] || ""}
          onChange={(e) =>
            setExtras((prev) => ({ ...prev, [ex.key]: e.target.value }))
          }
          placeholder={ex.placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900"
        />
      ))}
      {txHash && <TxRow label="Tx" txHash={txHash} />}
      {error && (
        <p className="text-xs text-red-600 mt-1 break-all">{error}</p>
      )}
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlockchainPage() {
  const {
    account,
    chainId,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error: walletError,
  } = useWallet();

  const [counters, setCounters] = useState<ContractCounters | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [countersLoading, setCountersLoading] = useState(false);

  const [lotId, setLotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lotData, setLotData] = useState<OnChainLot | null>(null);
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const [queried, setQueried] = useState(false);

  const isOwner =
    account && owner && account.toLowerCase() === owner.toLowerCase();
  const wrongNetwork = isConnected && chainId !== 11155111;

  useEffect(() => {
    loadCounters();
  }, []);

  async function loadCounters() {
    setCountersLoading(true);
    try {
      const [c, o] = await Promise.all([fetchCounter(), fetchOwner()]);
      setCounters(c);
      setOwner(o);
    } catch {
      // ignore — user may not have RPC yet
    } finally {
      setCountersLoading(false);
    }
  }

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
      <div className="space-y-6 max-w-4xl">

        {/* Wrong network warning */}
        {wrongNetwork && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>Wrong network.</strong> Please switch MetaMask to{" "}
              <strong>Sepolia Testnet</strong> (Chain ID 11155111).
            </span>
          </div>
        )}

        {/* Wallet Banner */}
        <div
          className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isConnected
              ? "bg-emerald-50 border-emerald-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isConnected ? "bg-emerald-100" : "bg-slate-200"
              }`}
            >
              <Wallet
                className={`w-5 h-5 ${
                  isConnected ? "text-emerald-600" : "text-slate-500"
                }`}
              />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {isConnected ? "Wallet Connected" : "No Wallet Connected"}
              </p>
              {isConnected && account ? (
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <a
                    href={sepoliaEtherscanAddress(account)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-emerald-700 hover:underline"
                  >
                    {truncateAddress(account)}
                  </a>
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    {chainId === 11155111
                      ? "Sepolia ✓"
                      : `Chain ${chainId}`}
                  </span>
                  {isOwner && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                      Contract Owner
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-0.5">
                  Connect MetaMask to send transactions. Read queries work
                  without a wallet.
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

        {/* Contract info + counters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cyan-600" />
              <h2 className="font-semibold text-slate-900">Smart Contract — ChuoiCungUng</h2>
            </div>
            <button
              onClick={loadCounters}
              disabled={countersLoading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${countersLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Contract Address</p>
              <a
                href={sepoliaEtherscanAddress(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-cyan-700 hover:underline break-all"
              >
                {CONTRACT_ADDRESS}
              </a>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Owner</p>
              {owner ? (
                <a
                  href={sepoliaEtherscanAddress(owner)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-cyan-700 hover:underline"
                >
                  {owner}
                </a>
              ) : (
                <span className="text-sm text-slate-400">
                  {countersLoading ? "Loading…" : "—"}
                </span>
              )}
            </div>
          </div>

          {counters && (
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: "Lots", value: counters.loThuoc },
                { label: "Manufacturers", value: counters.nhaSanXuat },
                { label: "Inspectors", value: counters.donViKiemDinh },
                { label: "Transporters", value: counters.donViVanChuyen },
                { label: "Pharmacies", value: counters.nhaThuoc },
              ].map(({ label, value }) => (
                <div key={label} className="bg-cyan-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-cyan-700">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write panel (wallet required) */}
        {isConnected && !wrongNetwork && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-violet-600" />
              <h2 className="font-semibold text-slate-900">Send Transaction</h2>
              <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-100">
                MetaMask required
              </span>
            </div>

            <div className="space-y-3">
              {/* Lot lifecycle */}
              <WriteSection
                title="Lot Lifecycle"
                icon={<Boxes className="w-4 h-4 text-cyan-600" />}
              >
                <InputTxButton
                  label="Create Lot"
                  placeholder="Lot name (e.g. Paracetamol 500mg Batch A)"
                  onSubmit={(name) => createLot(name)}
                />
                <InputTxButton
                  label="Supply Lot (Stage 1)"
                  placeholder="Lot ID"
                  onSubmit={(id) => supplyLot(parseInt(id))}
                />
                <InputTxButton
                  label="Transport Lot (Stage 3)"
                  placeholder="Lot ID"
                  onSubmit={(id) => transportLot(parseInt(id))}
                />
                <InputTxButton
                  label="Pharmacy Receive (Stage 4)"
                  placeholder="Lot ID"
                  onSubmit={(id) => pharmacyReceiveLot(parseInt(id))}
                />
                <InputTxButton
                  label="Sell (Stage 5)"
                  placeholder="Lot ID"
                  onSubmit={(id) => sellLot(parseInt(id))}
                />
                <InputTxButton
                  label="Cancel Lot"
                  placeholder="Lot ID"
                  onSubmit={(id, ex) => cancelLot(parseInt(id), ex["reason"] || "Cancelled")}
                  extra={[{ label: "Reason", placeholder: "Reason for cancellation", key: "reason" }]}
                  variant="danger"
                />
              </WriteSection>

              {/* Role management */}
              {isOwner && (
                <WriteSection
                  title="Role Management (Owner only)"
                  icon={<Users className="w-4 h-4 text-violet-600" />}
                >
                  <InputTxButton
                    label="Add Manufacturer"
                    placeholder="Wallet address (0x…)"
                    onSubmit={(addr) => addManufacturer(addr)}
                  />
                  <InputTxButton
                    label="Add Inspector"
                    placeholder="Wallet address (0x…)"
                    onSubmit={(addr) => addInspector(addr)}
                  />
                  <InputTxButton
                    label="Add Transporter"
                    placeholder="Wallet address (0x…)"
                    onSubmit={(addr) => addTransporter(addr)}
                  />
                  <InputTxButton
                    label="Add Pharmacy"
                    placeholder="Wallet address (0x…)"
                    onSubmit={(addr) => addPharmacy(addr)}
                  />
                </WriteSection>
              )}
            </div>
          </div>
        )}

        {/* Lot query form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-cyan-600" />
            <h2 className="font-semibold text-slate-900">Query Lot On-Chain</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Read lot data and full status history directly from the smart
            contract. No wallet needed.
          </p>
          <form onSubmit={handleQuery} className="flex gap-3">
            <input
              type="number"
              min="0"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              placeholder="Enter Lot ID (e.g. 0, 1, 2…)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !lotId.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
                label="Events"
                value={String(events.length)}
                icon={<Boxes className="w-5 h-5 text-emerald-600" />}
                color="bg-emerald-50"
              />
              <StatCard
                label="Blockchain"
                value={isConnected ? "Live" : "Read-Only"}
                icon={
                  isConnected ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Link2 className="w-5 h-5 text-amber-600" />
                  )
                }
                color={isConnected ? "bg-emerald-50" : "bg-amber-50"}
              />
            </div>

            {/* Lot detail */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">
                  On-Chain Lot Data
                </h2>
                {currentStatus && <StatusBadge status={currentStatus} />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Lot Name", value: lotData.tenlothuoc || "—" },
                  {
                    label: "Stage",
                    value: `${lotData.giaiDoan} — ${stageToStatus(lotData.giaiDoan)}`,
                  },
                  {
                    label: "Manufacturer ID",
                    value: lotData.nhaSanXuat.toString(),
                  },
                  {
                    label: "Inspector ID",
                    value: lotData.donViKiemDinh.toString(),
                  },
                  {
                    label: "Transport ID",
                    value: lotData.donViVanChuyen.toString(),
                  },
                  {
                    label: "Pharmacy ID",
                    value: lotData.nhaThuoc.toString(),
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-medium text-slate-800 break-all">
                      {value}
                    </p>
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
                  No on-chain events found for Lot #{lotId}.
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                  <div className="space-y-4">
                    {events.map((ev, idx) => {
                      const status = stageToStatus(ev.giaiDoan);
                      return (
                        <div key={idx} className="relative pl-10">
                          <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-cyan-100 border-2 border-cyan-500 z-10" />
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
                              <div>
                                <span className="font-medium text-slate-600">
                                  Updated by:{" "}
                                </span>
                                <a
                                  href={sepoliaEtherscanAddress(
                                    ev.nguoiCapNhat
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-cyan-600 hover:underline"
                                >
                                  {ev.nguoiCapNhat}
                                </a>
                              </div>
                              {ev.ghiChu && (
                                <div>
                                  <span className="font-medium text-slate-600">
                                    Note:{" "}
                                  </span>
                                  <span className="italic text-slate-600">
                                    {ev.ghiChu}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 pt-1">
                                <a
                                  href={sepoliaEtherscanTx(ev.transactionHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-cyan-600 hover:underline font-mono"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {truncateHash(ev.transactionHash)}
                                </a>
                                <span className="text-slate-400">
                                  · block #{ev.blockNumber}
                                </span>
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

        {/* Note about kiemDinhLoThuoc */}
        {isConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">
                  Stage 2 (Inspection) not shown above
                </p>
                <p className="text-amber-700 mt-1">
                  <code className="bg-amber-100 px-1 rounded">
                    kiemDinhLoThuoc
                  </code>{" "}
                  requires a digital signature (<code>_chuKySo bytes</code>)
                  generated off-chain by the inspector's wallet. Call it
                  programmatically with the signed bytes — see{" "}
                  <code className="bg-amber-100 px-1 rounded">
                    inspectLot()
                  </code>{" "}
                  in <code className="bg-amber-100 px-1 rounded">src/lib/blockchain.ts</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
