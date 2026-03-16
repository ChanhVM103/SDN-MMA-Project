import ShipperWalletTab from "../components/ShipperWalletTab";
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
  ready_for_pickup:  { label:"CHỜ XÁC NHẬN", color:"#f59e0b", bg:"#fffbeb" },
  shipper_accepted:  { label:"ĐÃ NHẬN ĐƠN",           color:"#3b82f6", bg:"#eff6ff" },
  delivering:        { label:"ĐANG GIAO",               color:"#10b981", bg:"#f0fdf4" },
  shipper_delivered: { label:"ĐÃ GIAO",                color:"#10b981", bg:"#f0fdf4" },
  delivered:         { label:"HOÀN THÀNH",                color:"#6b7280", bg:"#f9fafb" },
  cancelled:         { label:"ĐÃ HỦY",                color:"#ef4444", bg:"#fef2f2" },
};

// ── Nav link ─────────────────────────────────────────────────
function NavLink({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:"none", border:"none", cursor:"pointer",
      fontSize:14, fontWeight:active?700:500,
      color: active?"#ee4d2d":"#6b7280",
      padding:"0 4px 4px",
      borderBottom: active?"2px solid #ee4d2d":"2px solid transparent",
      transition:"all .15s",
    }}>{label}</button>
  );
}

// ── Stat card (top row) ───────────────────────────────────────
function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:"#fff", borderRadius:14, padding:"18px 20px",
      border:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:14,
      cursor: onClick?"pointer":"default",
      transition:"box-shadow .15s",
    }}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)")}
      onMouseLeave={e=>onClick&&(e.currentTarget.style.boxShadow="none")}
    >
      <div style={{ width:44,height:44,borderRadius:12,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:26,fontWeight:800,color,lineHeight:1 }}>{value}</div>
      </div>
    </div>
  );
}

