"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

interface WalletContextValue {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextValue>({
  account: null,
  chainId: null,
  isConnecting: false,
  isConnected: false,
  provider: null,
  connect: async () => {},
  disconnect: () => {},
  error: null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getEthereum = () =>
    typeof window !== "undefined"
      ? (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum
      : undefined;

  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to connect.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const bp = new ethers.BrowserProvider(ethereum);
      await bp.send("eth_requestAccounts", []);
      const signer = await bp.getSigner();
      const address = await signer.getAddress();
      const network = await bp.getNetwork();
      setProvider(bp);
      setAccount(address);
      setChainId(Number(network.chainId));
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setError(null);
  }, []);

  // Listen for account / chain changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else setAccount(accounts[0]);
    };

    const handleChainChanged = (hex: string) => {
      setChainId(parseInt(hex, 16));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ethereum as any).on("accountsChanged", handleAccountsChanged);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ethereum as any).on("chainChanged", handleChainChanged);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ethereum as any).removeListener("accountsChanged", handleAccountsChanged);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ethereum as any).removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isConnecting,
        isConnected: !!account,
        provider,
        connect,
        disconnect,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
