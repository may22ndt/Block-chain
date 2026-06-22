"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedLayout from "@/components/ProtectedLayout";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import BlockchainPanel from "@/components/BlockchainPanel";
import QRCodePanel from "@/components/QRCodePanel";
import { getMedicineApi, getRecordsByMedicineApi, createRecordApi } from "@/lib/api";
import { Medicine, MedicineRecord, MedicineStatus, WRITE_ROLES, ALL_ROLES } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Edit,
  Plus,
  X,
  AlertCircle,
  Save,
  RefreshCw,
  Thermometer,
  Droplets,
  MapPin,
  Calendar,
  Package,
} from "lucide-react";

const ALL_STATUSES: MedicineStatus[] = [
  "Created",
  "Produced",
  "Inspected",
  "InTransit",
  "Delivered",
  "Sold",
  "Recalled",
  "Cancelled",
];

// Per-role allowed statuses when blockchain is enabled (guides user to submit valid transitions)
const ROLE_STATUSES: Partial<Record<string, MedicineStatus[]>> = {
  manufacturer: ["Created", "Produced", "Cancelled"],
  inspector: ["Inspected"],
  logistics: ["InTransit", "Delivered"],
  pharmacy: ["Delivered", "Sold"],
};

function getAllowedStatuses(roles: string[]): MedicineStatus[] {
  if (roles.includes("admin") || roles.includes("regulator")) return ALL_STATUSES;
  const allowed = new Set<MedicineStatus>();
  for (const role of roles) {
    for (const s of ROLE_STATUSES[role] ?? []) allowed.add(s);
  }
  return ALL_STATUSES.filter((s) => allowed.has(s));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-slate-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

interface RecordFormData {
  location: string;
  status: MedicineStatus;
  temperature: string;
  humidity: string;
  quality_status: string;
  note: string;
}

function AddRecordModal({
  medicine,
  allowedStatuses,
  onClose,
  onSuccess,
}: {
  medicine: Medicine;
  allowedStatuses: MedicineStatus[];
  onClose: () => void;
  onSuccess: (record: MedicineRecord) => void;
}) {
  const defaultStatus = allowedStatuses.includes(medicine.status)
    ? medicine.status
    : allowedStatuses[0] ?? medicine.status;

  const [form, setForm] = useState<RecordFormData>({
    location: "",
    status: defaultStatus,
    temperature: "",
    humidity: "",
    quality_status: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof RecordFormData) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        batch_number: medicine.batch_number,
        location: form.location,
        status: form.status,
        medicine: medicine._id,
      };
      if (form.temperature) payload.temperature = parseFloat(form.temperature);
      if (form.humidity) payload.humidity = parseFloat(form.humidity);
      if (form.quality_status) payload.quality_status = form.quality_status;
      if (form.note) payload.note = form.note;

      const res = await createRecordApi(payload);
      const record = (res.data || res) as MedicineRecord;
      onSuccess(record);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to add record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900">Add Supply Record</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-slate-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-1">
          Medicine: <strong>{medicine.name}</strong> ({medicine.batch_number})
        </p>
        {allowedStatuses.length < ALL_STATUSES.length && (
          <p className="text-xs text-amber-600 mb-4">
            Your role can only submit: {allowedStatuses.join(", ")}
          </p>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Location *</label>
              <input
                type="text"
                value={form.location}
                onChange={set("location")}
                placeholder="e.g. Distribution Center B"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={set("status")} className={inputClass}>
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Quality Status</label>
              <input
                type="text"
                value={form.quality_status}
                onChange={set("quality_status")}
                placeholder="e.g. Passed"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Temperature (°C)</label>
              <input
                type="number"
                value={form.temperature}
                onChange={set("temperature")}
                placeholder="e.g. 20"
                step="0.1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Humidity (%)</label>
              <input
                type="number"
                value={form.humidity}
                onChange={set("humidity")}
                placeholder="e.g. 65"
                step="0.1"
                min="0"
                max="100"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Note</label>
              <textarea
                value={form.note}
                onChange={set("note")}
                placeholder="Additional notes..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Add Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hasRole, user } = useAuth();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [records, setRecords] = useState<MedicineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddRecord, setShowAddRecord] = useState(false);

  const canWrite = hasRole(WRITE_ROLES);
  const canAddRecord = hasRole(ALL_ROLES);
  const allowedStatuses = getAllowedStatuses(user?.roles ?? []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [medRes, recRes] = await Promise.all([
        getMedicineApi(id),
        getRecordsByMedicineApi(id),
      ]);
      const med = (medRes.data || medRes) as Medicine;
      setMedicine(med);
      const recs = Array.isArray(recRes.data)
        ? recRes.data
        : Array.isArray(recRes)
        ? (recRes as unknown as MedicineRecord[])
        : [];
      setRecords(recs);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to load medicine");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  function handleRecordAdded(record: MedicineRecord) {
    setRecords((prev) => [...prev, record]);
    setShowAddRecord(false);
  }

  if (loading) {
    return (
      <ProtectedLayout title="Medicine Detail">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (error || !medicine) {
    return (
      <ProtectedLayout title="Medicine Detail">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {error || "Medicine not found"}
          </h2>
          <Link href="/medicines" className="text-cyan-600 hover:text-cyan-700 text-sm">
            Back to Medicines
          </Link>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout title="Medicine Detail">
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link
            href="/medicines"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900">{medicine.name}</h2>
              <StatusBadge status={medicine.status} />
            </div>
            <p className="text-slate-500 text-sm font-mono mt-0.5">
              {medicine.batch_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {canWrite && (
              <Link
                href={`/medicines/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            )}
            {canAddRecord && (
              <button
                onClick={() => setShowAddRecord(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-3 border-b border-gray-100">
                Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="Manufacturer" value={medicine.manufacturer} />
                <InfoRow label="Generic Name" value={medicine.generic_name} />
                <InfoRow label="Medicine Code" value={medicine.medicine_code} />
                <InfoRow label="Category" value={medicine.category} />
                <InfoRow label="Dosage Form" value={medicine.dosage_form} />
                <InfoRow label="Strength" value={medicine.strength} />
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-3 border-b border-gray-100">
                Dates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Manufacture Date</p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(medicine.manufacture_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Expiration Date</p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(medicine.expiration_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Environment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-3 border-b border-gray-100">
                Location & Environment
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-medium text-slate-800">
                      {medicine.location || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Thermometer className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Temperature</p>
                    <p className="text-sm font-medium text-slate-800">
                      {medicine.temperature != null ? `${medicine.temperature}°C` : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Humidity</p>
                    <p className="text-sm font-medium text-slate-800">
                      {medicine.humidity != null ? `${medicine.humidity}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>
              {medicine.storage_condition && (
                <p className="mt-3 text-xs text-slate-500 bg-gray-50 rounded-xl px-3 py-2">
                  <Package className="w-3.5 h-3.5 inline mr-1" />
                  Storage: {medicine.storage_condition}
                </p>
              )}
            </div>

            {/* Description */}
            {medicine.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Description
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {medicine.description}
                </p>
              </div>
            )}

            {/* Supply Chain Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-slate-700">
                  Supply Chain Timeline
                </h3>
                <span className="text-xs text-slate-400">
                  {records.length} events
                </span>
              </div>
              <Timeline records={records} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* QR Code for this medicine */}
            <QRCodePanel
              batchNumber={medicine.batch_number}
              medicineName={medicine.name}
            />

            {/* Quality & Blockchain status card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-3 border-b border-gray-100">
                Quality & Status
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Current Status</p>
                  <StatusBadge status={medicine.status} />
                </div>
                {medicine.quality_status && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Quality Status</p>
                    <span className="text-sm font-medium text-slate-800">
                      {medicine.quality_status}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Blockchain Panel */}
            <BlockchainPanel medicine={medicine} />
          </div>
        </div>
      </div>

      {showAddRecord && (
        <AddRecordModal
          medicine={medicine}
          allowedStatuses={allowedStatuses}
          onClose={() => setShowAddRecord(false)}
          onSuccess={handleRecordAdded}
        />
      )}
    </ProtectedLayout>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 bg-white placeholder:text-slate-400 transition";
const labelClass = "block text-xs font-medium text-slate-600 mb-1.5";
