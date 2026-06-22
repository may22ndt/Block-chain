import { ethers } from "ethers";
import { OnChainLot, OnChainEvent, STAGE_MAP } from "@/types";

// Full ABI from deployed ChuoiCungUng contract on Sepolia
// 0xf9592BDC391C778F2BE7Eb3F736784e505E0B534
const CONTRACT_ABI = [
  // ─── State variables (public getters) ───────────────────────────────────────
  {
    inputs: [],
    name: "ChuSoHuu",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "counter",
    outputs: [
      { internalType: "uint64", name: "loThuoc", type: "uint64" },
      { internalType: "uint64", name: "nhaSanXuat", type: "uint64" },
      { internalType: "uint64", name: "donViKiemDinh", type: "uint64" },
      { internalType: "uint64", name: "donViVanChuyen", type: "uint64" },
      { internalType: "uint64", name: "nhaThuoc", type: "uint64" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "cacLoThuoc",
    outputs: [
      { internalType: "uint64", name: "id", type: "uint64" },
      { internalType: "string", name: "tenlothuoc", type: "string" },
      { internalType: "uint256", name: "nhaSanXuat", type: "uint256" },
      { internalType: "uint256", name: "donViKiemDinh", type: "uint256" },
      { internalType: "uint256", name: "donViVanChuyen", type: "uint256" },
      { internalType: "uint256", name: "nhaThuoc", type: "uint256" },
      { internalType: "uint8", name: "giaiDoan", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "nhaSanXuats",
    outputs: [
      { internalType: "address", name: "diaChi", type: "address" },
      { internalType: "uint64", name: "id", type: "uint64" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "donViKiemDinhs",
    outputs: [
      { internalType: "address", name: "diaChi", type: "address" },
      { internalType: "uint64", name: "id", type: "uint64" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "donViVanChuyens",
    outputs: [
      { internalType: "address", name: "diaChi", type: "address" },
      { internalType: "uint64", name: "id", type: "uint64" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "nhaThuocs",
    outputs: [
      { internalType: "address", name: "diaChi", type: "address" },
      { internalType: "uint64", name: "id", type: "uint64" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // address → role id mappings
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "idNhaSanXuat",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "idDonViKiemDinh",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "idDonViVanChuyen",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "idNhaThuoc",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ─── Write: Lot lifecycle ────────────────────────────────────────────────────
  {
    inputs: [{ internalType: "string", name: "tenlothuoc", type: "string" }],
    name: "taoLoThuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "_idLoThuoc", type: "uint64" }],
    name: "Cungcaplothuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint64", name: "_idLoThuoc", type: "uint64" },
      { internalType: "bool", name: "_datTieuChuan", type: "bool" },
      { internalType: "bytes", name: "_chuKySo", type: "bytes" },
    ],
    name: "kiemDinhLoThuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "_idLoThuoc", type: "uint64" }],
    name: "vanChuyenLoThuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "_idLoThuoc", type: "uint64" }],
    name: "nhaThuocNhanHang",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint64", name: "_idLoThuoc", type: "uint64" }],
    name: "banHang",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint64", name: "_idLoThuoc", type: "uint64" },
      { internalType: "string", name: "_lyDo", type: "string" },
    ],
    name: "huyLoThuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint64", name: "_idLoThuoc", type: "uint64" },
      { internalType: "string", name: "_lyDo", type: "string" },
      { internalType: "bytes", name: "_chuKySo", type: "bytes" },
    ],
    name: "thuHoiLoThuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ─── Write: Role management (owner only) ────────────────────────────────────
  {
    inputs: [{ internalType: "address", name: "_diaChi", type: "address" }],
    name: "themNhaSanXuat",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_diaChi", type: "address" }],
    name: "themDonViKiemDinh",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_diaChi", type: "address" }],
    name: "themDonViVanChuyen",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_diaChi", type: "address" }],
    name: "themNhaThuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_id", type: "uint256" },
      { internalType: "string", name: "_lyDo", type: "string" },
    ],
    name: "thuHoiRoleNhaSanXuat",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_id", type: "uint256" },
      { internalType: "string", name: "_lyDo", type: "string" },
    ],
    name: "thuHoiRoleDonViKiemDinh",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_id", type: "uint256" },
      { internalType: "string", name: "_lyDo", type: "string" },
    ],
    name: "thuHoiRoleDonViVanChuyen",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_id", type: "uint256" },
      { internalType: "string", name: "_lyDo", type: "string" },
    ],
    name: "thuHoiRoleNhaThuoc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ─── Events ─────────────────────────────────────────────────────────────────
  {
    // IMPORTANT: ALL params are non-indexed — cannot filter at RPC level.
    // Must fetch all events and filter client-side by idLoThuoc.
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint64", name: "idLoThuoc", type: "uint64" },
      { indexed: false, internalType: "uint8", name: "giaiDoan", type: "uint8" },
      { indexed: false, internalType: "address", name: "nguoiCapNhat", type: "address" },
      { indexed: false, internalType: "uint256", name: "thoiGian", type: "uint256" },
      { indexed: false, internalType: "string", name: "ghiChu", type: "string" },
    ],
    name: "CapNhatTrangThai",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: false, internalType: "uint256", name: "thoiGian", type: "uint256" },
    ],
    name: "NhaSanXuatAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: false, internalType: "uint256", name: "thoiGian", type: "uint256" },
    ],
    name: "DonViKiemDinhAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: false, internalType: "uint256", name: "thoiGian", type: "uint256" },
    ],
    name: "DonViVanChuyenAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: false, internalType: "uint256", name: "thoiGian", type: "uint256" },
    ],
    name: "NhaThuocAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: false, internalType: "uint256", name: "thoiGian", type: "uint256" },
    ],
    name: "RoleActivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: false, internalType: "string", name: "lyDo", type: "string" },
      { indexed: false, internalType: "uint256", name: "thoiGian", type: "uint256" },
    ],
    name: "RoleRevoked",
    type: "event",
  },
];

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xf9592BDC391C778F2BE7Eb3F736784e505E0B534";

