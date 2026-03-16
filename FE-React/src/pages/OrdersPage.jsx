import { useState, useEffect, useCallback } from "react";
import { getMyOrders, getOrderById, cancelOrder, confirmOrderReceived } from "../services/order-api";
import { submitBulkReviews, checkOrderReviewed, updateReview, deleteReview } from "../services/review-api";

// ─── Config ─────────────────────────────────────────────────────
const SC = {
  pending:           { label:"Chờ xác nhận",        color:"#f59e0b", bg:"#fef3c7" },
  confirmed:         { label:"Đã xác nhận",          color:"#3b82f6", bg:"#dbeafe" },
  preparing:         { label:"Đang chuẩn bị",        color:"#8b5cf6", bg:"#ede9fe" },
  ready_for_pickup:  { label:"Chờ shipper",           color:"#f97316", bg:"#ffedd5" },
  shipper_accepted:  { label:"Shipper đã nhận",       color:"#06b6d4", bg:"#cffafe" },
  delivering:        { label:"Đang giao hàng",        color:"#ee4d2d", bg:"#fff0ed" },
  shipper_delivered: { label:"Shipper đã giao",       color:"#84cc16", bg:"#ecfccb" },
  delivered:         { label:"Đã giao thành công",   color:"#10b981", bg:"#d1fae5" },
  cancelled:         { label:"Đã hủy",                color:"#ef4444", bg:"#fee2e2" },
  bombed:            { label:"Giao không thành công", color:"#ef4444", bg:"#fee2e2" },
};

// 4 bước hiển thị trên timeline ngang (theo ảnh)
const TIMELINE_STEPS = [
  { key:"confirmed",  label:"Đã xác nhận",   icon:"✅" },
  { key:"preparing",  label:"Đang chuẩn bị", icon:"🍳" },
  { key:"delivering", label:"Đang giao hàng",icon:"🛵" },
  { key:"delivered",  label:"Đã nhận hàng",  icon:"🏠" },
];
const STEP_ORDER = ["pending","confirmed","preparing","ready_for_pickup","shipper_accepted","delivering","shipper_delivered","delivered"];

const TAB_FILTERS = [
  { label:"Tất cả",     status:null },
  { label:"Đang xử lý", status:["pending","confirmed","preparing","ready_for_pickup","shipper_accepted","delivering","shipper_delivered"] },
  { label:"Hoàn thành", status:["delivered"] },
  { label:"Đã hủy",     status:["cancelled","bombed"] },
];

function fmtMoney(n){ return (n||0).toLocaleString("vi-VN")+"đ"; }
function fmtDate(d){
  const dt = new Date(d);
  return dt.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}) + ", " + dt.toLocaleDateString("vi-VN");
}

// ─── Stars ───────────────────────────────────────────────────────
function Stars({ value, onChange }){
  const [hov,setHov]=useState(0);
  const labels=["","Tệ 😞","Không hài lòng 😕","Bình thường 😐","Hài lòng 😊","Tuyệt vời! 🤩"];
  return(
    <div>
      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
        {[1,2,3,4,5].map(s=>(
          <span key={s} onClick={()=>onChange?.(s)} onMouseEnter={()=>onChange&&setHov(s)} onMouseLeave={()=>onChange&&setHov(0)}
            style={{fontSize:38,cursor:onChange?"pointer":"default",color:s<=(hov||value)?"#f59e0b":"#e5e7eb",transition:"color .1s,transform .15s",transform:s===(hov||value)?"scale(1.25)":"scale(1)",display:"inline-block"}}>★</span>
        ))}
      </div>
      {onChange&&<div style={{textAlign:"center",fontSize:13,fontWeight:700,color:"#ee4d2d",marginTop:4,minHeight:20}}>{labels[hov||value]}</div>}
    </div>
  );
}

