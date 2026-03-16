import { useState, useEffect, useCallback } from "react";
import {
  getAvailableOrders, getShipperOrders,
  shipperAcceptOrder, shipperPickedUp, shipperCompleteDelivery,
  shipperReportBomb,
} from "../services/order-api";
import { getProfileApi } from "../services/auth-api";
import { parseStoredAuth } from "../services/auth-storage";

const fmt  = n => (n||0).toLocaleString("vi-VN") + "đ";
const fmtD = d => { const dt=new Date(d); return dt.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})+", "+dt.toLocaleDateString("vi-VN"); };
const hour = () => { const h=new Date().getHours(); return h<12?"buổi sáng":h<18?"buổi chiều":"buổi tối"; };

const STATUS_CFG = {
  ready_for_pickup:  { label:"CHỜ XÁC NHẬN", color:"#ee4d2d", bg:"#fff0ed" },
  shipper_accepted:  { label:"ĐÃ NHẬN ĐƠN",  color:"#3b82f6", bg:"#eff6ff" },
  delivering:        { label:"ĐANG GIAO",     color:"#10b981", bg:"#f0fdf4" },
  shipper_delivered: { label:"ĐÃ GIAO",       color:"#10b981", bg:"#f0fdf4" },
  delivered:         { label:"HOÀN THÀNH",    color:"#6b7280", bg:"#f9fafb" },
  cancelled:         { label:"ĐÃ HỦY",        color:"#ef4444", bg:"#fef2f2" },
};

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ flex:1, background:"#fff", borderRadius:12, padding:"18px 20px", border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:8 }}>{label}</div>
        <div style={{ fontSize:30, fontWeight:800, color }}>{value}</div>
      </div>
      <div style={{ fontSize:28, opacity:0.4 }}>{icon}</div>
    </div>
  );
}

