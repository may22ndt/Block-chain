"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Bell, User, Wallet, Unplug, AlertCircle } from "lucide-react";

interface NavbarProps {
  title?: string;
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function ChainBadge({ chainId }: { chainId: number }) {
  const chains: Record<number, { name: string; color: string }> = {
    1:       { name: "Mainnet",  color: "bg-green-100 text-green-700" },
    11155111:{ name: "Sepolia",  color: "bg-violet-100 text-violet-700" },
    31337:   { name: "Hardhat",  color: "bg-amber-100 text-amber-700" },
    1337:    { name: "Local",    color: "bg-amber-100 text-amber-700" },
  };
  const info = chains[chainId] ?? { name: `Chain ${chainId}`, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${info.color}`}>
      {info.name}
    </span>
  );
}

export default function Navbar({ title }: NavbarProps) {
  const { user } = useAuth();
  const { account, chainId, isConnecting, isConnected, connect, disconnect, error } = useWallet();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        {title && (
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* MetaMask Connect / Wallet info */}
        {isConnected && account ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-mono text-emerald-800 font-medium">
              {truncateAddress(account)}
            </span>
            {chainId && <ChainBadge chainId={chainId} />}
            <button
              onClick={disconnect}
              title="Disconnect wallet"
              className="ml-1 text-emerald-600 hover:text-red-500 transition-colors"
            >
              <Unplug className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}

        {/* MetaMask error tooltip */}
        {error && (
          <div title={error} className="text-amber-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}

        <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-slate-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center">
            <User className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {user?.username || "User"}
          </span>
          {user?.is_staff && (
            <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full font-medium">
              Staff
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
