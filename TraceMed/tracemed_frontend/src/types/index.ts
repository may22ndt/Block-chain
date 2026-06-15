export type MedicineStatus =
  | "Created"
  | "Produced"
  | "Inspected"
  | "InTransit"
  | "Delivered"
  | "Sold"
  | "Recalled";

export type UserRole =
  | "admin"
  | "regulator"
  | "manufacturer"
  | "inspector"
  | "logistics"
  | "pharmacy";

export type BlockchainSyncStatus = "pending" | "synced" | "failed" | "not_synced";

export interface User {
  id: number;
  username: string;
  email: string;
  roles: UserRole[];
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Medicine {
  id: number;
  name: string;
  manufacturer: string;
  batch_number: string;
  expiration_date: string;
  manufacture_date: string;
  description?: string;
  location?: string;
  status: MedicineStatus;
  temperature?: number | null;
  humidity?: number | null;
  medicine_code?: string;
  generic_name?: string;
  dosage_form?: string;
  strength?: string;
  category?: string;
  storage_condition?: string;
  quality_status?: string;
  blockchain_hash?: string | null;
  blockchain_lot_id?: number | null;
  blockchain_sync_status?: BlockchainSyncStatus;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineRecord {
  id: number;
  medicine?: number;
  batch_number: string;
  location: string;
  status: MedicineStatus;
  temperature?: number | null;
  humidity?: number | null;
  quality_status?: string;
  note?: string;
  blockchain_hash?: string | null;
  blockchain_lot_id?: number | null;
  blockchain_sync_status?: BlockchainSyncStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  message?: string;
  count?: number;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface BatchHistory {
  medicine: Medicine;
  history: MedicineRecord[];
}

export interface OnChainLot {
  id: bigint;
  tenlothuoc: string;
  nhaSanXuat: bigint;
  donViKiemDinh: bigint;
  donViVanChuyen: bigint;
  nhaThuoc: bigint;
  giaiDoan: number;
}

export interface OnChainEvent {
  idLoThuoc: bigint;
  giaiDoan: number;
  nguoiCapNhat: string;
  thoiGian: bigint;
  ghiChu: string;
  blockNumber: number;
  transactionHash: string;
}

export const STAGE_MAP: Record<number, MedicineStatus> = {
  0: "Created",
  1: "Produced",
  2: "Inspected",
  3: "InTransit",
  4: "Delivered",
  5: "Sold",
  6: "Recalled",
};

export const WRITE_ROLES: UserRole[] = ["admin", "regulator", "manufacturer"];
export const ALL_ROLES: UserRole[] = [
  "admin",
  "regulator",
  "manufacturer",
  "inspector",
  "logistics",
  "pharmacy",
];
