"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { createMedicineApi } from "@/lib/api";
import { MedicineStatus, WRITE_ROLES } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

const STATUSES: MedicineStatus[] = [
  "Created",
  "Produced",
  "Inspected",
  "InTransit",
  "Delivered",
  "Sold",
  "Recalled",
];

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Patch",
  "Inhaler",
  "Suppository",
  "Other",
];

const CATEGORIES = [
  "Antibiotics",
  "Analgesics",
  "Antihypertensives",
  "Antidiabetics",
  "Antivirals",
  "Antifungals",
  "Cardiovascular",
  "Gastrointestinal",
  "Respiratory",
  "Neurological",
  "Vitamins",
  "Vaccines",
  "Other",
];

interface FormData {
  name: string;
  manufacturer: string;
  batch_number: string;
  expiration_date: string;
  manufacture_date: string;
  location: string;
  status: MedicineStatus;
  temperature: string;
  humidity: string;
  description: string;
  category: string;
  strength: string;
  dosage_form: string;
  storage_condition: string;
  generic_name: string;
  medicine_code: string;
}

export default function NewMedicinePage() {
  const router = useRouter();
  const { hasRole } = useAuth();

  const [form, setForm] = useState<FormData>({
    name: "",
    manufacturer: "",
    batch_number: "",
    expiration_date: "",
    manufacture_date: "",
    location: "",
    status: "Created",
    temperature: "",
    humidity: "",
    description: "",
    category: "",
    strength: "",
    dosage_form: "",
    storage_condition: "",
    generic_name: "",
    medicine_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canWrite = hasRole(WRITE_ROLES);

  if (!canWrite) {
    return (
      <ProtectedLayout title="Add Medicine">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm mb-4">
            You do not have permission to create medicines.
          </p>
          <Link
            href="/medicines"
            className="text-cyan-600 hover:text-cyan-700 text-sm"
          >
            Back to Medicines
          </Link>
        </div>
      </ProtectedLayout>
    );
  }

  function set(field: keyof FormData) {
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
        name: form.name,
        manufacturer: form.manufacturer,
        batch_number: form.batch_number,
        expiration_date: form.expiration_date,
        manufacture_date: form.manufacture_date,
        status: form.status,
      };
      if (form.location) payload.location = form.location;
      if (form.temperature) payload.temperature = parseFloat(form.temperature);
      if (form.humidity) payload.humidity = parseFloat(form.humidity);
      if (form.description) payload.description = form.description;
      if (form.category) payload.category = form.category;
      if (form.strength) payload.strength = form.strength;
      if (form.dosage_form) payload.dosage_form = form.dosage_form;
      if (form.storage_condition) payload.storage_condition = form.storage_condition;
      if (form.generic_name) payload.generic_name = form.generic_name;
      if (form.medicine_code) payload.medicine_code = form.medicine_code;

      await createMedicineApi(payload);
      router.push("/medicines");
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to create medicine");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedLayout title="Add Medicine">
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/medicines"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add New Medicine</h2>
            <p className="text-slate-500 text-sm">
              Fill in the details to register a new medicine
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Section title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Medicine Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Amoxicillin 500mg"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Generic Name">
                <input
                  type="text"
                  value={form.generic_name}
                  onChange={set("generic_name")}
                  placeholder="e.g. Amoxicillin"
                  className={inputClass}
                />
              </Field>
              <Field label="Manufacturer" required>
                <input
                  type="text"
                  value={form.manufacturer}
                  onChange={set("manufacturer")}
                  placeholder="e.g. PharmaCorp Inc."
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Medicine Code">
                <input
                  type="text"
                  value={form.medicine_code}
                  onChange={set("medicine_code")}
                  placeholder="e.g. AMX-500"
                  className={inputClass}
                />
              </Field>
              <Field label="Batch Number" required>
                <input
                  type="text"
                  value={form.batch_number}
                  onChange={set("batch_number")}
                  placeholder="e.g. BATCH-2024-001"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={set("status")}
                  className={inputClass}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Dates */}
          <Section title="Dates">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Manufacture Date" required>
                <input
                  type="date"
                  value={form.manufacture_date}
                  onChange={set("manufacture_date")}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Expiration Date" required>
                <input
                  type="date"
                  value={form.expiration_date}
                  onChange={set("expiration_date")}
                  required
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Product Details */}
          <Section title="Product Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category">
                <select value={form.category} onChange={set("category")} className={inputClass}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Dosage Form">
                <select value={form.dosage_form} onChange={set("dosage_form")} className={inputClass}>
                  <option value="">Select form</option>
                  {DOSAGE_FORMS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <Field label="Strength">
                <input
                  type="text"
                  value={form.strength}
                  onChange={set("strength")}
                  placeholder="e.g. 500mg"
                  className={inputClass}
                />
              </Field>
              <Field label="Storage Condition">
                <input
                  type="text"
                  value={form.storage_condition}
                  onChange={set("storage_condition")}
                  placeholder="e.g. Store below 25°C"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* Location & Environment */}
          <Section title="Location & Environment">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Location" className="sm:col-span-1">
                <input
                  type="text"
                  value={form.location}
                  onChange={set("location")}
                  placeholder="e.g. Warehouse A"
                  className={inputClass}
                />
              </Field>
              <Field label="Temperature (°C)">
                <input
                  type="number"
                  value={form.temperature}
                  onChange={set("temperature")}
                  placeholder="e.g. 20"
                  step="0.1"
                  className={inputClass}
                />
              </Field>
              <Field label="Humidity (%)">
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
              </Field>
            </div>
          </Section>

          {/* Description */}
          <Section title="Description">
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={set("description")}
                placeholder="Enter medicine description..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </Section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Link
              href="/medicines"
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Medicine
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 bg-white placeholder:text-slate-400 transition";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-3 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  className: cls,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cls}>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
