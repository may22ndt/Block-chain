import {
  ApiResponse,
  Medicine,
  MedicineRecord,
  BatchHistory,
  BatchQRData,
  User,
  UserDetail,
  UserRole,
  BlockchainStatusData,
  SyncAuditResult,
  BlockchainLotDetail,
  BlockchainLotEvent,
  BlockchainRoleResult,
} from "@/types";

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

export async function getMedicineApi(id: string): Promise<ApiResponse<Medicine>> {
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
  id: string,
  data: Partial<Medicine>
): Promise<ApiResponse<Medicine>> {
  return apiFetch<ApiResponse<Medicine>>(`/api/medicines/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMedicineApi(id: string): Promise<void> {
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
  data: Partial<MedicineRecord> & Record<string, unknown>
): Promise<ApiResponse<MedicineRecord>> {
  return apiFetch<ApiResponse<MedicineRecord>>("/api/records/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getRecordsByMedicineApi(
  medicineId: string
): Promise<ApiResponse<MedicineRecord[]>> {
  return apiFetch<ApiResponse<MedicineRecord[]>>(`/api/records/${medicineId}/`);
}

// Batches
export async function getBatchHistoryApi(
  batchNumber: string
): Promise<ApiResponse<BatchHistory>> {
  return apiFetch<ApiResponse<BatchHistory>>(
    `/api/batches/${encodeURIComponent(batchNumber)}/history/`
  );
}

export async function getBatchQRApi(
  batchNumber: string
): Promise<ApiResponse<BatchQRData>> {
  return apiFetch<ApiResponse<BatchQRData>>(
    `/api/batches/${encodeURIComponent(batchNumber)}/qr/`
  );
}

// Blockchain status & audit
export async function getBlockchainStatusApi(): Promise<ApiResponse<BlockchainStatusData>> {
  return apiFetch<ApiResponse<BlockchainStatusData>>("/api/blockchain/status/");
}

export async function getBlockchainSyncAuditApi(params?: {
  check_chain?: boolean;
  only_problems?: boolean;
}): Promise<ApiResponse<SyncAuditResult>> {
  const qs = new URLSearchParams();
  if (params?.check_chain !== undefined) qs.set("check_chain", String(params.check_chain));
  if (params?.only_problems !== undefined) qs.set("only_problems", String(params.only_problems));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ApiResponse<SyncAuditResult>>(`/api/blockchain/sync-audit/${query}`);
}

// Blockchain lot read
export async function getBlockchainLotDetailApi(
  lotId: number
): Promise<ApiResponse<BlockchainLotDetail>> {
  return apiFetch<ApiResponse<BlockchainLotDetail>>(`/api/blockchain/lots/${lotId}/`);
}

export async function getBlockchainLotHistoryApi(
  lotId: number,
  params?: { from_block?: number | string; to_block?: number | string }
): Promise<ApiResponse<BlockchainLotEvent[]>> {
  const qs = new URLSearchParams();
  if (params?.from_block !== undefined) qs.set("from_block", String(params.from_block));
  if (params?.to_block !== undefined) qs.set("to_block", String(params.to_block));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ApiResponse<BlockchainLotEvent[]>>(
    `/api/blockchain/lots/${lotId}/history/${query}`
  );
}

// Blockchain role management (admin only)
export async function blockchainRoleAddApi(
  role: string,
  wallet: string
): Promise<ApiResponse<BlockchainRoleResult>> {
  return apiFetch<ApiResponse<BlockchainRoleResult>>("/api/blockchain/roles/add/", {
    method: "POST",
    body: JSON.stringify({ role, wallet }),
  });
}

export async function blockchainRoleRevokeApi(
  role: string,
  id: number,
  reason?: string
): Promise<ApiResponse<BlockchainRoleResult>> {
  return apiFetch<ApiResponse<BlockchainRoleResult>>("/api/blockchain/roles/revoke/", {
    method: "POST",
    body: JSON.stringify({ role, id, reason }),
  });
}

export async function blockchainRoleActivateApi(
  role: string,
  id: number
): Promise<ApiResponse<BlockchainRoleResult>> {
  return apiFetch<ApiResponse<BlockchainRoleResult>>("/api/blockchain/roles/activate/", {
    method: "POST",
    body: JSON.stringify({ role, id }),
  });
}

// Admin — user & role management
export async function getAdminUsersApi(): Promise<ApiResponse<UserDetail[]>> {
  return apiFetch<ApiResponse<UserDetail[]>>("/api/admin/users/");
}

export async function createAdminUserApi(data: {
  username: string;
  password: string;
  email?: string;
  roles?: UserRole[];
}): Promise<ApiResponse<UserDetail>> {
  return apiFetch<ApiResponse<UserDetail>>("/api/admin/users/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAdminUserApi(id: number): Promise<ApiResponse<UserDetail>> {
  return apiFetch<ApiResponse<UserDetail>>(`/api/admin/users/${id}/`);
}

export async function updateAdminUserApi(
  id: number,
  data: { roles?: UserRole[]; email?: string; is_active?: boolean }
): Promise<ApiResponse<UserDetail>> {
  return apiFetch<ApiResponse<UserDetail>>(`/api/admin/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUserApi(id: number): Promise<void> {
  await apiFetch<void>(`/api/admin/users/${id}/`, { method: "DELETE" });
}

export async function setAdminUserPasswordApi(
  id: number,
  password: string
): Promise<void> {
  await apiFetch<void>(`/api/admin/users/${id}/set-password/`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