// ─── Provider / Contract helpers ──────────────────────────────────────────────

export function getProvider(): ethers.BrowserProvider | ethers.JsonRpcProvider {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { ethereum?: unknown }).ethereum
  ) {
    return new ethers.BrowserProvider(
      (window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum
    );
  }
  const rpcUrl =
    process.env.NEXT_PUBLIC_WEB3_PROVIDER_URL || "https://rpc.sepolia.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getContract(
  providerOrSigner?: ethers.Provider | ethers.Signer
): ethers.Contract {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    providerOrSigner || getProvider()
  );
}

// ─── Read: Contract state ──────────────────────────────────────────────────────

export interface ContractCounters {
  loThuoc: number;
  nhaSanXuat: number;
  donViKiemDinh: number;
  donViVanChuyen: number;
  nhaThuoc: number;
}

export async function fetchCounter(): Promise<ContractCounters> {
  const contract = getContract();
  const result = await contract.counter();
  return {
    loThuoc: Number(result[0]),
    nhaSanXuat: Number(result[1]),
    donViKiemDinh: Number(result[2]),
    donViVanChuyen: Number(result[3]),
    nhaThuoc: Number(result[4]),
  };
}

export async function fetchOwner(): Promise<string> {
  const contract = getContract();
  return contract.ChuSoHuu() as Promise<string>;
}

export async function fetchLotByIndex(index: number): Promise<OnChainLot> {
  const contract = getContract();
  const result = await contract.cacLoThuoc(index);
  return {
    id: result[0] as bigint,
    tenlothuoc: result[1] as string,
    nhaSanXuat: result[2] as bigint,
    donViKiemDinh: result[3] as bigint,
    donViVanChuyen: result[4] as bigint,
    nhaThuoc: result[5] as bigint,
    giaiDoan: Number(result[6]),
  };
}

// Fetch lot by its logical id (blockchain_lot_id from backend).
// The contract stores lots in cacLoThuoc[] array. The id field inside each lot
// should match the array index, so we call cacLoThuoc(id) directly.
export async function fetchLotOnChain(lotId: number): Promise<OnChainLot> {
  return fetchLotByIndex(lotId);
}

export interface RoleEntry {
  diaChi: string;
  id: number;
  active: boolean;
}

export async function fetchRole(
  type: "manufacturer" | "inspector" | "transporter" | "pharmacy",
  index: number
): Promise<RoleEntry> {
  const contract = getContract();
  const fnMap = {
    manufacturer: "nhaSanXuats",
    inspector: "donViKiemDinhs",
    transporter: "donViVanChuyens",
    pharmacy: "nhaThuocs",
  };
  const result = await contract[fnMap[type]](index);
  return {
    diaChi: result[0] as string,
    id: Number(result[1]),
    active: result[2] as boolean,
  };
}

