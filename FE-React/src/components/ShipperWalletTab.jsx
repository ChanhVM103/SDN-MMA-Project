import { useState, useEffect, useCallback } from "react";
import {
  getWalletBalance,
  getWalletTransactions,
  createTopupVnpayUrl,
  verifyTopupResult,
} from "../services/wallet-api";
import { parseStoredAuth } from "../services/auth-storage";

const fmt = (n) => (n || 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (d) => {
  const dt = new Date(d);
  return (
    dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
    ", " +
    dt.toLocaleDateString("vi-VN")
  );
};

const TOPUP_PRESETS = [50000, 100000, 200000, 500000];

const TXN_CONFIG = {
  topup:         { label: "Nạp tiền",       color: "#10b981", bg: "#f0fdf4", icon: "⬆️", sign: "+" },
  deduct:        { label: "Trừ tiền",        color: "#ef4444", bg: "#fef2f2", icon: "⬇️", sign: "-" },
  escrow:        { label: "Ký quỹ",          color: "#f59e0b", bg: "#fffbeb", icon: "🔒", sign: "-" },
  escrow_refund: { label: "Hoàn ký quỹ",     color: "#3b82f6", bg: "#eff6ff", icon: "🔓", sign: "+" },
  reward:        { label: "Thưởng",          color: "#8b5cf6", bg: "#f5f3ff", icon: "🎁", sign: "+" },
};

export default function ShipperWalletTab({ user, showToast }) {
  const [balance, setBalance]       = useState(null);
  const [txns, setTxns]             = useState([]);
  const [totalTxns, setTotalTxns]   = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Topup modal
  const [showTopup, setShowTopup]   = useState(false);
  const [amount, setAmount]         = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  // Payment result (khi redirect về từ VNPay)
  const [paymentResult, setPaymentResult] = useState(null);

  const load = useCallback(async (pg = 1, append = false) => {
    try {
      if (pg === 1) setLoading(true);
      else setLoadingMore(true);
      const [balData, txnData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(pg, 15),
      ]);
      setBalance(balData?.balance ?? balData);
      setTotalTxns(txnData?.pagination?.total || 0);
      if (append) setTxns((prev) => [...prev, ...(txnData?.data || [])]);
      else setTxns(txnData?.data || []);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1);

    // Kiểm tra nếu redirect về từ VNPay topup
    const params = new URLSearchParams(window.location.search);
    if (params.has("vnp_ResponseCode") && window.location.pathname.includes("shipper")) {
      verifyTopupResult(params.toString())
        .then((data) => {
          setPaymentResult(data);
          if (data.success) {
            showToast("🎉 Nạp tiền thành công!", "success");
            load(1); // reload balance
          } else {
            showToast(data.message || "Nạp tiền thất bại", "error");
          }
          // Xoá query params khỏi URL
          window.history.replaceState({}, "", window.location.pathname);
        })
        .catch(() => {});
    }
  }, []);

  const handleTopup = async () => {
    const finalAmount = Number(String(amount || customAmount).replace(/[^0-9]/g, ""));
    if (!finalAmount || finalAmount < 10000) {
      showToast("Số tiền nạp tối thiểu 10,000đ", "warning");
      return;
    }
    setTopupLoading(true);
    try {
      const { url } = await createTopupVnpayUrl(finalAmount);
      window.location.href = url;
    } catch (e) {
      showToast(e.message, "error");
      setTopupLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, true);
  };

  const hasMore = txns.length < totalTxns;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #f0f0f0", borderTop: "3px solid #ee4d2d", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>

      {/* ── Balance Card ── */}
      <div style={{
        background: "linear-gradient(135deg, #ee4d2d 0%, #ff7043 50%, #ff8a65 100%)",
        borderRadius: 20, padding: "28px 28px 24px", marginBottom: 20,
        boxShadow: "0 8px 32px rgba(238,77,45,0.3)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
            💼 Số dư ví của bạn
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", marginBottom: 4, letterSpacing: "-1px" }}>
            {fmt(balance)}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 20 }}>
            {user?.fullName} · Tài khoản shipper
          </div>
          <button
            onClick={() => setShowTopup(true)}
            style={{
              background: "#fff", color: "#ee4d2d",
              border: "none", borderRadius: 12, padding: "11px 24px",
              fontWeight: 800, fontSize: 14, cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              display: "flex", alignItems: "center", gap: 8,
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: 16 }}>➕</span> Nạp tiền vào ví
          </button>
        </div>
      </div>

      {/* ── Payment result banner ── */}
      {paymentResult && (
        <div style={{
          padding: "14px 18px", borderRadius: 12, marginBottom: 16,
          background: paymentResult.success ? "#f0fdf4" : "#fef2f2",
          border: `1.5px solid ${paymentResult.success ? "#86efac" : "#fca5a5"}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>{paymentResult.success ? "✅" : "❌"}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: paymentResult.success ? "#166534" : "#991b1b" }}>
              {paymentResult.success ? "Nạp tiền thành công!" : "Nạp tiền thất bại"}
            </div>
            <div style={{ fontSize: 12, color: paymentResult.success ? "#15803d" : "#dc2626", marginTop: 2 }}>
              {paymentResult.message}
              {paymentResult.data?.newBalance && ` · Số dư mới: ${fmt(paymentResult.data.newBalance)}`}
            </div>
          </div>
          <button onClick={() => setPaymentResult(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── Transaction history ── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>📋 Lịch sử giao dịch</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{totalTxns} giao dịch</div>
        </div>

        {txns.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14 }}>Chưa có giao dịch nào</div>
          </div>
        ) : (
          <>
            {txns.map((txn, i) => {
              const cfg = TXN_CONFIG[txn.type] || TXN_CONFIG.deduct;
              const isPositive = cfg.sign === "+";
              return (
                <div key={txn._id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 20px",
                  borderBottom: i < txns.length - 1 ? "1px solid #f9fafb" : "none",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{cfg.label}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span>{fmtDate(txn.createdAt)}</span>
                      {txn.description && <span>· {txn.description}</span>}
                      {txn.createdByAdmin && <span>· Quản trị viên: {txn.createdByAdmin.fullName}</span>}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 3, color: "#c4c4c4" }}>
                      Số dư trước: {fmt(txn.balanceBefore)} → {fmt(txn.balanceAfter)}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: isPositive ? "#10b981" : "#ef4444" }}>
                      {cfg.sign}{fmt(txn.amount)}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, marginTop: 4,
                      background: txn.status === "completed" ? "#f0fdf4" : txn.status === "pending" ? "#fffbeb" : "#fef2f2",
                      color: txn.status === "completed" ? "#15803d" : txn.status === "pending" ? "#92400e" : "#dc2626",
                      display: "inline-block",
                    }}>
                      {txn.status === "completed" ? "Hoàn thành" : txn.status === "pending" ? "Đang xử lý" : "Thất bại"}
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div style={{ padding: "14px 20px", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding: "9px 24px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                    background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Topup Modal ── */}
      {showTopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setShowTopup(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "relative", background: "#fff", borderRadius: 20,
            padding: "28px 28px 24px", width: "min(420px, 92vw)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            animation: "modalIn 0.3s cubic-bezier(.175,.885,.32,1.275)",
          }}>
            <button onClick={() => setShowTopup(false)} style={{ position: "absolute", top: 16, right: 16, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#6b7280" }}>✕</button>

            <div style={{ fontSize: 24, marginBottom: 4 }}>💳</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 4 }}>Nạp tiền vào ví</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Số dư hiện tại: <strong style={{ color: "#ee4d2d" }}>{fmt(balance)}</strong></div>

            {/* Preset amounts */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Chọn nhanh</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {TOPUP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setAmount(preset); setCustomAmount(""); }}
                  style={{
                    padding: "12px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
                    border: amount === preset ? "2px solid #ee4d2d" : "1.5px solid #e5e7eb",
                    background: amount === preset ? "#fff8f5" : "#fff",
                    color: amount === preset ? "#ee4d2d" : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  {preset.toLocaleString("vi-VN")}đ
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Hoặc nhập số tiền khác</div>
            <div style={{ position: "relative", marginBottom: 20 }}>
              <input
                type="number"
                placeholder="Nhập số tiền..."
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
                style={{
                  width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10,
                  padding: "12px 50px 12px 14px", fontSize: 14, outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#ee4d2d"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13, fontWeight: 700 }}>VNĐ</span>
            </div>

            {/* Total */}
            {(amount || customAmount) && (
              <div style={{ padding: "12px 16px", background: "#fff8f5", borderRadius: 10, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Số tiền nạp</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#ee4d2d" }}>
                  {fmt(Number(String(amount || customAmount).replace(/[^0-9]/g, "")))}
                </span>
              </div>
            )}

            <button
              onClick={handleTopup}
              disabled={topupLoading || (!amount && !customAmount)}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: (!amount && !customAmount) ? "#e5e7eb" : "linear-gradient(135deg,#0060af,#0078d4)",
                color: (!amount && !customAmount) ? "#9ca3af" : "#fff",
                fontWeight: 800, fontSize: 15, cursor: (!amount && !customAmount) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: (!amount && !customAmount) ? "none" : "0 4px 16px rgba(0,96,175,0.3)",
                transition: "all 0.2s",
              }}
            >
              {topupLoading
                ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Đang xử lý...</>
                : "🏦 Thanh toán qua VNPay →"
              }
            </button>

            <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
              Bạn sẽ được chuyển đến trang thanh toán VNPay an toàn
            </div>
          </div>
          <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}
