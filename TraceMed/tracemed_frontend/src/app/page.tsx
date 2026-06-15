"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  QrCode,
  Shield,
  Link2,
  Lock,
  ChevronRight,
  X,
  ArrowRight,
  Upload,
  Camera,
  Hash,
  AlertCircle,
  Loader2,
} from "lucide-react";

type QRTab = "manual" | "image";

function QRModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<QRTab>("manual");
  const [batch, setBatch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (batch.trim()) {
      router.push(`/qr/${encodeURIComponent(batch.trim())}`);
      onClose();
    }
  }

  function handleQRResult(data: string) {
    // If the QR encodes a full URL with /qr/ path, extract batch from it
    const match = data.match(/\/qr\/([^/?#\s]+)/);
    const batchValue = match ? decodeURIComponent(match[1]) : data.trim();
    if (batchValue) {
      router.push(`/qr/${encodeURIComponent(batchValue)}`);
      onClose();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError("");
    setScanning(true);
    setPreviewSrc(URL.createObjectURL(file));

    try {
      const jsQR = (await import("jsqr")).default;

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas not supported")); return; }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const result = jsQR(imageData.data, imageData.width, imageData.height);
          URL.revokeObjectURL(objectUrl);

          if (result?.data) {
            handleQRResult(result.data);
            resolve();
          } else {
            reject(new Error("No QR code found in this image. Try a clearer photo."));
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to load image."));
        };
        img.src = objectUrl;
      });
    } catch (err: unknown) {
      const e = err as Error;
      setScanError(e.message || "Failed to scan QR code.");
    } finally {
      setScanning(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-bold text-slate-900">Verify Medicine</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-slate-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => { setTab("manual"); setScanError(""); setPreviewSrc(null); }}
            className={`flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors mr-6 ${
              tab === "manual"
                ? "border-cyan-600 text-cyan-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Enter Batch
          </button>
          <button
            onClick={() => { setTab("image"); setScanError(""); setPreviewSrc(null); }}
            className={`flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "image"
                ? "border-cyan-600 text-cyan-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Scan QR Image
          </button>
        </div>

        <div className="px-6 py-5">
          {tab === "manual" ? (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Enter a batch number to view the full supply chain history.
              </p>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. BATCH-2024-001"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!batch.trim()}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  View History
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Upload a photo of the QR code on the medicine packaging.
              </p>

              {/* Error */}
              {scanError && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {scanError}
                </div>
              )}

              {/* Preview */}
              {previewSrc && !scanning && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc}
                    alt="QR preview"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
              )}

              {/* Scanning state */}
              {scanning && (
                <div className="mb-4 flex items-center justify-center gap-2 h-20 rounded-xl bg-cyan-50 border border-cyan-100 text-sm text-cyan-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning QR code...
                </div>
              )}

              {/* Upload buttons */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="qr-file-upload"
                />
                <label
                  htmlFor="qr-file-upload"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose Image from Gallery
                </label>

                {/* Camera capture — shows on mobile, hidden on desktop with no camera */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  id="qr-camera-capture"
                />
                <label
                  htmlFor="qr-camera-capture"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Open Camera
                </label>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                Supports JPEG, PNG, WebP. Make sure the QR code is clearly visible.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/medicines?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">TraceMed</span>
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isAuthenticated ? "Go to Dashboard" : "Dashboard"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 animated-gradient min-h-[80vh] flex items-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-cyan-200 mb-6">
              <Shield className="w-4 h-4" />
              Blockchain-Powered Medicine Traceability
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
              Track Every
              <span className="text-cyan-400"> Medicine </span>
              from Source to Patient
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              TraceMed provides end-to-end supply chain transparency for
              pharmaceuticals, powered by blockchain technology and smart
              contracts.
            </p>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-slate-300 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by medicine name or batch number..."
                  className="flex-1 bg-transparent text-white placeholder:text-slate-400 focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                Search
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                <QrCode className="w-5 h-5" />
                Scan QR Code
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Why TraceMed?
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            A complete solution for pharmaceutical supply chain management with
            real-time blockchain verification.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Search className="w-6 h-6 text-cyan-600" />,
              bg: "bg-cyan-50",
              title: "Track Medicine",
              desc: "Monitor every medicine through its complete lifecycle — from manufacturing to patient delivery. Full transparency at every stage.",
            },
            {
              icon: <Link2 className="w-6 h-6 text-violet-600" />,
              bg: "bg-violet-50",
              title: "Blockchain Verified",
              desc: "Every supply chain event is recorded on an immutable blockchain ledger, ensuring authenticity and preventing counterfeiting.",
            },
            {
              icon: <Lock className="w-6 h-6 text-emerald-600" />,
              bg: "bg-emerald-50",
              title: "Role-Based Access",
              desc: "Secure multi-role system for manufacturers, inspectors, logistics providers, and pharmacies with granular permissions.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Sign in to access the full dashboard and manage your supply chain
            operations.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600" />
            <span className="font-bold text-slate-900">TraceMed</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} TraceMed. All rights reserved.
          </p>
        </div>
      </footer>

      {showQRModal && <QRModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
}