// Get all roles of a given type (iterate 1..counter)
export async function fetchAllRoles(
  type: "manufacturer" | "inspector" | "transporter" | "pharmacy",
  count: number
): Promise<RoleEntry[]> {
  const entries: RoleEntry[] = [];
  for (let i = 1; i <= count; i++) {
    try {
      const entry = await fetchRole(type, i);
      entries.push(entry);
    } catch {
      break;
    }
  }
  return entries;
}

// ─── Read: Events ──────────────────────────────────────────────────────────────

// CapNhatTrangThai has NO indexed parameters (idLoThuoc is NOT indexed).
// Therefore RPC-level filtering is impossible — we must fetch all events
// and filter client-side by matching idLoThuoc.
export async function fetchLotHistory(lotId: number): Promise<OnChainEvent[]> {
  const provider = getProvider();
  const contract = getContract(provider);
  const filter = contract.filters.CapNhatTrangThai();

  let rawEvents: ethers.Log[];
  try {
    rawEvents = await contract.queryFilter(filter, 0, "latest");
  } catch {
    // Some public RPCs cap the block range — retry with a narrower window.
    const latest = await provider.getBlockNumber();
    const from = Math.max(0, latest - 500_000); // ~69 days at 12s/block
    rawEvents = await contract.queryFilter(filter, from, "latest");
  }

  return rawEvents
    .filter((e) => {
      const log = e as ethers.EventLog;
      return Number(log.args[0]) === lotId;
    })
    .map((e) => {
      const log = e as ethers.EventLog;
      return {
        idLoThuoc: log.args[0] as bigint,
        giaiDoan: Number(log.args[1]),
        nguoiCapNhat: log.args[2] as string,
        thoiGian: log.args[3] as bigint,
        ghiChu: log.args[4] as string,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      };
    });
}

// All status-change events (across every lot), for the explorer page
export async function fetchAllEvents(): Promise<OnChainEvent[]> {
  const provider = getProvider();
  const contract = getContract(provider);
  const filter = contract.filters.CapNhatTrangThai();

  let rawEvents: ethers.Log[];
  try {
    rawEvents = await contract.queryFilter(filter, 0, "latest");
  } catch {
    const latest = await provider.getBlockNumber();
    const from = Math.max(0, latest - 500_000);
    rawEvents = await contract.queryFilter(filter, from, "latest");
  }

  return rawEvents.map((e) => {
    const log = e as ethers.EventLog;
    return {
      idLoThuoc: log.args[0] as bigint,
      giaiDoan: Number(log.args[1]),
      nguoiCapNhat: log.args[2] as string,
      thoiGian: log.args[3] as bigint,
      ghiChu: log.args[4] as string,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    };
  });
}

// ─── Write: Lot lifecycle (requires MetaMask signer) ──────────────────────────

async function getSigner(): Promise<ethers.Signer> {
  const provider = getProvider();
  if (!(provider instanceof ethers.BrowserProvider)) {
    throw new Error("MetaMask is required to send transactions.");
  }
  return provider.getSigner();
}

export async function createLot(name: string): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.taoLoThuoc(name);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function supplyLot(lotId: number): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.Cungcaplothuoc(lotId);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

// Note: kiemDinhLoThuoc requires a digital signature (_chuKySo).
// The inspector must sign a message off-chain; provide the hex bytes here.
export async function inspectLot(
  lotId: number,
  passed: boolean,
  signatureHex: string
): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const sigBytes = ethers.getBytes(signatureHex);
  const tx = await contract.kiemDinhLoThuoc(lotId, passed, sigBytes);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function transportLot(lotId: number): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.vanChuyenLoThuoc(lotId);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function pharmacyReceiveLot(lotId: number): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.nhaThuocNhanHang(lotId);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function sellLot(lotId: number): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.banHang(lotId);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function cancelLot(lotId: number, reason: string): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.huyLoThuoc(lotId, reason);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

// ─── Write: Role management (owner only) ──────────────────────────────────────

export async function addManufacturer(address: string): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.themNhaSanXuat(address);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function addInspector(address: string): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.themDonViKiemDinh(address);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function addTransporter(address: string): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.themDonViVanChuyen(address);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function addPharmacy(address: string): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.themNhaThuoc(address);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function stageToStatus(stage: number): string {
  return STAGE_MAP[stage] || "Unknown";
}

export function truncateHash(hash: string, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

export function sepoliaEtherscanTx(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export function sepoliaEtherscanAddress(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}
