export type MedicineStatus =
  | "Created"
  | "Produced"
  | "Inspected"
  | "InTransit"
  | "Delivered"
  | "Sold"
  | "Recalled"
  | "Cancelled";

export type UserRole =
  | "admin"
  | "regulator"
  | "manufacturer"
  | "inspector"
  | "logistics"
  | "pharmacy";

export type BlockchainSyncStatus = "pending" | "synced" | "failed" | "not_synced" | "disabled" | "skipped";

export interface User {
  id: number;
  username: string;
  email: string;
  roles: UserRole[];
  is_staff: boolean;
  is_superuser: boolean;
}

export interface UserDetail extends User {
  is_active: boolean;
  date_joined?: string;
  last_login?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Pagination {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
}

export interface Medicine {
  _id: string;
  name: string;
  manufacturer: string;
  batch_number: string;
  expiration_date: string;
  manufacture_date?: string;
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
  _id: string;
  medicine_id?: string;
  medicine_name?: string;
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
  timestamp?: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  message?: string;
  count?: number;
  pagination?: Pagination;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface BatchQRData {
  medicine_code?: string;
  batch_number: string;
  name: string;
  generic_name?: string;
  dosage_form?: string;
  strength?: string;
  category?: string;
  manufacturer: string;
  manufacture_date?: string;
  expiration_date: string;
  storage_condition?: string;
  quality_status?: string;
  status: MedicineStatus;
  location?: string;
  temperature?: number | null;
  humidity?: number | null;
  blockchain_hash?: string | null;
  blockchain_lot_id?: number | null;
  blockchain_sync_status?: BlockchainSyncStatus;
}

export interface BatchHistory {
  medicine: Medicine;
  history: MedicineRecord[];
}

// Blockchain on-chain types (ethers.js direct)
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

// Blockchain backend API types
export interface BlockchainStatusData {
  configured: boolean;
  connected: boolean;
  contract_address: string;
  chain_id: number;
  private_key_set: boolean;
  role_private_keys_set: Record<string, boolean>;
  roles_ready: boolean;
  missing_roles: string[];
  blockchain_enabled: boolean;
  message?: string;
}

export interface SyncAuditItem {
  _id: string;
  batch_number: string;
  name?: string;
  blockchain_lot_id?: number | null;
  blockchain_sync_status: BlockchainSyncStatus;
  db_stage?: string;
  chain_stage?: string;
  stage_match?: boolean;
  issue?: string;
}

export interface SyncAuditSummary {
  total: number;
  disabled: number;
  synced: number;
  failed: number;
  skipped: number;
  status_mismatch?: number;
  error?: number;
}

export interface SyncAuditResult {
  summary: SyncAuditSummary;
  items: SyncAuditItem[];
}

export interface BlockchainLotDetail {
  lot_id: number;
  name: string;
  manufacturer_id: number;
  inspector_id: number;
  logistics_id: number;
  pharmacy_id: number;
  stage: number;
  stage_text: string;
}

export interface BlockchainLotEvent {
  event_name?: string;
  lot_id: number;
  stage: number;
  stage_text: string;
  updated_by: string;
  timestamp: number;
  note: string;
  tx_hash: string;
  block_number: number;
  log_index?: number;
}

export interface BlockchainRoleResult {
  tx_hash: string;
  block_number: number;
  status: string;
  role: string;
  wallet?: string;
  role_id?: number;
  message: string;
}

export const STAGE_MAP: Record<number, MedicineStatus> = {
  0: "Created",
  1: "Produced",
  2: "Inspected",
  3: "InTransit",
  4: "Delivered",
  5: "Sold",
  6: "Recalled",
  7: "Cancelled",
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