// ── Order list item ───────────────────────────────────────────
function OrderListItem({ order, selected, onClick }) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.ready_for_pickup;
  return (
    <div onClick={onClick} style={{
      padding:"14px 16px", borderRadius:12, cursor:"pointer",
      border:`1.5px solid ${selected?"#ee4d2d":"#e5e7eb"}`,
      background: selected?"#fff8f5":"#fff",
      boxShadow: selected?"0 2px 12px rgba(238,77,45,.1)":"none",
      transition:"all .15s",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:12,fontWeight:800,color:"#374151" }}>#{order._id.slice(-6).toUpperCase()}</span>
        <span style={{ fontSize:10,fontWeight:700,color:cfg.color,background:cfg.bg,padding:"2px 8px",borderRadius:8 }}>{cfg.label}</span>
      </div>
      <div style={{ fontWeight:700,fontSize:14,color:"#1a1a1a",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{order.restaurantName}</div>
      <div style={{ fontSize:12,color:"#9ca3af",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>📍 {order.deliveryAddress}</div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:11,padding:"2px 8px",borderRadius:6,fontWeight:700,background:order.paymentMethod==="cash"?"#fef3c7":"#dbeafe",color:order.paymentMethod==="cash"?"#92400e":"#1e40af" }}>
          {order.paymentMethod==="cash"?"💵 COD":"💳 VNPay"}
        </span>
        <span style={{ fontSize:14,fontWeight:800,color:"#ee4d2d" }}>{fmt(order.deliveryFee)}</span>
      </div>
    </div>
  );
}

// ── Order detail center panel ─────────────────────────────────
function OrderDetailPanel({ order }) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.ready_for_pickup;
  return (
    <div style={{ background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 24px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:40,height:40,borderRadius:10,background:"#fff0ed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🏪</div>
          <div>
            <div style={{ fontWeight:700,fontSize:16,color:"#1a1a1a" }}>{order.restaurantName}</div>
            <div style={{ fontSize:12,color:"#9ca3af",marginTop:1 }}>ID: #{order._id.slice(-8).toUpperCase()} · {fmtD(order.createdAt)}</div>
          </div>
        </div>
        <span style={{ fontSize:11,fontWeight:800,color:cfg.color,background:cfg.bg,padding:"5px 14px",borderRadius:20,border:`1px solid ${cfg.color}33`,letterSpacing:"0.5px" }}>{cfg.label}</span>
      </div>

      {/* Customer + Address */}
      <div style={{ padding:"18px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,borderBottom:"1px solid #f3f4f6" }}>
        <div>
          <div style={{ fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8 }}>Customer Information</div>
          <div style={{ fontWeight:700,fontSize:15,color:"#1a1a1a" }}>{order.user?.fullName || "Khách hàng"}</div>
          {order.deliveryPhone && <div style={{ fontSize:14,color:"#ee4d2d",fontWeight:600,marginTop:4 }}>{order.deliveryPhone}</div>}
        </div>
        <div>
          <div style={{ fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8 }}>Delivery Address</div>
          <div style={{ fontSize:13,color:"#374151",lineHeight:1.6 }}>{order.deliveryAddress}</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding:"18px 24px" }}>
        <div style={{ fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:12 }}>Items Detail</div>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {order.items?.map((item,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#f9fafb",borderRadius:10 }}>
              <span style={{ width:28,height:28,borderRadius:8,background:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#374151",flexShrink:0 }}>{item.quantity}×</span>
              <span style={{ flex:1,fontSize:14,color:"#1a1a1a",fontWeight:500 }}>{item.name}</span>
              <span style={{ fontWeight:700,fontSize:14,color:"#374151" }}>{fmt(item.price*item.quantity)}</span>
            </div>
          ))}
        </div>
        {order.note && (
          <div style={{ marginTop:12,padding:"10px 14px",background:"#fffbeb",borderRadius:10,border:"1px solid #fde68a",fontSize:13,color:"#92400e" }}>
            💬 {order.note}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Map placeholder ───────────────────────────────────────────
function MapSection({ order }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",overflow:"hidden" }}>
      <div style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontWeight:700,fontSize:14,color:"#1a1a1a" }}>🗺️ Delivery Route</span>
        <button onClick={()=>setExpanded(!expanded)} style={{ fontSize:12,fontWeight:700,color:"#ee4d2d",background:"#fff8f5",border:"1px solid #fecaca",padding:"4px 12px",borderRadius:8,cursor:"pointer" }}>
          {expanded?"Thu lại":"Xem bản đồ"}
        </button>
      </div>
      <div style={{ height: expanded?300:120, background:"linear-gradient(135deg,#e0f2fe,#bae6fd)", display:"flex",alignItems:"center",justifyContent:"center",transition:"height .3s" }}>
        <div style={{ textAlign:"center",color:"#0369a1" }}>
          <div style={{ fontSize:32,marginBottom:6 }}>📍</div>
          <div style={{ fontSize:12,fontWeight:600 }}>{order.deliveryAddress?.slice(0,50)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Right summary panel ───────────────────────────────────────
function OrderSummaryPanel({ order, mode, user, onAccept, onPickup, onComplete, onReportBomb, onRefresh, showToast }) {
  const [busy, setBusy] = useState(false);
  const income = order.deliveryFee || 0;

  const doAction = async (fn) => {
    setBusy(true);
    try { await fn(order._id); if(onRefresh) onRefresh(); }
    catch(e) { showToast(e.message,"error"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      {/* Order summary */}
      <div style={{ background:"#fff",borderRadius:16,padding:"18px",border:"1px solid #e5e7eb" }}>
        <div style={{ fontWeight:700,fontSize:14,color:"#374151",marginBottom:14,display:"flex",justifyContent:"space-between" }}>
          <span>Order Summary</span>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#6b7280" }}>
            <span>Item Price</span><span style={{ fontWeight:600,color:"#374151" }}>{fmt(order.subtotal)}</span>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#6b7280" }}>
            <span>Delivery Fee</span><span style={{ fontWeight:600,color:"#374151" }}>{fmt(order.deliveryFee)}</span>
          </div>
          {order.discount>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#10b981" }}>
            <span>Discount</span><span style={{ fontWeight:600 }}>-{fmt(order.discount)}</span>
          </div>}
        </div>
        <div style={{ borderTop:"1px solid #f3f4f6",marginTop:12,paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
          <span style={{ fontWeight:700,fontSize:14,color:"#1a1a1a" }}>TOTAL AMOUNT</span>
          <span style={{ fontWeight:800,fontSize:20,color:"#1a1a1a" }}>{fmt(order.total)}</span>
        </div>
      </div>

      {/* COD warning */}
      {order.paymentMethod==="cash"&&mode==="available"&&(
        <div style={{ background:"#fffbeb",borderRadius:12,padding:"12px 14px",border:"1px solid #fde68a",fontSize:12,color:"#92400e" }}>
          <div style={{ fontWeight:700,marginBottom:4 }}>⚠️ COD Order</div>
          <div style={{ lineHeight:1.6 }}>Nhận đơn này sẽ trừ <strong>{fmt(order.total-(order.deliveryFee||0))}</strong> từ ví ký quỹ.</div>
        </div>
      )}
      {mode==="available"&&user&&(user.walletBalance||0)<(order.total-(order.deliveryFee||0))&&(
        <div style={{ background:"#fef2f2",borderRadius:12,padding:"12px 14px",border:"1px solid #fecaca",fontSize:12,color:"#991b1b",fontWeight:600 }}>
          ❌ Số dư ví không đủ! Cần tối thiểu {fmt(order.total-(order.deliveryFee||0))} để nhận đơn này.
        </div>
      )}

      {/* Earnings */}
      <div style={{ background:"#fff",borderRadius:14,padding:"16px 18px",border:"1px solid #e5e7eb" }}>
        <div style={{ fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>Your Earnings</div>
        <div style={{ fontSize:28,fontWeight:800,color:"#10b981" }}>{fmt(income)}</div>
        <div style={{ fontSize:11,color:"#9ca3af",marginTop:4 }}>Ready for withdrawal tomorrow</div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {mode==="available"&&(
          <button disabled={busy} onClick={()=>doAction(onAccept)} style={{ padding:"13px",borderRadius:12,border:"none",background: busy?"#e5e7eb":"#ee4d2d",color:"#fff",fontWeight:700,fontSize:14,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            {busy?"⏳ Đang xử lý...":"✅ Xác nhận nhận đơn"}
          </button>
        )}
        {mode==="active"&&order.status==="shipper_accepted"&&(
          <button disabled={busy} onClick={()=>doAction(onPickup)} style={{ padding:"13px",borderRadius:12,border:"none",background:busy?"#e5e7eb":"#3b82f6",color:"#fff",fontWeight:700,fontSize:14,cursor:busy?"not-allowed":"pointer" }}>
            {busy?"⏳ Đang xử lý...":"📦 Đã lấy hàng – Bắt đầu giao"}
          </button>
        )}
        {mode==="active"&&order.status==="delivering"&&(
          <>
            <button disabled={busy} onClick={()=>onComplete(order)} style={{ padding:"13px",borderRadius:12,border:"none",background:"#10b981",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer" }}>
              🎉 Giao hàng thành công
            </button>
            <button disabled={busy} onClick={()=>onReportBomb(order)} style={{ padding:"13px",borderRadius:12,border:"1.5px solid #ef4444",background:"#fff",color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer" }}>
              📞 Không liên lạc được khách
            </button>
          </>
        )}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          <button onClick={onRefresh} style={{ padding:"10px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontWeight:600,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            🔄 Refresh Status
          </button>
          <button style={{ padding:"10px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontWeight:600,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            🆘 Help Center
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────
function StatsTab({ orders }) {
  const done   = orders.filter(o=>o.status==="delivered"||(o.status==="bombed"&&o.paymentMethod==="vnpay"));
  const today  = done.filter(o=>new Date(o.updatedAt).toDateString()===new Date().toDateString());
  const income = done.reduce((s,o)=>s+(o.deliveryFee||0),0);
  const todayI = today.reduce((s,o)=>s+(o.deliveryFee||0),0);
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16 }}>
      <StatCard label="Tổng hoàn thành" value={done.length.toString().padStart(2,"0")} icon="✅" color="#10b981"/>
      <StatCard label="Giao hôm nay" value={today.length.toString().padStart(2,"0")} icon="📦" color="#3b82f6"/>
      <StatCard label="Tổng thu nhập" value={fmt(income)} icon="💰" color="#ee4d2d"/>
      <StatCard label="Thu Nhập Hôm Nay" value={fmt(todayI)} icon="💵" color="#f59e0b"/>
    </div>
  );
}

// ── History list ──────────────────────────────────────────────
function HistoryList({ orders }) {
  if (!orders.length) return (
    <div style={{ textAlign:"center",padding:"60px",background:"#fff",borderRadius:16,border:"1px solid #e5e7eb" }}>
      <div style={{ fontSize:48,marginBottom:12 }}>📜</div>
      <div style={{ color:"#9ca3af",fontSize:15 }}>Chưa có lịch sử</div>
    </div>
  );
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      {orders.map(o=>{
        const cfg=STATUS_CFG[o.status]||STATUS_CFG.delivered;
        return (
          <div key={o._id} style={{ background:"#fff",borderRadius:14,padding:"16px 20px",border:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16 }}>
            <div style={{ display:"flex",gap:14,alignItems:"center",flex:1,minWidth:0 }}>
              <div style={{ width:40,height:40,borderRadius:10,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🏪</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700,fontSize:14,color:"#1a1a1a" }}>{o.restaurantName}</div>
                <div style={{ fontSize:12,color:"#9ca3af",marginTop:2 }}>{fmtD(o.createdAt)}</div>
                <div style={{ fontSize:12,color:"#6b7280",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{o.items?.map(i=>`${i.name} ×${i.quantity}`).join(", ")}</div>
              </div>
            </div>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <span style={{ fontSize:10,fontWeight:700,color:cfg.color,background:cfg.bg,padding:"3px 10px",borderRadius:10 }}>{cfg.label}</span>
              <div style={{ fontWeight:800,color:"#10b981",fontSize:15,marginTop:6 }}>+{fmt(o.deliveryFee||0)}</div>
              <div style={{ fontSize:11,color:"#9ca3af" }}>Tổng: {fmt(o.total)}</div>
            </div>
          </div>
        );
      })}
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

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showBombModal,     setShowBombModal]     = useState(false);
  const [orderToAction,     setOrderToAction]     = useState(null);
  const [formLoading,       setFormLoading]       = useState(false);
  const [formData, setFormData] = useState({ proofImage:"", reason:"" });

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev=>({...prev, proofImage:reader.result}));
    reader.readAsDataURL(file);
  };

  const load = useCallback(async(quiet=false)=>{
    if(!quiet) setLoading(true);
    try {
      const { token } = parseStoredAuth();
      const [av,my,prof] = await Promise.all([
        getAvailableOrders(), getShipperOrders(),
        getProfileApi(token).catch(()=>null)
      ]);
      setAvailable(av||[]); setMyOrders(my||[]);
      if(prof?.user) setLocalUser(prof.user);
    } catch(e){ console.error(e); }
    finally { if(!quiet) setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ const id=setInterval(()=>load(true),8000); return()=>clearInterval(id); },[load]);

  const active    = myOrders.filter(o=>["shipper_accepted","delivering"].includes(o.status));
  const history   = myOrders.filter(o=>["shipper_delivered","delivered","cancelled"].includes(o.status));
  const completed = myOrders.filter(o=>o.status==="delivered").length;
  const todayProfit = myOrders.filter(o=>o.status==="delivered"&&new Date(o.updatedAt).toDateString()===new Date().toDateString()).reduce((s,o)=>s+(o.deliveryFee||0),0);

  const handleAccept   = async id=>{ await shipperAcceptOrder(id); await load(true); showToast("✅ Đã nhận đơn!"); setSelIdx(0); };
  const handlePickup   = async id=>{ await shipperPickedUp(id);    await load(true); showToast("📦 Đã lấy hàng!"); };
  const handleComplete = (order)=>{ setOrderToAction(order); setFormData({proofImage:"",reason:""}); setShowCompleteModal(true); };
  const handleReportBomb = (order)=>{ setOrderToAction(order); setFormData({proofImage:"",reason:""}); setShowBombModal(true); };

  const submitComplete = async()=>{
    if(!formData.proofImage) return showToast("⚠️ Vui lòng cung cấp ảnh bằng chứng!","error");
    setFormLoading(true);
    try { await shipperCompleteDelivery(orderToAction._id,{proofImage:formData.proofImage}); await load(true); showToast("🎉 Giao hàng thành công!"); setShowCompleteModal(false); }
    catch(e){ showToast(e.message,"error"); } finally{ setFormLoading(false); }
  };
  const submitBomb = async()=>{
    if(!formData.proofImage) return showToast("⚠️ Vui lòng cung cấp ảnh hiện trường!","error");
    setFormLoading(true);
    try { await shipperReportBomb(orderToAction._id,{proofImage:formData.proofImage,reason:formData.reason||"User không nhận hàng"}); await load(true); showToast("📞 Đã gửi báo cáo!","warning"); setShowBombModal(false); }
    catch(e){ showToast(e.message,"error"); } finally{ setFormLoading(false); }
  };

  const NAV_TABS = [
    { key:"available", label:"Tổng Quan" },
    { key:"active",    label:"Đang Giao"  },
    { key:"history",   label:"Lịch Sử"   },
    { key:"wallet",    label:"Ví"    },
  ];

  const curList = tab==="available" ? available : tab==="active" ? active : tab==="history" ? history : [];
  const selOrder = curList[selIdx] || curList[0] || null;

  return (
    <div style={{ minHeight:"100vh", background:"#f4f5f7", fontFamily:"inherit" }}>

      {/* ── Top Navbar ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 28px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#ee4d2d,#ff7043)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>🛵</div>
            <span style={{ fontWeight:800, fontSize:16, color:"#1a1a1a" }}>Shipper<span style={{ color:"#ee4d2d" }}>Hub</span></span>
          </div>

          {/* Nav links */}
          <div style={{ display:"flex", gap:28, alignItems:"center" }}>
            {NAV_TABS.map(t=>(
              <NavLink key={t.key} label={t.label} active={tab===t.key} onClick={()=>{ setTab(t.key); setSelIdx(0); }}/>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {/* Balance chip */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end" }}>
              <span style={{ fontSize:9,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.6px" }}>Balance</span>
              <span style={{ fontSize:15,fontWeight:800,color:"#ee4d2d" }}>{fmt(localUser?.walletBalance)}</span>
            </div>
            {/* Avatar */}
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:"#f3f4f6",overflow:"hidden",border:"2px solid #e5e7eb",flexShrink:0 }}>
                {localUser?.avatar
                  ? <img src={localUser.avatar} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>👤</div>}
              </div>
              <div>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>Shipper</div>
                <div style={{ fontSize:10,color:"#9ca3af" }}>ID: {localUser?._id?.slice(-6).toUpperCase()}</div>
              </div>
            </div>
            {/* Logout */}
            <button onClick={onLogout} style={{ width:32,height:32,borderRadius:"50%",border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7280" }} title="Đăng xuất">↩</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 28px" }}>

        {/* ── Hero banner (Dashboard tab only) ── */}
        {(tab==="available"||tab==="active") && (
          <div style={{ background:"linear-gradient(135deg,#ee4d2d 0%,#ff6b35 60%,#ff8c42 100%)", borderRadius:20, padding:"24px 32px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 8px 32px rgba(238,77,45,0.25)" }}>
            <div>
              <div style={{ fontSize:24,fontWeight:800,color:"#fff",marginBottom:4 }}>
                Xin chào, Shipper! 🛵
              </div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.8)" }}>
                Hôm nay bạn có {available.length} lộ trình mới đang chờ bạn.
              </div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",borderRadius:12,padding:"10px 18px",border:"1px solid rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:2 }}>Status</div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 8px #4ade80" }}/>
                <span style={{ fontSize:13,fontWeight:700,color:"#fff" }}>Active & Online</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Stat cards ── */}
        {(tab==="available"||tab==="active") && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
            <StatCard label="Chờ Nhận"      value={available.length.toString().padStart(2,"0")} icon="📋" color="#f59e0b"/>
            <StatCard label="Đang Giao"  value={active.length.toString().padStart(2,"0")}    icon="🚚" color="#3b82f6"/>
            <StatCard label="Hoàn Thành"    value={completed.toString().padStart(2,"0")}         icon="✅" color="#10b981"/>
            <StatCard label="Thu Nhập Hôm Nay" value={fmt(todayProfit)}                           icon="💵" color="#ee4d2d"/>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div style={{ textAlign:"center",padding:"80px 0",color:"#9ca3af" }}>
            <div style={{ width:40,height:40,border:"3px solid #f0f0f0",borderTop:"3px solid #ee4d2d",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block" }}/>
            <div style={{ marginTop:12,fontSize:14 }}>Loading orders...</div>
          </div>

        ) : tab==="stats" ? (
          <StatsTab orders={myOrders}/>

        ) : tab==="wallet" ? (
          <ShipperWalletTab user={localUser} showToast={showToast}/>

        ) : tab==="history" ? (
          <HistoryList orders={history}/>

        ) : (
          /* ── Dashboard / Active: 3-col layout ── */
          <div style={{ display:"grid", gridTemplateColumns:"280px 1fr 300px", gap:20, alignItems:"start" }}>

            {/* Col 1: Orders list */}
            <div>
              <div style={{ fontWeight:700,fontSize:14,color:"#374151",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span>📋 Orders List</span>
                <span style={{ fontSize:12,color:"#9ca3af" }}>{curList.length} orders</span>
              </div>
              {curList.length===0 ? (
                <div style={{ textAlign:"center",padding:"40px 20px",background:"#fff",borderRadius:16,border:"1px solid #e5e7eb" }}>
                  <div style={{ fontSize:40,marginBottom:10 }}>{tab==="available"?"📋":"🚚"}</div>
                  <div style={{ color:"#9ca3af",fontSize:14 }}>{tab==="available"?"Chưa có đơn chờ nhận":"Không có đơn đang giao"}</div>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:10,maxHeight:"calc(100vh - 360px)",overflowY:"auto",paddingRight:4 }} className="custom-scrollbar">
                  {curList.map((order,i)=>(
                    <OrderListItem key={order._id} order={order} selected={selIdx===i} onClick={()=>setSelIdx(i)}/>
                  ))}
                </div>
              )}
            </div>

            {/* Col 2: Order detail */}
            <div>
              {selOrder ? (
                <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                  <OrderDetailPanel order={selOrder}/>
                  <MapSection order={selOrder}/>
                </div>
              ) : (
                <div style={{ textAlign:"center",padding:"80px 40px",background:"#fff",borderRadius:16,border:"1px solid #e5e7eb" }}>
                  <div style={{ fontSize:48,marginBottom:12 }}>📦</div>
                  <div style={{ color:"#9ca3af",fontSize:14 }}>Select an order to view details</div>
                </div>
              )}
            </div>

            {/* Col 3: Summary + actions */}
            <div>
              {selOrder ? (
                <OrderSummaryPanel
                  order={selOrder} mode={tab} user={localUser}
                  onAccept={handleAccept} onPickup={handlePickup}
                  onComplete={handleComplete} onReportBomb={handleReportBomb}
                  onRefresh={()=>load(true)} showToast={showToast}
                />
              ) : (
                <div style={{ background:"#fff",borderRadius:16,padding:"24px",border:"1px solid #e5e7eb",textAlign:"center",color:"#9ca3af",fontSize:13 }}>
                  No order selected
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop:"1px solid #e5e7eb",background:"#fff",padding:"16px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:40 }}>
        <div style={{ fontSize:12,color:"#9ca3af" }}>© 2026 FoodieHub · Phiên bản 2.4.0</div>
        <div style={{ display:"flex",gap:20 }}>
          {["Chính sách","Điều khoản","Hỗ trợ"].map(l=>(
            <button key={l} style={{ fontSize:12,color:"#6b7280",background:"none",border:"none",cursor:"pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Modal: Giao hàng thành công ── */}
      {showCompleteModal&&(
        <div style={mOverlay}>
          <div style={mContent}>
            <div style={mHeader}>✅ Hoàn thành giao hàng</div>
            <div style={mBody}>
              <div style={mLabel}>Chụp ảnh xác nhận giao hàng:</div>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={mInputFile}/>
              {formData.proofImage&&<img src={formData.proofImage} alt="proof" style={mPreview}/>}
            </div>
            <div style={mFooter}>
              <button disabled={formLoading} onClick={()=>setShowCompleteModal(false)} style={mBtnCancel}>Đóng</button>
              <button disabled={formLoading} onClick={submitComplete} style={mBtnSubmit}>
                {formLoading?"⏳ Đang gửi...":"Xác nhận giao xong"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Báo bom hàng ── */}
      {showBombModal&&(
        <div style={mOverlay}>
          <div style={mContent}>
            <div style={{...mHeader,color:"#ef4444"}}>📞 Báo cáo không liên lạc được khách</div>
            <div style={mBody}>
              <div style={mLabel}>Lý do không giao được:</div>
              <textarea placeholder="Ví dụ: Gọi 3 lần không nghe máy..." value={formData.reason} onChange={e=>setFormData({...formData,reason:e.target.value})} style={mTextArea}/>
              <div style={{...mLabel,marginTop:16}}>Ảnh hiện trường:</div>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={mInputFile}/>
              {formData.proofImage&&<img src={formData.proofImage} alt="proof" style={mPreview}/>}
            </div>
            <div style={mFooter}>
              <button disabled={formLoading} onClick={()=>setShowBombModal(false)} style={mBtnCancel}>Đóng</button>
              <button disabled={formLoading} onClick={submitBomb} style={{...mBtnSubmit,background:"#ef4444"}}>
                {formLoading?"⏳ Đang gửi...":"Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ── Modal styles ──────────────────────────────────────────────
const mOverlay   = { position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000 };
const mContent   = { background:"#fff",borderRadius:20,width:"90%",maxWidth:420,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.15)" };
const mHeader    = { padding:"20px",borderBottom:"1px solid #f3f4f6",fontWeight:800,fontSize:17,textAlign:"center" };
const mBody      = { padding:"20px" };
const mFooter    = { padding:"16px 20px",borderTop:"1px solid #f3f4f6",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 };
const mLabel     = { fontSize:14,fontWeight:700,color:"#4b5563",marginBottom:8 };
const mInputFile = { width:"100%",fontSize:13,color:"#6b7280",padding:"8px 0" };
const mPreview   = { width:"100%",height:160,objectFit:"cover",borderRadius:12,marginTop:12,border:"1px solid #e5e7eb" };
const mTextArea  = { width:"100%",height:80,borderRadius:12,border:"1.5px solid #e5e7eb",padding:"12px",fontSize:14,fontFamily:"inherit",resize:"none",outline:"none",boxSizing:"border-box" };
const mBtnCancel = { padding:"12px",borderRadius:12,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontWeight:700,fontSize:14,cursor:"pointer" };
const mBtnSubmit = { padding:"12px",borderRadius:12,border:"none",background:"#ee4d2d",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer" };