// ─── Shared modal wrapper ────────────────────────────────────────
function Overlay({onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:99998,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 16px"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)"}}/>
      <div style={{position:"relative",background:"#fff",borderRadius:24,width:"100%",maxWidth:460,boxShadow:"0 32px 80px rgba(0,0,0,.22)",animation:"modalPop .3s cubic-bezier(.175,.885,.32,1.275)",overflow:"hidden"}}>
        {children}
      </div>
    </div>
  );
}
function CloseBtn({onClose}){return <button onClick={onClose} style={{position:"absolute",top:14,right:14,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.2)",border:"none",color:"#fff",fontSize:16,cursor:"pointer"}}>✕</button>;}
function ErrBox({msg}){return <div style={{marginBottom:12,padding:"10px 14px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontSize:13}}>⚠️ {msg}</div>;}

// ─── Review Modal ────────────────────────────────────────────────
function ReviewModal({order,onClose,onSuccess}){
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const submit=async()=>{
    setBusy(true);setErr("");
    try{ await submitBulkReviews(order._id,order.restaurant?._id||order.restaurant,[{rating,comment,productId:null,productName:""}]); onSuccess(); }
    catch(e){setErr(e.message);}finally{setBusy(false);}
  };
  return(
    <Overlay onClose={onClose}>
      <div style={{background:"linear-gradient(135deg,#ee4d2d,#ff7337)",padding:"28px 24px 24px",textAlign:"center",position:"relative"}}>
        <CloseBtn onClose={onClose}/>
        <div style={{fontSize:48,marginBottom:8}}>⭐</div>
        <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:800,color:"#fff"}}>Đánh giá nhà hàng</h3>
        <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,.85)"}}>{order.restaurantName}</p>
      </div>
      <div style={{padding:"24px 28px"}}>
        <div style={{marginBottom:16}}><Stars value={rating} onChange={setRating}/></div>
        <textarea value={comment} onChange={e=>setComment(e.target.value.slice(0,500))} placeholder="Chia sẻ cảm nhận của bạn..." rows={4}
          style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",background:"#fafafa"}}
          onFocus={e=>e.target.style.borderColor="#ee4d2d"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        <div style={{fontSize:11,color:"#9ca3af",textAlign:"right",marginBottom:16}}>{comment.length}/500</div>
        {err&&<ErrBox msg={err}/>}
        <button disabled={busy} onClick={submit} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:busy?"#e5e7eb":"#ee4d2d",color:busy?"#9ca3af":"#fff",fontWeight:800,fontSize:15,cursor:busy?"not-allowed":"pointer"}}>
          {busy?"⏳ Đang gửi...":"🌟 Gửi đánh giá"}
        </button>
      </div>
    </Overlay>
  );
}

// ─── Edit Review Modal ───────────────────────────────────────────
function EditReviewModal({reviews,order,onClose,onSuccess}){
  const r0=reviews.find(r=>!r.product);
  const [rating,setRating]=useState(r0?.rating||5);
  const [comment,setComment]=useState(r0?.comment||"");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const submit=async()=>{
    if(!r0?._id)return; setBusy(true);setErr("");
    try{ await updateReview(r0._id,{rating,comment}); onSuccess(); }
    catch(e){setErr(e.message);}finally{setBusy(false);}
  };
  return(
    <Overlay onClose={onClose}>
      <div style={{background:"linear-gradient(135deg,#3b82f6,#6366f1)",padding:"28px 24px 24px",textAlign:"center",position:"relative"}}>
        <CloseBtn onClose={onClose}/>
        <div style={{fontSize:48,marginBottom:8}}>✏️</div>
        <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:800,color:"#fff"}}>Sửa đánh giá</h3>
        <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,.85)"}}>{order.restaurantName}</p>
      </div>
      <div style={{padding:"24px 28px"}}>
        <div style={{marginBottom:16}}><Stars value={rating} onChange={setRating}/></div>
        <textarea value={comment} onChange={e=>setComment(e.target.value.slice(0,500))} placeholder="Cập nhật cảm nhận..." rows={4}
          style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",background:"#fafafa"}}
          onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        <div style={{fontSize:11,color:"#9ca3af",textAlign:"right",marginBottom:16}}>{comment.length}/500</div>
        {err&&<ErrBox msg={err}/>}
        <button disabled={busy} onClick={submit} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:busy?"#e5e7eb":"#3b82f6",color:busy?"#9ca3af":"#fff",fontWeight:800,fontSize:15,cursor:busy?"not-allowed":"pointer"}}>
          {busy?"⏳ Đang lưu...":"💾 Lưu thay đổi"}
        </button>
      </div>
    </Overlay>
  );
}

