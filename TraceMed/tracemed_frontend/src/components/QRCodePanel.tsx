"use client";

import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode, ExternalLink } from "lucide-react";

interface QRCodePanelProps {
  batchNumber: string;
  medicineName: string;
}

export default function QRCodePanel({ batchNumber, medicineName }: QRCodePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/qr/${encodeURIComponent(batchNumber)}`
      : `/qr/${encodeURIComponent(batchNumber)}`;

  function downloadQR() {
    const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tracemed-qr-${batchNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <QrCode className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">QR Code</h3>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* QR Image */}
        <div
          ref={containerRef}
          className="p-3 bg-white border border-gray-100 rounded-xl shadow-inner"
        >
          <QRCodeCanvas
            value={qrUrl}
            size={160}
            level="H"
            marginSize={1}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        {/* Labels */}
        <div className="text-center w-full">
          <p className="text-xs font-semibold text-slate-700 truncate">{medicineName}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{batchNumber}</p>
          <p className="text-xs text-slate-300 mt-1 break-all">{qrUrl}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <button
            onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <a
            href={`/qr/${encodeURIComponent(batchNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl text-xs font-medium transition-colors border border-cyan-100"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview
          </a>
        </div>
      </div>
    </div>
  );
}
