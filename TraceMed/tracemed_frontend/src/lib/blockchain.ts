import { ethers } from "ethers";
import { OnChainLot, OnChainEvent, STAGE_MAP } from "@/types";

const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
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
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint64",
        name: "idLoThuoc",
        type: "uint64",
      },
      { indexed: false, internalType: "uint8", name: "giaiDoan", type: "uint8" },
      {
        indexed: false,
        internalType: "address",
        name: "nguoiCapNhat",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "thoiGian",
        type: "uint256",
      },
      { indexed: false, internalType: "string", name: "ghiChu", type: "string" },
    ],
    name: "CapNhatTrangThai",
    type: "event",
  },
];

export function getProvider(): ethers.BrowserProvider | ethers.JsonRpcProvider {
  if (typeof window !== "undefined" && (window as unknown as { ethereum?: unknown }).ethereum) {
    return new ethers.BrowserProvider(
      (window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum
    );
  }
  const rpcUrl =
    process.env.NEXT_PUBLIC_WEB3_PROVIDER_URL || "http://localhost:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getContract(
  providerOrSigner?: ethers.Provider | ethers.Signer
): ethers.Contract {
  const contractAddress =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000";
  const p = providerOrSigner || getProvider();
  return new ethers.Contract(contractAddress, CONTRACT_ABI, p);
}

export async function fetchLotOnChain(lotId: number): Promise<OnChainLot> {
  const contract = getContract();
  const result = await contract.cacLoThuoc(lotId);
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

export async function fetchLotHistory(lotId: number): Promise<OnChainEvent[]> {
  const provider = getProvider();
  const contract = getContract(provider);

  const filter = contract.filters.CapNhatTrangThai(BigInt(lotId));
  const events = await contract.queryFilter(filter, 0, "latest");

  return events.map((e) => {
    const log = e as ethers.EventLog;
    const args = log.args;
    return {
      idLoThuoc: args[0] as bigint,
      giaiDoan: Number(args[1]),
      nguoiCapNhat: args[2] as string,
      thoiGian: args[3] as bigint,
      ghiChu: args[4] as string,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    };
  });
}

export function stageToStatus(stage: number): string {
  return STAGE_MAP[stage] || "Unknown";
}

export function truncateHash(hash: string, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}
