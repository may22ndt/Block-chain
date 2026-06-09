# TraceMed Smart Contract

Contract ABI file:

```text
medicine/contracts/MedicineTraceabilityABI.json
```

## Deployment

```text
Contract name: ChuoiCungUng
Backend alias: MedicineTraceability
Network: Sepolia
Chain ID: 11155111
RPC URL: Configured locally via WEB3_PROVIDER_URL
Contract address: 0xf9592BDC391C778F2BE7Eb3F736784e505E0B534
Deploy wallet / owner: 0x26AC1ca04a5EEa8d61D8150FEF41879638446a26
```

Local `.env` currently uses an Alchemy Sepolia RPC URL. Keep the real URL in
`.env` only; do not commit it.

## Known Role Wallets

```text
Owner / admin: 0x26AC1ca04a5EEa8d61D8150FEF41879638446a26
Manufacturer: 0x3213D3276C2d48b53766866A65aB4073F0219E4f
Inspector: 0x58Df377fF75E6cD424310D16827540862E701A93
Logistics: 0x0541E99bcf35D05902044a0D724c83fded2A483d
Pharmacy / distributor: 0x638F77700AC7B01d970f1e87d064a2CcfbBda295
```

## Notes

- `PRIVATE_KEY` is required only when backend signs transactions.
- Do not commit real private keys.
- QR and frontend lookup continue to use `batch_number`; blockchain functions use `idLoThuoc`.
- The deployed ABI exposes Vietnamese function names such as `taoLoThuoc`,
  `Cungcaplothuoc`, `kiemDinhLoThuoc`, `vanChuyenLoThuoc`, `nhaThuocNhanHang`,
  `banHang`, `thuHoiLoThuoc`, and `cacLoThuoc`.
- The contract does not expose a `showStage` function. Backend reads stage from
  `cacLoThuoc(idLoThuoc)`.
- The contract does not store a public history array. Backend reads on-chain
  history from `CapNhatTrangThai` events.
- The contract does not have a separate temperature breach function. Backend maps
  a temperature breach to `thuHoiLoThuoc` when an on-chain action is required.
- `kiemDinhLoThuoc` signs `keccak256(abi.encode(idLoThuoc, datTieuChuan))`.
- `thuHoiLoThuoc` signs `keccak256(abi.encode(idLoThuoc, lyDo))`.
- If `PRIVATE_KEY` is configured, backend can generate those signatures before
  sending the transaction. Without `PRIVATE_KEY`, backend can only read contract
  state and events.