// ── Order Card (left panel) ───────────────────────────────────
function OrderInfoCard({ order }) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.ready_for_pickup;
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", overflow:"hidden" }}>
      {/* Card header */}
      <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44,height:44,borderRadius:10,background:"#fff0ed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>🏪</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:16, color:"#1a1a1a" }}>{order.restaurantName}</div>
          <div style={{ fontSize:12, color:"#9ca3af", marginTop:1, display:"flex", alignItems:"center", gap:6 }}>
            ID: #{order._id.slice(-8).toUpperCase()} · {fmtD(order.createdAt)}
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background: order.paymentMethod==="cash"?"#fef3c7":"#dbeafe", color: order.paymentMethod==="cash"?"#92400e":"#1e40af", border: `1px solid ${order.paymentMethod==="cash"?"#fcd34d":"#93c5fd"}` }}>
              {order.paymentMethod==="cash"?"💵 COD":"💳 VNPay"}
            </span>
          </div>
        </div>
        <span style={{ fontSize:12, fontWeight:800, color:cfg.color, background:cfg.bg, padding:"5px 12px", borderRadius:20, border:`1px solid ${cfg.color}33`, letterSpacing:"0.4px" }}>{cfg.label}</span>
      </div>

      {/* 2-col body: customer+address LEFT, note RIGHT */}
      <div style={{ padding:"16px 20px", display:"flex", gap:24 }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
          {/* Customer */}
          <div style={{ display:"flex", gap:10 }}>
            <span style={{ fontSize:15, color:"#9ca3af", marginTop:2 }}>👤</span>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Khách hàng</div>
              <div style={{ fontWeight:600, fontSize:14, color:"#1a1a1a" }}>{order.user?.fullName || "Khách hàng"}</div>
              {order.user?.phone && <div style={{ fontSize:13, color:"#ee4d2d", fontWeight:600, marginTop:1 }}>{order.user.phone}</div>}
            </div>
          </div>
          {/* Address */}
          <div style={{ display:"flex", gap:10 }}>
            <span style={{ fontSize:15, color:"#ee4d2d", marginTop:2 }}>📍</span>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Địa chỉ giao hàng</div>
              <div style={{ fontSize:13, color:"#374151", lineHeight:1.6 }}>{order.deliveryAddress}</div>
            </div>
          </div>
        </div>

        {/* Note box */}
        {order.note && (
          <div style={{ width:260, flexShrink:0, background:"#f9fafb", borderRadius:12, padding:"14px 16px", border:"1px solid #e5e7eb" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
              💬 GHI CHÚ TỪ KHÁCH
            </div>
            <div style={{ fontSize:13, color:"#374151", fontStyle:"italic", lineHeight:1.6 }}>"{order.note}"</div>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding:"0 20px 16px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Chi tiết món ăn</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {order.items?.map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#fafafa", borderRadius:8 }}>
              <span style={{ width:28, height:28, borderRadius:6, background:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#374151", flexShrink:0 }}>{item.quantity}x</span>
              <span style={{ flex:1, fontSize:14, color:"#374151", fontWeight:500 }}>{item.name}</span>
              <span style={{ fontWeight:700, fontSize:14, color:"#1a1a1a" }}>{fmt(item.price*item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Right panel (summary + actions) ──────────────────────────
function OrderSummaryPanel({ order, onAccept, onPickup, onComplete, onReportBomb, onRefresh, mode, user, showToast }) {
  const [busy, setBusy] = useState(false);
  const income = order.deliveryFee || 0;

  const doAction = async (fn) => {
    setBusy(true);
    try { await fn(order._id); }
    catch(e) { showToast(e.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Summary box */}
      <div style={{ background:"#fff", borderRadius:16, padding:"20px", border:"1px solid #e5e7eb" }}>
        <div style={{ fontWeight:700, fontSize:16, color:"#1a1a1a", marginBottom:16 }}>Tổng kết đơn hàng</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <SRow label="Giá trị món ăn" value={fmt(order.subtotal)}/>
          <SRow label="Phí giao hàng (Khách trả)" value={fmt(order.deliveryFee)}/>
          {order.discount>0 && <SRow label="Khuyến mãi" value={`-${fmt(order.discount)}`} green/>}
        </div>
        <div style={{ borderTop:"1px solid #f3f4f6", marginTop:14, paddingTop:14, display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
          <span style={{ fontWeight:700, fontSize:15, color:"#1a1a1a" }}>Tổng thanh toán</span>
          <span style={{ fontWeight:800, fontSize:20, color:"#1a1a1a" }}>{fmt(order.total)}</span>
        </div>
      </div>

      {/* Income */}
      <div style={{ background:"#fff7ed", borderRadius:14, padding:"16px 20px", border:"1px solid #fed7aa", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#92400e", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Thu nhập của bạn (phí ship)</div>
          <div style={{ fontSize:24, fontWeight:800, color:"#ee4d2d" }}>{fmt(income)}</div>
        </div>
        <span style={{ fontSize:24 }}>💰</span>
      </div>

      {/* COD Escrow Warning */}
      {order.paymentMethod === "cash" && mode === "available" && (
        <div style={{ background:"#fef3c7", borderRadius:14, padding:"14px 16px", border:"1px solid #fcd34d" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#92400e", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>⚠️ Đơn thanh toán tiền mặt (COD)</div>
          <div style={{ fontSize:12, color:"#78350f", lineHeight:1.6 }}>
            Khi nhận đơn này, hệ thống sẽ <strong>trừ {fmt(order.total - (order.deliveryFee || 0))}</strong> từ ví của bạn để ký quỹ cho nhà hàng.
          </div>
          <div style={{ fontSize:12, color:"#78350f", lineHeight:1.6, marginTop:4 }}>
            Bạn sẽ thu <strong>{fmt(order.total)}</strong> tiền mặt từ khách khi giao hàng (lời phí ship <strong>{fmt(order.deliveryFee || 0)}</strong>).
          </div>
          {user && (user.walletBalance || 0) < (order.total - (order.deliveryFee || 0)) && (
            <div style={{ marginTop:8, fontSize:12, fontWeight:700, color:"#dc2626", background:"#fef2f2", padding:"8px 12px", borderRadius:8, border:"1px solid #fecaca" }}>
              ❌ Số dư ví không đủ! Cần tối thiểu {fmt(order.total - (order.deliveryFee || 0))} để nhận đơn này.
            </div>
          )}
        </div>
      )}

      {/* COD info for active orders */}
      {order.paymentMethod === "cash" && mode === "active" && (
        <div style={{ background:"#fef3c7", borderRadius:14, padding:"14px 16px", border:"1px solid #fcd34d" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#92400e", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>💵 Thu tiền mặt khi giao</div>
          <div style={{ fontSize:12, color:"#78350f", lineHeight:1.6 }}>
            Thu <strong>{fmt(order.total)}</strong> tiền mặt từ khách hàng.
          </div>
        </div>
      )}

      {/* Action buttons */}
      {mode==="available" && (
        <>
          <button onClick={()=>doAction(onAccept)} disabled={busy} style={{ padding:"15px", borderRadius:12, border:"none", background:busy?"#e5e7eb":"#ee4d2d", color:busy?"#9ca3af":"#fff", fontWeight:800, fontSize:15, cursor:busy?"not-allowed":"pointer", boxShadow:busy?"none":"0 4px 14px rgba(238,77,45,.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {busy ? "⏳ Đang xử lý..." : <><span>✓</span> Xác nhận đã nhận đơn</>}
          </button>
          <button onClick={onRefresh} style={{ padding:"13px", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#fff", color:"#6b7280", fontWeight:600, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            ↺ Làm mới
          </button>
        </>
      )}
      {mode==="active" && order.status==="shipper_accepted" && (
        <button onClick={()=>doAction(onPickup)} disabled={busy} style={{ padding:"15px", borderRadius:12, border:"none", background:busy?"#e5e7eb":"#3b82f6", color:busy?"#9ca3af":"#fff", fontWeight:800, fontSize:15, cursor:busy?"not-allowed":"pointer", boxShadow:busy?"none":"0 4px 14px rgba(59,130,246,.35)" }}>
          {busy ? "⏳..." : "📦 Đã lấy hàng từ nhà hàng"}
        </button>
      )}
      {mode==="active" && order.status==="delivering" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={()=>onComplete(order)} disabled={busy} style={{ padding:"15px", borderRadius:12, border:"none", background:busy?"#e5e7eb":"#10b981", color:busy?"#9ca3af":"#fff", fontWeight:800, fontSize:15, cursor:busy?"not-allowed":"pointer", boxShadow:busy?"none":"0 4px 14px rgba(16,185,129,.35)" }}>
            {busy ? "⏳..." : "✅ Đã giao thành công"}
          </button>
          <button onClick={()=>onReportBomb(order)} disabled={busy} style={{ padding:"12px", borderRadius:12, border:"1.5px solid #ef4444", background:"#fff", color:"#ef4444", fontWeight:700, fontSize:14, cursor:busy?"not-allowed":"pointer" }}>
            {busy ? "⏳..." : "📞 Không liên lạc được khách hàng"}
          </button>
        </div>
      )}

      {/* Support box */}
      <div style={{ background:"#eff6ff", borderRadius:12, padding:"14px 16px", border:"1px solid #bfdbfe" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1e40af", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>ℹ️ Cần hỗ trợ?</div>
        <div style={{ fontSize:12, color:"#3b82f6", lineHeight:1.5 }}>Nếu gặp vấn đề trong quá trình lấy hàng, vui lòng liên hệ tổng đài 1900-FOODIE.</div>
      </div>
    </div>
  );
}

function SRow({ label, value, green }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
      <span style={{ color:green?"#10b981":"#9ca3af" }}>{label}</span>
      <span style={{ fontWeight:600, color:green?"#10b981":"#6b7280" }}>{value}</span>
    </div>
  );
}

// ── Map placeholder ───────────────────────────────────────────
function MapSection({ order }) {
  const addr = encodeURIComponent(order?.deliveryAddress || "Ho Chi Minh City");
  return (
    <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid #e5e7eb", position:"relative", height:200 }}>
      <iframe
        title="map"
        width="100%" height="100%" frameBorder="0" style={{ display:"block" }}
        src={`https://maps.google.com/maps?q=${addr}&output=embed&z=14`}
        allowFullScreen
      />
      <div style={{ position:"absolute", bottom:12, left:12, background:"rgba(0,0,0,.7)", color:"#fff", borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
        🧭 {order?.deliveryAddress?.slice(0,40)}...
      </div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────
function StatsTab({ orders }) {
  // Những đơn tính tiền cho shipper: Đã giao xong HOẶC bị bom nhưng đã trả VNPay
  const done   = orders.filter(o => o.status === "delivered" || (o.status === "bombed" && o.paymentMethod === "vnpay"));
  const income = done.reduce((s,o)=>s + (o.deliveryFee||0), 0);
  const today  = new Date().toLocaleDateString("vi-VN");
  const todayD = done.filter(o=>new Date(o.createdAt).toLocaleDateString("vi-VN")===today);
  const todayI = todayD.reduce((s,o)=>s + (o.deliveryFee||0), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatCard label="Tổng hoàn thành" value={done.length} icon="🎉" color="#10b981"/>
        <StatCard label="Tổng thu nhập"   value={fmt(income)} icon="💰" color="#ee4d2d"/>
        <StatCard label="Đơn hôm nay"     value={todayD.length} icon="📦" color="#3b82f6"/>
        <StatCard label="Thu hôm nay"     value={fmt(todayI)} icon="💵" color="#f59e0b"/>
      </div>
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", fontWeight:700, fontSize:15, color:"#1a1a1a" }}>📋 Lịch sử gần đây (Bao gồm đơn Bom đã trả VNPay)</div>
        {done.length===0
          ? <div style={{ padding:"40px", textAlign:"center", color:"#9ca3af" }}>Chưa có đơn hoàn thành</div>
          : done.slice(0,10).map(o=>(
            <div key={o._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", borderBottom:"1px solid #f9fafb" }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>
                  {o.restaurantName} {o.status === "bombed" && <span style={{ color: "#ef4444", fontSize: 10 }}>(Bị bom)</span>}
                </div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{fmtD(o.createdAt)} · {o.items?.length} món</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, color:"#ee4d2d", fontSize:13 }}>+{fmt(o.deliveryFee || 0)}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>Tổng đơn: {fmt(o.total)}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ShipperDashboardPage({ user: initialUser, onLogout, showToast, showConfirm }) {
  const [tab,       setTab]       = useState("available");
  const [available, setAvailable] = useState([]);
  const [myOrders,  setMyOrders]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [selIdx,    setSelIdx]    = useState(0); 
  const [localUser, setLocalUser] = useState(initialUser);

  // Modal logic
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showBombModal,     setShowBombModal]     = useState(false);
  const [orderToAction,    setOrderToAction]     = useState(null);
  const [formLoading,      setFormLoading]       = useState(false);
  const [formData, setFormData] = useState({ proofImage: "", reason: "" });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, proofImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const load = useCallback(async (quiet=false) => {
    if(!quiet) setLoading(true);
    try {
      const { token } = parseStoredAuth();
      const [av,my,prof] = await Promise.all([
        getAvailableOrders(), 
        getShipperOrders(),
        getProfileApi(token).catch(()=>null)
      ]);
      setAvailable(av||[]);
      setMyOrders(my||[]);
      if(prof?.user) setLocalUser(prof.user);
    } catch(e) { console.error(e); }
    finally { if(!quiet) setLoading(false); }
  },[setLoading, setAvailable, setMyOrders, setLocalUser]); // Added dependencies for useCallback

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ const id=setInterval(()=>load(true),8000); return()=>clearInterval(id); },[load]);

  const active   = myOrders.filter(o=>["shipper_accepted","delivering"].includes(o.status));
  const history  = myOrders.filter(o=>["shipper_delivered","delivered","cancelled"].includes(o.status));
  const completed= myOrders.filter(o=>o.status==="delivered").length;
  const income   = myOrders.filter(o=>o.status==="delivered").reduce((s,o)=>s + (o.deliveryFee||0), 0);

  const handleAccept   = async id=>{ 
    await shipperAcceptOrder(id);       await load(true); showToast("✅ Đã nhận đơn!"); setSelIdx(0); 
  };
  const handlePickup   = async id=>{ await shipperPickedUp(id);          await load(true); showToast("📦 Đã lấy hàng!"); };
  
  const handleComplete = async (order) => {
    setOrderToAction(order);
    setFormData({ proofImage: "", reason: "" });
    setShowCompleteModal(true);
  };

  const handleReportBomb = async (order) => {
    setOrderToAction(order);
    setFormData({ proofImage: "", reason: "" });
    setShowBombModal(true);
  };

  const submitComplete = async () => {
    if (!formData.proofImage) return showToast("⚠️ Vui lòng cung cấp ảnh bằng chứng!", "error");
    if (!orderToAction?._id) return showToast("⚠️ Lỗi: Không tìm thấy ID đơn hàng", "error");
    
    setFormLoading(true);
    try {
      await shipperCompleteDelivery(orderToAction._id, { proofImage: formData.proofImage });
      await load(true);
      showToast("🎉 Giao hàng thành công!");
      setShowCompleteModal(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setFormLoading(false); }
  };

  const submitBomb = async () => {
    if (!formData.proofImage) return showToast("⚠️ Vui lòng cung cấp ảnh hiện trường!", "error");
    if (!orderToAction?._id) return showToast("⚠️ Lỗi: Không tìm thấy ID đơn hàng", "error");
    
    setFormLoading(true);
    try {
      await shipperReportBomb(orderToAction._id, { 
        proofImage: formData.proofImage, 
        reason: formData.reason || "User không nhận hàng" 
      });
      await load(true);
      showToast("📞 Đã gửi báo cáo không liên lạc được khách!", "warning");
      setShowBombModal(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setFormLoading(false); }
  };

  const TABS = [
    { key:"available", label:"Chờ Nhận",  count:available.length },
    { key:"active",    label:"Đang Giao", count:active.length    },
    { key:"history",   label:"Lịch Sử",   count:null             },
    { key:"stats",     label:"Thống Kê",  count:null             },
  ];

  // Current list for selected tab
  const curList = tab==="available" ? available : tab==="active" ? active : tab==="history" ? history : [];
  const selOrder = curList[selIdx] || curList[0] || null;

  return (
    <div style={{ minHeight:"100vh", background:"#f3f4f6", fontFamily:"inherit" }}>

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1160, margin:"0 auto", padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🛵</span>
            <span style={{ fontWeight:800, fontSize:16, color:"#1a1a1a" }}>Shipper Dashboard</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 14px", borderRadius: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💳 Ví:</span>
              <span style={{ fontWeight: 800, color: "#16a34a" }}>{fmt(localUser?.walletBalance)}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#1a1a1a" }}>{localUser?.fullName}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>ID: {localUser?.id?.slice(-6).toUpperCase()}</div>
              </div>
              <div style={{ width:36,height:36,borderRadius:"50%",overflow:"hidden",background:"#f3f4f6",flexShrink:0,border:"2px solid #e5e7eb" }}>
                {localUser?.avatar
                  ? <img src={localUser.avatar} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>👤</div>}
              </div>
              <button onClick={onLogout} style={{ padding:"7px 14px",borderRadius:8,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontWeight:600,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
                ↩ Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:"0 auto", padding:"20px 24px" }}>

        {/* Welcome */}
        <div style={{ background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:16, border:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48,height:48,borderRadius:14,background:"#fff0ed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>🛵</div>
            <div>
              <div style={{ fontWeight:800,fontSize:18,color:"#1a1a1a" }}>Chào {hour()}, {localUser?.fullName?.split(" ").pop()}!</div>
              <div style={{ fontSize:13,color:"#9ca3af",marginTop:2 }}>Hôm nay bạn có {available.length} lộ trình mới cực hấp dẫn.</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontWeight:700,fontSize:13,color:"#1a1a1a" }}>{localUser?.fullName}</div>
            <div style={{ fontSize:12,color:"#9ca3af" }}>ID: {localUser?.id?.slice(-6).toUpperCase()}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
          <StatCard label="Chờ nhận"   value={available.length.toString().padStart(2,"0")} icon="📋" color="#f59e0b"/>
          <StatCard label="Đang giao"  value={active.length.toString().padStart(2,"0")}    icon="🚚" color="#3b82f6"/>
          <StatCard label="Hoàn thành" value={completed.toString().padStart(2,"0")}         icon="✅" color="#10b981"/>
          <StatCard label="Số dư ví"    value={fmt(localUser?.walletBalance || 0)}           icon="💰" color="#ee4d2d"/>
        </div>

        {/* Tabs */}
        <div style={{ background:"#fff", borderRadius:12, marginBottom:16, border:"1px solid #e5e7eb", display:"flex" }}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>{ setTab(t.key); setSelIdx(0); }} style={{
              flex:1, padding:"14px 0", border:"none", background:"none", cursor:"pointer",
              fontSize:14, fontWeight:tab===t.key?700:400,
              color:tab===t.key?"#ee4d2d":"#6b7280",
              borderBottom:tab===t.key?"2.5px solid #ee4d2d":"2.5px solid transparent",
              transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>
              {t.label}
              {t.count!=null&&t.count>0&&<span style={{ background:"#ee4d2d",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign:"center",padding:"80px 0",color:"#9ca3af" }}>
            <div style={{ fontSize:36,display:"inline-block",animation:"spin 1s linear infinite" }}>⏳</div>
            <div style={{ marginTop:12 }}>Đang tải...</div>
          </div>
        ) : tab==="stats" ? (
          <StatsTab orders={myOrders}/>
        ) : (
          <>
            {curList.length===0 ? (
              <div style={{ textAlign:"center",padding:"60px",background:"#fff",borderRadius:16,border:"1px solid #e5e7eb" }}>
                <div style={{ fontSize:48,marginBottom:12 }}>{ tab==="available"?"📋":tab==="active"?"🚚":"📜" }</div>
                <div style={{ color:"#9ca3af",fontSize:15 }}>{ tab==="available"?"Chưa có đơn chờ nhận":tab==="active"?"Không có đơn đang giao":"Chưa có lịch sử" }</div>
              </div>
            ) : tab==="history" ? (
              /* History: simple list, no 2-col */
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {curList.map(o=>{
                  const cfg=STATUS_CFG[o.status]||STATUS_CFG.delivered;
                  return(
                    <div key={o._id} style={{ background:"#fff",borderRadius:14,padding:"14px 20px",border:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:14,color:"#1a1a1a" }}>{o.restaurantName}</div>
                        <div style={{ fontSize:12,color:"#9ca3af",marginTop:2 }}>{fmtD(o.createdAt)} · {o.deliveryAddress?.slice(0,50)}</div>
                        <div style={{ fontSize:12,color:"#6b7280",marginTop:3 }}>{o.items?.map(i=>`${i.name} x${i.quantity}`).join(", ")}</div>
                      </div>
                      <div style={{ textAlign:"right",flexShrink:0 }}>
                        <span style={{ fontSize:11,fontWeight:700,color:cfg.color,background:cfg.bg,padding:"3px 10px",borderRadius:20,border:`1px solid ${cfg.color}33` }}>{cfg.label}</span>
                        <div style={{ fontWeight:700,color:"#ee4d2d",fontSize:14,marginTop:6 }}>+{fmt(o.deliveryFee || 0)}</div>
                        <div style={{ fontSize:11,color:"#9ca3af" }}>Tổng đơn: {fmt(o.total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Available / Active: 2-col layout */
              <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:20 }}>
                {/* Left: List */}
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:"calc(100vh - 350px)", overflowY:"auto", paddingRight:6 }} className="custom-scrollbar">
                  {curList.map((order, i) => (
                    <div key={order._id} onClick={()=>setSelIdx(i)} style={{ 
                      padding:"16px", borderRadius:14, cursor:"pointer", border:"1.5px solid",
                      borderColor:selIdx===i?"#ee4d2d":"#e5e7eb",
                      background:selIdx===i?"#fff":"#fafafa",
                      boxShadow:selIdx===i?"0 4px 12px rgba(238,77,45,.12)":"none",
                      transition:"all .2s"
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontWeight:800, fontSize:13 }}>#{order._id.slice(-6).toUpperCase()}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:8, background: order.paymentMethod==="cash"?"#fef3c7":"#dbeafe", color: order.paymentMethod==="cash"?"#92400e":"#1e40af" }}>
                            {order.paymentMethod==="cash"?"COD":"VNPay"}
                          </span>
                          <span style={{ fontSize:12, fontWeight:700, color:"#ee4d2d" }}>{fmt(order.deliveryFee)}</span>
                        </div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{order.restaurantName}</div>
                      <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.4 }}>📍 {order.deliveryAddress?.slice(0,60)}...</div>
                    </div>
                  ))}
                </div>
                {/* Right: Detail */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {selOrder && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, alignItems:"start" }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                        <OrderInfoCard order={selOrder}/>
                        <MapSection order={selOrder}/>
                      </div>
                      <OrderSummaryPanel 
                        order={selOrder} mode={tab} user={localUser}
                        onAccept={handleAccept} onPickup={handlePickup} 
                        onComplete={handleComplete} onReportBomb={handleReportBomb}
                        onRefresh={()=>load(true)}
                        showToast={showToast}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Giao hàng thành công */}
      {showCompleteModal && (
        <div style={mOverlay}>
          <div style={mContent}>
            <div style={mHeader}>✅ Hoàn thành giao hàng</div>
            <div style={mBody}>
              <div style={mLabel}>Chụp ảnh xác nhận giao hàng:</div>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={mInputFile}/>
              {formData.proofImage && <img src={formData.proofImage} alt="proof" style={mPreview}/>}
            </div>
            <div style={mFooter}>
              <button disabled={formLoading} onClick={()=>setShowCompleteModal(false)} style={mBtnCancel}>Đóng</button>
              <button disabled={formLoading} onClick={submitComplete} style={mBtnSubmit}>
                {formLoading ? "⏳ Đang gửi..." : "Xác nhận giao xong"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Báo bom hàng */}
      {showBombModal && (
        <div style={mOverlay}>
          <div style={mContent}>
            <div style={{ ...mHeader, color: "#ef4444" }}>📞 Báo cáo không liên lạc được khách hàng</div>
            <div style={mBody}>
              <div style={mLabel}>Lý do không giao được:</div>
              <textarea 
                placeholder="Ví dụ: Gọi 3 lần không nghe máy, địa chỉ ảo..." 
                value={formData.reason} 
                onChange={e=>setFormData({...formData, reason: e.target.value})}
                style={mTextArea}
              />
              <div style={{ ...mLabel, marginTop: 16 }}>Ảnh hiện trường làm bằng chứng:</div>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={mInputFile}/>
              {formData.proofImage && <img src={formData.proofImage} alt="proof" style={mPreview}/>}
            </div>
            <div style={mFooter}>
              <button disabled={formLoading} onClick={()=>setShowBombModal(false)} style={mBtnCancel}>Đóng</button>
              <button disabled={formLoading} onClick={submitBomb} style={{ ...mBtnSubmit, background: "#ef4444" }}>
                {formLoading ? "⏳ Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}

// ── Modal Styles ──
const mOverlay = { position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000 };
const mContent = { background:"#fff", borderRadius:20, width:"90%", maxWidth:420, overflow:"hidden", border:"1px solid #e5e7eb", boxShadow:"0 20px 25px -5px rgba(0,0,0,0.1)" };
const mHeader  = { padding:"20px", borderBottom:"1px solid #f3f4f6", fontWeight:800, fontSize:17, textAlign:"center" };
const mBody    = { padding:"20px" };
const mFooter  = { padding:"16px 20px", borderTop:"1px solid #f3f4f6", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };
const mLabel   = { fontSize:14, fontWeight:700, color:"#4b5563", marginBottom:8 };
const mInputFile = { width:"100%", fontSize:13, color:"#6b7280", padding:"8px 0" };
const mPreview  = { width:"100%", height:160, objectFit:"cover", borderRadius:12, marginTop:12, border:"1px solid #e5e7eb" };
const mTextArea = { width:"100%", height:80, borderRadius:12, border:"1.5px solid #e5e7eb", padding:"12px", fontSize:14, fontFamily:"inherit", resize:"none", outline:"none" };
const mBtnCancel = { padding:"12px", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#fff", color:"#6b7280", fontWeight:700, fontSize:14, cursor:"pointer" };
const mBtnSubmit = { padding:"12px", borderRadius:12, border:"none", background:"#ee4d2d", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" };
