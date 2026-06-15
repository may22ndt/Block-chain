import { ApiResponse, Medicine, MedicineRecord, BatchHistory, AuthTokens, User } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tracemed_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tracemed_refresh");
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      localStorage.removeItem("tracemed_token");
      localStorage.removeItem("tracemed_refresh");
      localStorage.removeItem("tracemed_user");
      return null;
    }
    const data = await res.json();
    const newToken = data.access;
    localStorage.setItem("tracemed_token", newToken);
    return newToken;
  } catch {
    // Network error: also clear auth so the login page doesn't redirect back to dashboard.
    localStorage.removeItem("tracemed_token");
    localStorage.removeItem("tracemed_refresh");
    localStorage.removeItem("tracemed_user");
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    } else {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }
  }

  if (!res.ok) {
    let errData: ApiResponse<T>;
    try {
      errData = await res.json();
    } catch {
      throw new Error(`HTTP error ${res.status}`);
    }
    const msg = errData.message || `HTTP error ${res.status}`;
    throw new Error(msg);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

// Auth
export async function loginApi(
  username: string,
  password: string
): Promise<{ access: string; refresh: string; user: User }> {
  const res = await apiFetch<ApiResponse<{ access: string; refresh: string; user: User }>>(
    "/api/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  );
  if (!res.data) throw new Error("Login failed: no data returned");
  return res.data;
}

export async function getMeApi(): Promise<User> {
  const res = await apiFetch<ApiResponse<User>>("/api/auth/me/");
  if (!res.data) throw new Error("No user data");
  return res.data;
}

// Medicines
export async function getMedicinesApi(): Promise<ApiResponse<Medicine[]>> {
  return apiFetch<ApiResponse<Medicine[]>>("/api/medicines/");
}

export async function getMedicineApi(id: number): Promise<ApiResponse<Medicine>> {
  return apiFetch<ApiResponse<Medicine>>(`/api/medicines/${id}/`);
}

export async function createMedicineApi(
  data: Partial<Medicine>
): Promise<ApiResponse<Medicine>> {
  return apiFetch<ApiResponse<Medicine>>("/api/medicines/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMedicineApi(
  id: number,
  data: Partial<Medicine>
): Promise<ApiResponse<Medicine>> {
  return apiFetch<ApiResponse<Medicine>>(`/api/medicines/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMedicineApi(id: number): Promise<void> {
  await apiFetch<void>(`/api/medicines/${id}/`, { method: "DELETE" });
}

export async function searchMedicinesApi(q: string): Promise<ApiResponse<Medicine[]>> {
  return apiFetch<ApiResponse<Medicine[]>>(
    `/api/search/?q=${encodeURIComponent(q)}`
  );
}

// Records
export async function getRecordsApi(): Promise<ApiResponse<MedicineRecord[]>> {
  return apiFetch<ApiResponse<MedicineRecord[]>>("/api/records/");
}

export async function createRecordApi(
  data: Partial<MedicineRecord>
): Promise<ApiResponse<MedicineRecord>> {
  return apiFetch<ApiResponse<MedicineRecord>>("/api/records/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getRecordsByMedicineApi(
  medicineId: number
): Promise<ApiResponse<MedicineRecord[]>> {
  return apiFetch<ApiResponse<MedicineRecord[]>>(`/api/records/${medicineId}/`);
}

// Batches
export async function getBatchHistoryApi(
  batchNumber: string
): Promise<ApiResponse<BatchHistory>> {
  return fetch(
    `${BASE_URL}/api/batches/${encodeURIComponent(batchNumber)}/history/`
  ).then((r) => r.json()) as Promise<ApiResponse<BatchHistory>>;
}

export async function getBatchQRApi(
  batchNumber: string
): Promise<ApiResponse<{ medicine: Medicine }>> {
  return fetch(
    `${BASE_URL}/api/batches/${encodeURIComponent(batchNumber)}/qr/`
  ).then((r) => r.json()) as Promise<ApiResponse<{ medicine: Medicine }>>;
}