// ─── Horizontal Timeline ─────────────────────────────────────────
function HorizontalTimeline({ order }) {
  const currentIdx = STEP_ORDER.indexOf(order.status);
  const isCancelled = ["cancelled","bombed"].includes(order.status);

  // Map each timeline step to done/current state
  const getStepState = (stepKey) => {
    const stepIdx = STEP_ORDER.indexOf(stepKey);
    if (stepKey === "delivering") {
      // "delivering" step covers shipper_accepted, delivering, shipper_delivered
      const done = ["shipper_accepted","delivering","shipper_delivered","delivered"].some(s => STEP_ORDER.indexOf(s) <= currentIdx);
      const current = ["shipper_accepted","delivering","shipper_delivered"].includes(order.status);
      return { done, current };
    }
    const done = currentIdx >= stepIdx;
    const current = STEP_ORDER[currentIdx] === stepKey ||
      (stepKey === "confirmed" && order.status === "pending");
    return { done, current };
  };

  // Get timestamp for step from statusHistory
  const getStepTime = (stepKey) => {
    const history = order.statusHistory || [];
    if (stepKey === "delivering") {
      const entry = history.find(h => ["shipper_accepted","delivering"].includes(h.status));
      return entry ? fmtDate(entry.changedAt) : null;
    }
    const entry = history.find(h => h.status === stepKey);
    return entry ? fmtDate(entry.changedAt) : null;
  };

  if (isCancelled) return (
    <div style={{background:"#fff",borderRadius:16,padding:"24px",border:"1px solid #f3f4f6",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      <div style={{textAlign:"center",padding:"8px 0"}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"#fee2e2",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
          {order.status==="bombed"?"⚠️":"✕"}
        </div>
        <div style={{fontWeight:700,color:"#ef4444",fontSize:16,marginBottom:4}}>
          {order.status==="bombed"?"Giao hàng không thành công":"Đơn hàng đã bị hủy"}
        </div>
        {order.status==="bombed"&&(order.statusHistory||[]).find(h=>h.status==="bombed")&&(
          <div style={{margin:"8px auto",padding:"10px 14px",background:"#fff5f5",borderRadius:10,border:"1px dashed #feb2b2",maxWidth:320,fontSize:13,color:"#c53030"}}>
            <b>Lý do:</b> {(order.statusHistory||[]).find(h=>h.status==="bombed").note}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",border:"1px solid #f3f4f6",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      <div style={{display:"flex",alignItems:"flex-start",position:"relative"}}>
        {/* Connecting lines */}
        {TIMELINE_STEPS.map((step, idx) => {
          if (idx === TIMELINE_STEPS.length - 1) return null;
          const { done } = getStepState(step.key);
          return (
            <div key={`line-${idx}`} style={{
              position:"absolute",
              top: 20,
              left: `calc(${(idx * (100/(TIMELINE_STEPS.length-1)))}% + 20px)`,
              width: `calc(${100/(TIMELINE_STEPS.length-1)}% - 40px)`,
              height: 3,
              background: done ? "#ee4d2d" : "#e5e7eb",
              transition: "background .4s",
              zIndex: 0,
            }}/>
          );
        })}

        {/* Steps */}
        {TIMELINE_STEPS.map((step, idx) => {
          const { done, current } = getStepState(step.key);
          const time = getStepTime(step.key);
          return (
            <div key={step.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}>
              {/* Circle */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: done ? (current ? "#ee4d2d" : "#ee4d2d") : "#f3f4f6",
                border: current ? "3px solid #fca5a5" : done ? "none" : "2px solid #e5e7eb",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize: 18,
                boxShadow: current ? "0 0 0 6px rgba(238,77,45,.12)" : "none",
                transition: "all .4s",
                marginBottom: 10,
              }}>
                {done
                  ? <span style={{fontSize:16}}>{step.icon}</span>
                  : <span style={{fontSize:16,opacity:.3}}>{step.icon}</span>}
              </div>
              {/* Label */}
              <div style={{fontSize:12,fontWeight:current?700:500,color:current?"#ee4d2d":done?"#374151":"#9ca3af",textAlign:"center",lineHeight:1.4}}>
                {step.label}
              </div>
              {/* Time */}
              <div style={{fontSize:11,color:current?"#ee4d2d":"#9ca3af",marginTop:2,textAlign:"center"}}>
                {time || (current?"Sắp hoàn thành":"---")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Map placeholder ──────────────────────────────────────────────
function MapBox({ address }) {
  return (
    <div style={{borderRadius:12,overflow:"hidden",marginTop:12,height:110,background:"linear-gradient(135deg,#e0f2fe,#bfdbfe)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 30% 50%, rgba(59,130,246,.15) 0%, transparent 70%), radial-gradient(circle at 70% 50%, rgba(99,102,241,.1) 0%, transparent 70%)"}}/>
      <div style={{textAlign:"center",position:"relative"}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"#ee4d2d",margin:"0 auto 6px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(238,77,45,.4)"}}>
          <span style={{color:"#fff",fontSize:16}}>📍</span>
        </div>
        <div style={{fontSize:11,color:"#1e40af",fontWeight:600,maxWidth:160,lineHeight:1.4}}>{address?.slice(0,60)}</div>
      </div>
    </div>
  );
}

// ─── ORDER DETAIL PAGE ────────────────────────────────────────────
function OrderDetailPage({ orderId, onBack, showToast, onRefreshList }){
  const [order,setOrder]=useState(null);
  const [loading,setLoading]=useState(true);
  const [reviewOrder,setReviewOrder]=useState(null);
  const [editReview,setEditReview]=useState(null);
  const [isReviewed,setIsReviewed]=useState(false);
  const [reviews,setReviews]=useState([]);

  const load=useCallback(async()=>{
    try{
      const data=await getOrderById(orderId);
      setOrder(data);
      if(data.status==="delivered"){
        const r=await checkOrderReviewed(orderId);
        if(r?.reviewed){setIsReviewed(true);setReviews(r.reviews||[]);}
      }
    }catch(e){showToast("Không tải được đơn hàng","error");}
    finally{setLoading(false);}
  },[orderId]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{
    const id=setInterval(()=>{ if(order&&!["delivered","cancelled","bombed"].includes(order.status)) load(); },8000);
    return()=>clearInterval(id);
  },[load,order]);

  if(loading) return(
    <div style={{textAlign:"center",padding:"80px 0",color:"#9ca3af"}}>
      <div style={{width:40,height:40,border:"3px solid #f0f0f0",borderTop:"3px solid #ee4d2d",borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block"}}/>
      <div style={{marginTop:12}}>Đang tải...</div>
    </div>
  );
  if(!order) return null;

  const cfg = SC[order.status] || SC.pending;

  return(
    <div style={{padding:"8px 0"}}>

      {/* ── Back + title ── */}
      <div style={{marginBottom:20}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontWeight:600,fontSize:13,padding:0,display:"flex",alignItems:"center",gap:4,marginBottom:12}}>
          ← Quay lại đơn hàng
        </button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Chi tiết đơn hàng <span style={{color:"#ee4d2d",fontFamily:"monospace"}}>#{order._id.slice(-8).toUpperCase()}</span></h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{background:cfg.bg,color:cfg.color,padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:700,border:`1px solid ${cfg.color}40`}}>
              {cfg.label}
            </span>
            <button onClick={()=>navigator.clipboard?.writeText(order._id)} title="Copy ID" style={{width:34,height:34,borderRadius:8,border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>📋</button>
          </div>
        </div>
      </div>

      {/* ── Timeline ngang ── */}
      <div style={{marginBottom:20}}>
        <HorizontalTimeline order={order}/>
      </div>

      {/* ── 2 column layout ── */}
      <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>

        {/* LEFT: Chi tiết món + nhà hàng + shipper */}
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:16}}>

          {/* Chi tiết món ăn */}
          <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",border:"1px solid #f3f4f6",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
            <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#1a1a1a",display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:28,height:28,background:"#fff0ed",borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🍱</span>
              Chi tiết món ăn
            </h3>
            <div style={{display:"flex",flexDirection:"column"}}>
              {order.items?.map((item,idx)=>(
                <div key={idx} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",borderBottom:idx<order.items.length-1?"1px solid #f9fafb":"none"}}>
                  <div style={{width:72,height:72,borderRadius:12,background:"#fff8f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,flexShrink:0,border:"1px solid #fee2e2",overflow:"hidden"}}>
                    {item.image
                      ? <img src={item.image} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                      : <span>{item.emoji||"🍽️"}</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a",marginBottom:3}}>{item.name}</div>
                    <div style={{fontSize:12,color:"#9ca3af",marginBottom:4}}>Số lượng: {item.quantity}</div>
                    {item.category&&<span style={{fontSize:11,fontWeight:600,color:"#6b7280",background:"#f3f4f6",padding:"2px 8px",borderRadius:6}}>{item.category}</span>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:800,fontSize:15,color:"#ee4d2d"}}>{fmtMoney(item.price*item.quantity)}</div>
                    {item.quantity>1&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{fmtMoney(item.price)}/món</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nhà hàng */}
          {order.restaurantName&&(
            <div style={{background:"#fff",borderRadius:16,padding:"18px 24px",border:"1px solid #f3f4f6",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:12,background:"#fff0ed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏪</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>Nhà hàng {order.restaurantName}</div>
                    {order.restaurantAddress&&<div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{order.restaurantAddress}</div>}
                  </div>
                </div>
                <button style={{padding:"8px 16px",borderRadius:20,border:"1.5px solid #ee4d2d",background:"#fff",color:"#ee4d2d",fontWeight:700,fontSize:13,cursor:"pointer"}}>Xem quán</button>
              </div>
            </div>
          )}

          {/* Shipper info */}
          {order.shipper&&["shipper_accepted","delivering","shipper_delivered","delivered"].includes(order.status)&&(
            <div style={{background:"#fff",borderRadius:16,padding:"18px 24px",border:"1px solid #f3f4f6",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
              <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#1a1a1a"}}>🛵 Thông tin tài xế</h3>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,overflow:"hidden"}}>
                  {order.shipper.avatar?<img src={order.shipper.avatar} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🛵"}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>{order.shipper.fullName}</div>
                  <div style={{fontSize:13,color:"#6b7280",marginTop:2}}>📞 {order.shipper.phone||"Không có SĐT"}</div>
                </div>
              </div>
              {order.shipper.phone&&(
                <a href={`tel:${order.shipper.phone}`} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#f9fafb",color:"#1a1a1a",fontWeight:600,fontSize:13,textDecoration:"none"}}>
                  📞 Gọi cho tài xế
                </a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Thanh toán (tối) + action */}
        <div style={{width:340,flexShrink:0,position:"sticky",top:20,display:"flex",flexDirection:"column",gap:12}}>

          {/* Payment card — dark bg như ảnh */}
          <div style={{background:"#1c1410",borderRadius:18,padding:"22px",color:"#fff",overflow:"hidden",position:"relative"}}>
            {/* Subtle glow */}
            <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,borderRadius:"50%",background:"rgba(238,77,45,.15)",pointerEvents:"none"}}/>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,position:"relative"}}>
              <span style={{fontWeight:700,fontSize:17}}>Thanh toán</span>
              <span style={{background:"#ee4d2d",color:"#fff",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                {order.paymentMethod==="vnpay"?"VNPAY":"TIỀN MẶT"}
              </span>
            </div>

            {/* Rows */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16,position:"relative"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                <span style={{color:"rgba(255,255,255,.6)"}}>Tạm tính</span>
                <span style={{color:"rgba(255,255,255,.9)",fontWeight:500}}>{fmtMoney(order.subtotal)}</span>
              </div>
              {order.deliveryFee>0&&(
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                  <span style={{color:"rgba(255,255,255,.6)"}}>Phí giao hàng</span>
                  <span style={{color:"rgba(255,255,255,.9)",fontWeight:500}}>{fmtMoney(order.deliveryFee)}</span>
                </div>
              )}
              {order.discount>0&&(
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                  <span style={{color:"rgba(255,255,255,.6)"}}>Khuyến mãi</span>
                  <span style={{color:"#4ade80",fontWeight:600}}>-{fmtMoney(order.discount)}</span>
                </div>
              )}
            </div>

            <div style={{borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:16,position:"relative"}}>
              <span style={{fontWeight:700,fontSize:14,color:"rgba(255,255,255,.85)"}}>Tổng cộng</span>
              <span style={{fontWeight:800,fontSize:28,color:"#ee4d2d"}}>{fmtMoney(order.total)}</span>
            </div>

            {/* Delivery address */}
            {order.deliveryAddress&&(
              <div style={{background:"rgba(255,255,255,.07)",borderRadius:10,padding:"12px 14px",position:"relative"}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Địa chỉ giao hàng</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.8)",lineHeight:1.5,display:"flex",gap:6}}>
                  <span style={{color:"#ee4d2d",flexShrink:0}}>📍</span>
                  {order.deliveryAddress}
                </div>
                {/* Map */}
                <MapBox address={order.deliveryAddress}/>
              </div>
            )}

            {/* Note */}
            {order.note&&(
              <div style={{background:"rgba(255,255,255,.07)",borderRadius:10,padding:"10px 14px",marginTop:10,position:"relative"}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>Ghi chú</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.7)",lineHeight:1.5}}>📝 {order.note}</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {["pending","confirmed"].includes(order.status)&&(
              <button onClick={async()=>{
                if(!window.confirm("Bạn có chắc muốn hủy đơn này không?"))return;
                try{ await cancelOrder(order._id,"Khách hàng hủy"); showToast("Đã hủy đơn hàng","success"); load(); onRefreshList(); }
                catch(e){showToast("Lỗi: "+e.message,"error");}
              }} style={{padding:"13px",borderRadius:12,border:"1.5px solid #ef4444",background:"#fff",color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                ✕ Hủy đơn hàng
              </button>
            )}

            {order.status==="shipper_delivered"&&(
              <button onClick={async()=>{
                try{ await confirmOrderReceived(order._id); showToast("Xác nhận nhận hàng thành công!","success"); load(); onRefreshList(); setReviewOrder(order); }
                catch(e){showToast("Lỗi: "+e.message,"error");}
              }} style={{padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(16,185,129,.3)"}}>
                ✅ Đã nhận được hàng
              </button>
            )}

            {order.status==="delivered"&&(
              isReviewed?(
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,padding:"10px",borderRadius:12,background:"#d1fae5",color:"#065f46",fontWeight:600,fontSize:13,textAlign:"center"}}>✅ Đã đánh giá</div>
                  <button onClick={()=>setEditReview({reviews,order})} style={{padding:"10px 14px",borderRadius:12,border:"1.5px solid #3b82f6",background:"#fff",color:"#3b82f6",fontWeight:700,fontSize:13,cursor:"pointer"}}>✏️</button>
                  <button onClick={async()=>{
                    if(!window.confirm("Xóa đánh giá?"))return;
                    try{ await Promise.all(reviews.map(r=>deleteReview(r._id))); setIsReviewed(false);setReviews([]); showToast("Đã xóa đánh giá","success"); }
                    catch(e){showToast("Lỗi: "+e.message,"error");}
                  }} style={{padding:"10px 14px",borderRadius:12,border:"1.5px solid #ef4444",background:"#fff",color:"#ef4444",fontWeight:700,fontSize:13,cursor:"pointer"}}>🗑️</button>
                </div>
              ):(
                <button onClick={()=>setReviewOrder(order)} style={{padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#ee4d2d)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(238,77,45,.3)"}}>
                  ⭐ Đánh giá nhà hàng
                </button>
              )
            )}

            <div style={{padding:"12px 14px",background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",textAlign:"center",fontSize:11,color:"#9ca3af",lineHeight:1.6}}>
              Cần thay đổi thông tin đơn hàng? Vui lòng liên hệ trung tâm CSKH của <span style={{color:"#ee4d2d",fontWeight:700}}>FoodieHub</span> để được hỗ trợ 24/7.
            </div>
          </div>
        </div>
      </div>

      {reviewOrder&&<ReviewModal order={reviewOrder} onClose={()=>setReviewOrder(null)} onSuccess={async()=>{ setReviewOrder(null); const r=await checkOrderReviewed(order._id); if(r?.reviewed){setIsReviewed(true);setReviews(r.reviews||[]);} showToast("🌟 Cảm ơn bạn đã đánh giá!","success"); }}/>}
      {editReview&&<EditReviewModal reviews={editReview.reviews} order={editReview.order} onClose={()=>setEditReview(null)} onSuccess={async()=>{ setEditReview(null); const r=await checkOrderReviewed(order._id); if(r?.reviewed){setIsReviewed(true);setReviews(r.reviews||[]);} showToast("✅ Đã cập nhật đánh giá!","success"); }}/>}
    </div>
  );
}

// ─── ORDERS LIST PAGE ─────────────────────────────────────────────
function OrdersPage({user,navigate,showToast}){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activeTab,setActiveTab]=useState(0);
  const [detailId,setDetailId]=useState(null);

  const fetchOrders=useCallback(async(showLoader=true)=>{
    if(!user)return;
    if(showLoader)setLoading(true);
    try{ const data=await getMyOrders(); setOrders(data||[]); }
    catch(e){ console.error(e); }
    finally{ if(showLoader)setLoading(false); }
  },[user]);

  useEffect(()=>{fetchOrders();},[fetchOrders]);
  useEffect(()=>{
    if(!user)return;
    const id=setInterval(()=>fetchOrders(false),10000);
    return()=>clearInterval(id);
  },[fetchOrders]);

  if(!user)return(
    <div className="view-port">
      <div style={{textAlign:"center",padding:"80px 0"}}>
        <h2 style={{color:"#1a1a1a"}}>Vui lòng đăng nhập</h2>
        <button style={{padding:"10px 28px",background:"#ee4d2d",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}} onClick={()=>navigate("/sign-in")}>Đăng nhập</button>
      </div>
    </div>
  );

  if(detailId)return(
    <>
      <div className="view-port">
        <OrderDetailPage orderId={detailId} onBack={()=>setDetailId(null)} showToast={showToast} onRefreshList={()=>fetchOrders(false)}/>
      </div>
      <AnimStyles/>
    </>
  );

  const filtered=orders.filter(o=>{ const f=TAB_FILTERS[activeTab].status; return !f||f.includes(o.status); });
  const activeCount=orders.filter(o=>["pending","confirmed","preparing","ready_for_pickup","shipper_accepted","delivering","shipper_delivered"].includes(o.status)).length;

  return(
    <div className="view-port">
      {/* Header */}
      <div style={{background:"#fff",borderRadius:14,padding:"16px 24px",marginBottom:14,boxShadow:"0 1px 8px rgba(0,0,0,.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#1a1a1a"}}>📦 Đơn hàng của tôi</h2>
        <button onClick={()=>fetchOrders()} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer",color:"#6b7280",display:"flex",alignItems:"center",gap:5}}>
          🔄 Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",borderRadius:14,marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.06)",display:"flex",overflowX:"auto"}}>
        {TAB_FILTERS.map((tab,idx)=>(
          <div key={idx} onClick={()=>setActiveTab(idx)} style={{flex:1,minWidth:90,textAlign:"center",padding:"15px 0",cursor:"pointer",fontSize:14,fontWeight:activeTab===idx?700:400,color:activeTab===idx?"#ee4d2d":"#6b7280",borderBottom:activeTab===idx?"2.5px solid #ee4d2d":"2.5px solid transparent",transition:"all .2s",whiteSpace:"nowrap"}}>
            {tab.label}
            {tab.label==="Đang xử lý"&&activeCount>0&&<span style={{marginLeft:6,background:"#ee4d2d",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{activeCount}</span>}
          </div>
        ))}
      </div>

      {/* List */}
      {loading?(
        <div style={{textAlign:"center",padding:"80px 0",color:"#9ca3af"}}>
          <div style={{width:40,height:40,border:"3px solid #f0f0f0",borderTop:"3px solid #ee4d2d",borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block"}}/>
          <div style={{marginTop:12}}>Đang tải đơn hàng...</div>
        </div>
      ):filtered.length===0?(
        <div style={{textAlign:"center",padding:"80px 0",background:"#fff",borderRadius:14}}>
          <div style={{fontSize:56,marginBottom:12}}>🛒</div>
          <div style={{color:"#9ca3af",fontSize:16,fontWeight:500}}>Chưa có đơn hàng nào</div>
          <button onClick={()=>navigate("/home")} style={{marginTop:16,padding:"10px 28px",background:"#ee4d2d",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Đặt món ngay →</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(order=>{
            const cfg=SC[order.status]||SC.pending;
            return(
              <div key={order._id} onClick={()=>setDetailId(order._id)}
                style={{background:"#fff",borderRadius:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",border:"1px solid #f3f4f6",cursor:"pointer",transition:"all .2s",overflow:"hidden"}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(238,77,45,.1)";e.currentTarget.style.borderColor="#fca5a5";e.currentTarget.style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.06)";e.currentTarget.style.borderColor="#f3f4f6";e.currentTarget.style.transform="translateY(0)";}}>
                {/* Header */}
                <div style={{padding:"14px 20px",borderBottom:"1px solid #f9fafb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>{order.restaurantName}</span>
                    <span style={{fontSize:11,color:"#d1d5db",marginLeft:8,fontFamily:"monospace"}}>#{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <span style={{background:cfg.bg,color:cfg.color,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1px solid ${cfg.color}30`}}>{cfg.label}</span>
                </div>
                {/* Items */}
                <div style={{padding:"12px 20px",borderBottom:"1px solid #f9fafb"}}>
                  {order.items?.slice(0,2).map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"4px 0"}}>
                      <div style={{width:34,height:34,borderRadius:8,background:"#fff8f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,border:"1px solid #fee2e2"}}>{item.emoji||"🍽️"}</div>
                      <span style={{fontSize:14,color:"#374151",flex:1}}>{item.name} <span style={{color:"#9ca3af"}}>×{item.quantity}</span></span>
                      <span style={{fontWeight:600,fontSize:13,color:"#374151"}}>{fmtMoney(item.price*item.quantity)}</span>
                    </div>
                  ))}
                  {order.items?.length>2&&<div style={{fontSize:12,color:"#9ca3af",marginTop:4,paddingLeft:44}}>+{order.items.length-2} món khác</div>}
                </div>
                {/* Footer */}
                <div style={{padding:"10px 20px",background:"#fafafa",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:12,color:"#9ca3af"}}>{fmtDate(order.createdAt)}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                    <span style={{fontSize:12,color:"#6b7280"}}>Tổng:</span>
                    <span style={{fontSize:18,fontWeight:800,color:"#ee4d2d"}}>{fmtMoney(order.total)}</span>
                    <span style={{fontSize:12,color:"#d1d5db"}}>→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AnimStyles/>
    </div>
  );
}

function AnimStyles(){
  return(
    <style>{`
      @keyframes modalPop{from{opacity:0;transform:scale(.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
    `}</style>
  );
}

export default OrdersPage;
