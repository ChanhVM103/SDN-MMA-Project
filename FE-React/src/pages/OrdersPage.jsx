import { useState, useEffect, useCallback } from "react";
import { getMyOrders, getOrderById, cancelOrder, confirmOrderReceived } from "../services/order-api";
import { submitBulkReviews, checkOrderReviewed, updateReview, deleteReview } from "../services/review-api";

// ─── Config ────────────────────────────────────────────────────
const SC = {
  pending:           { label:"Chờ xác nhận",       emoji:"⏳", color:"#f59e0b", bg:"#fef3c7" },
  confirmed:         { label:"Đã xác nhận",         emoji:"✅", color:"#3b82f6", bg:"#dbeafe" },
  preparing:         { label:"Đang chuẩn bị",       emoji:"👨‍🍳", color:"#8b5cf6", bg:"#ede9fe" },
  ready_for_pickup:  { label:"Chờ shipper",          emoji:"📦", color:"#f97316", bg:"#ffedd5" },
  shipper_accepted:  { label:"Shipper đã nhận",      emoji:"🛵", color:"#06b6d4", bg:"#cffafe" },
  delivering:        { label:"Đang giao hàng",       emoji:"🚀", color:"#ee4d2d", bg:"#fff0ed" },
  shipper_delivered: { label:"Shipper đã giao",      emoji:"📬", color:"#84cc16", bg:"#ecfccb" },
  delivered:         { label:"Đã giao thành công",  emoji:"🎉", color:"#10b981", bg:"#d1fae5" },
  cancelled:         { label:"Đã hủy",               emoji:"✕",  color:"#ef4444", bg:"#fee2e2" },
};

const STEPS = [
  { key:"pending",          label:"Đã xác nhận đơn hàng",      desc:"Nhà hàng đã nhận được đơn của bạn và đang kiểm tra." },
  { key:"preparing",        label:"Đang chuẩn bị món",         desc:"Đầu bếp đang chế biến món ăn theo yêu cầu của bạn." },
  { key:"delivering",       label:"Đang giao hàng",            desc:"Tài xế đang trên đường giao đơn hàng đến bạn." },
  { key:"delivered",        label:"Đã giao hàng",              desc:"Đơn hàng đã được giao thành công." },
];

const STEP_ORDER = ["pending","confirmed","preparing","ready_for_pickup","shipper_accepted","delivering","shipper_delivered","delivered"];

const TAB_FILTERS = [
  { label:"Tất cả",     status:null },
  { label:"Đang xử lý", status:["pending","confirmed","preparing","ready_for_pickup","shipper_accepted","delivering","shipper_delivered"] },
  { label:"Hoàn thành", status:["delivered"] },
  { label:"Đã hủy",     status:["cancelled"] },
];

// ─── Helpers ────────────────────────────────────────────────────
function fmtMoney(n){ return (n||0).toLocaleString("vi-VN")+"đ"; }
function fmtDate(d){
  const dt = new Date(d);
  return dt.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}) + ", " + dt.toLocaleDateString("vi-VN");
}

// ─── Star Rating ────────────────────────────────────────────────
function Stars({ value, onChange }){
  const [hov,setHov]=useState(0);
  const labels=["","Tệ 😞","Không hài lòng 😕","Bình thường 😐","Hài lòng 😊","Tuyệt vời! 🤩"];
  return(
    <div>
      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
        {[1,2,3,4,5].map(s=>(
          <span key={s} onClick={()=>onChange?.(s)} onMouseEnter={()=>onChange&&setHov(s)} onMouseLeave={()=>onChange&&setHov(0)}
            style={{fontSize:38,cursor:onChange?"pointer":"default",color:s<=(hov||value)?"#f59e0b":"#e5e7eb",
              transition:"color .1s,transform .15s",transform:s===(hov||value)?"scale(1.25)":"scale(1)",display:"inline-block"}}>★</span>
        ))}
      </div>
      {onChange&&<div style={{textAlign:"center",fontSize:13,fontWeight:700,color:"#ee4d2d",marginTop:4,minHeight:20}}>{labels[hov||value]}</div>}
    </div>
  );
}

// ─── Review Modal ───────────────────────────────────────────────
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
        <Btn label={busy?"⏳ Đang gửi...":"🌟 Gửi đánh giá"} disabled={busy} onClick={submit} color="#ee4d2d"/>
      </div>
    </Overlay>
  );
}

// ─── Edit Review Modal ──────────────────────────────────────────
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
        <Btn label={busy?"⏳ Đang lưu...":"💾 Lưu thay đổi"} disabled={busy} onClick={submit} color="#3b82f6"/>
      </div>
    </Overlay>
  );
}

// ─── Small shared components ────────────────────────────────────
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
function Btn({label,onClick,disabled,color="#ee4d2d"}){return <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:disabled?"#e5e7eb":color,color:disabled?"#9ca3af":"#fff",fontWeight:800,fontSize:15,cursor:disabled?"not-allowed":"pointer"}}>{label}</button>;}
function ErrBox({msg}){return <div style={{marginBottom:12,padding:"10px 14px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontSize:13}}>⚠️ {msg}</div>;}

// ─── ORDER DETAIL PAGE (2-column) ───────────────────────────────
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
    const id=setInterval(()=>{ if(order&&!["delivered","cancelled"].includes(order.status)) load(); },8000);
    return()=>clearInterval(id);
  },[load,order]);

  if(loading) return <div style={{textAlign:"center",padding:"80px 0",color:"#9ca3af"}}><div style={{fontSize:36,animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</div><div style={{marginTop:12}}>Đang tải...</div></div>;
  if(!order) return null;

  const cfg=SC[order.status]||SC.pending;
  const currentStepIdx=STEP_ORDER.indexOf(order.status);

  // Build timeline from statusHistory or fallback to steps
  const history=order.statusHistory||[];

  return(
    <div style={{padding:"8px 0"}}>
      {/* Back + title */}
      <div style={{marginBottom:16}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#ee4d2d",fontWeight:700,fontSize:14,padding:0,display:"flex",alignItems:"center",gap:4,marginBottom:10}}>← Quay lại đơn hàng</button>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div>
            <h1 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Đơn hàng của tôi</h1>
            <div style={{fontSize:13,color:"#6b7280",display:"flex",alignItems:"center",gap:6}}>
              Mã đơn hàng:
              <span style={{color:"#ee4d2d",fontWeight:700,fontFamily:"monospace"}}>#{order._id.slice(-8).toUpperCase()}</span>
              <span style={{cursor:"pointer",fontSize:14}} onClick={()=>navigator.clipboard?.writeText(order._id)} title="Copy">📋</span>
            </div>
          </div>
          <span style={{background:cfg.bg,color:cfg.color,padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:700,border:`1px solid ${cfg.color}40`}}>{cfg.emoji} {cfg.label}</span>
        </div>
      </div>

      <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
        {/* ── LEFT column ── */}
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:16}}>

          {/* Status timeline */}
          <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #f3f4f6"}}>
            <h3 style={{margin:"0 0 20px",fontSize:15,fontWeight:700,color:"#1a1a1a",display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:28,height:28,background:"#fff0ed",borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📊</span>
              Trạng thái đơn hàng
            </h3>

            {order.status==="cancelled" ? (
              <div style={{padding:"20px 0",textAlign:"center"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:"#fee2e2",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>✕</div>
                <div style={{fontWeight:700,color:"#ef4444",fontSize:15,marginBottom:4}}>Đơn hàng đã bị hủy</div>
                {history.find(h=>h.status==="cancelled") && <div style={{fontSize:12,color:"#9ca3af"}}>{fmtDate(history.find(h=>h.status==="cancelled").changedAt)}</div>}
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {STEPS.map((step,idx)=>{
                  const stepIdx=STEP_ORDER.indexOf(step.key);
                  const done=currentStepIdx>=stepIdx;
                  const current=STEP_ORDER[currentStepIdx]===step.key ||
                    (step.key==="delivering" && ["shipper_accepted","delivering","shipper_delivered"].includes(order.status));
                  const histEntry=history.slice().reverse().find(h=>STEP_ORDER.indexOf(h.status)>=stepIdx && STEP_ORDER.indexOf(h.status)<(STEP_ORDER.indexOf(STEPS[idx+1]?.key)||999));
                  const isLast=idx===STEPS.length-1;

                  return(
                    <div key={step.key} style={{display:"flex",gap:16,position:"relative"}}>
                      {/* Line */}
                      {!isLast&&<div style={{position:"absolute",left:19,top:40,bottom:-2,width:2,background:done?"#ee4d2d":"#e5e7eb",zIndex:0}}/>}
                      {/* Circle */}
                      <div style={{width:40,height:40,borderRadius:"50%",background:done?"#ee4d2d":"#e5e7eb",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,border:current?"3px solid #fca5a5":"none",transition:"all .4s",marginTop:0}}>
                        {done
                          ? <span style={{color:"#fff",fontWeight:900,fontSize:current?16:14}}>{current?SC[order.status]?.emoji||"🚀":"✓"}</span>
                          : <span style={{color:"#d1d5db",fontSize:10}}>●</span>}
                      </div>
                      {/* Text */}
                      <div style={{paddingBottom:isLast?0:24,paddingTop:4,flex:1}}>
                        <div style={{fontWeight:current?700:500,fontSize:14,color:current?"#1a1a1a":done?"#374151":"#9ca3af"}}>{step.label}</div>
                        {histEntry&&<div style={{fontSize:12,color:current?"#ee4d2d":"#9ca3af",marginTop:1}}>{fmtDate(histEntry.changedAt)}</div>}
                        {current&&<div style={{fontSize:12,color:"#6b7280",marginTop:4,lineHeight:1.5}}>{step.desc}</div>}
                        {!done&&!current&&<div style={{fontSize:12,color:"#d1d5db",marginTop:1}}>Chưa hoàn thành</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #f3f4f6"}}>
            <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#1a1a1a"}}>Chi tiết món ăn</h3>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {order.items?.map((item,idx)=>(
                <div key={idx} style={{display:"flex",alignItems:"center",gap:16,padding:"16px 0",borderBottom:idx<order.items.length-1?"1px solid #f3f4f6":"none"}}>
                  {/* Thumbnail */}
                  <div style={{width:80,height:80,borderRadius:14,background:"#fff8f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,flexShrink:0,border:"1px solid #fee2e2",overflow:"hidden"}}>
                    {item.image
                      ? <img src={item.image} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";e.target.parentNode.innerHTML=item.emoji||"🍽️";}}/>
                      : <span>{item.emoji||"🍽️"}</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a",marginBottom:4}}>{item.name}</div>
                    {item.note&&<div style={{fontSize:12,color:"#6b7280",marginBottom:2}}>Ghi chú: {item.note}</div>}
                    <div style={{fontSize:12,color:"#9ca3af"}}>Số lượng: {item.quantity}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>{fmtMoney(item.price*item.quantity)}</div>
                    {item.quantity>1&&<div style={{fontSize:11,color:"#9ca3af"}}>{fmtMoney(item.price)}/món</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipper info (if available) */}
          {order.shipper&&["shipper_accepted","delivering","shipper_delivered","delivered"].includes(order.status)&&(
            <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #f3f4f6"}}>
              <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#1a1a1a"}}>Thông tin tài xế</h3>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,overflow:"hidden"}}>
                  {order.shipper.avatar?<img src={order.shipper.avatar} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🛵"}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>{order.shipper.fullName}</div>
                  <div style={{fontSize:13,color:"#6b7280",marginTop:2}}>📞 {order.shipper.phone||"Không có SĐT"}</div>
                </div>
              </div>
              {order.shipper.phone&&(
                <div style={{display:"flex",gap:10}}>
                  <a href={`tel:${order.shipper.phone}`} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",color:"#1a1a1a",fontWeight:600,fontSize:13,textAlign:"center",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>📞 Gọi điện</a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT column ── */}
        <div style={{width:380,flexShrink:0,position:"sticky",top:20,display:"flex",flexDirection:"column",gap:16}}>

          {/* Payment summary */}
          <div style={{background:"#2d1f1a",borderRadius:16,padding:"22px",color:"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <span style={{fontWeight:700,fontSize:16}}>Thanh toán</span>
              <span style={{background:"#ee4d2d",color:"#fff",padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>
                {order.paymentMethod==="vnpay"?"VNPay":order.paymentMethod==="cash"?"Tiền mặt":order.paymentMethod}
              </span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <Row label="Tạm tính" value={fmtMoney(order.subtotal)} light/>
              {order.deliveryFee>0&&<Row label={`Phí giao hàng`} value={fmtMoney(order.deliveryFee)} light/>}
              {order.discount>0&&<Row label="Khuyến mãi" value={`-${fmtMoney(order.discount)}`} light valueColor="#4ade80"/>}
            </div>
            <div style={{borderTop:"1px solid rgba(255,255,255,.15)",paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontWeight:700,fontSize:15,color:"rgba(255,255,255,.9)"}}>Tổng cộng</span>
              <span style={{fontWeight:800,fontSize:26,color:"#ee4d2d"}}>{fmtMoney(order.total)}</span>
            </div>

            {/* Delivery address */}
            {order.deliveryAddress&&(
              <div style={{marginTop:16,padding:"12px",background:"rgba(255,255,255,.08)",borderRadius:10}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Địa chỉ giao hàng</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.85)",lineHeight:1.5,display:"flex",gap:6}}>
                  <span style={{color:"#ee4d2d",flexShrink:0}}>📍</span>
                  {order.deliveryAddress}
                </div>
              </div>
            )}

            {/* Note */}
            {order.note&&(
              <div style={{marginTop:10,padding:"12px",background:"rgba(255,255,255,.08)",borderRadius:10}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Ghi chú</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.75)",lineHeight:1.5}}>📝 {order.note}</div>
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
              }} style={{padding:"12px",borderRadius:12,border:"1.5px solid #ef4444",background:"#fff",color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer"}}>
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

            <div style={{padding:"14px",background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",textAlign:"center",fontSize:12,color:"#6b7280",lineHeight:1.5}}>
              Cần thay đổi thông tin đơn hàng? Vui lòng liên hệ trung tâm CSKH của FoodieHub.
            </div>
          </div>
        </div>
      </div>

      {reviewOrder&&<ReviewModal order={reviewOrder} onClose={()=>setReviewOrder(null)} onSuccess={async()=>{ setReviewOrder(null); const r=await checkOrderReviewed(order._id); if(r?.reviewed){setIsReviewed(true);setReviews(r.reviews||[]);} showToast("🌟 Cảm ơn bạn đã đánh giá!","success"); }}/>}
      {editReview&&<EditReviewModal reviews={editReview.reviews} order={editReview.order} onClose={()=>setEditReview(null)} onSuccess={async()=>{ setEditReview(null); const r=await checkOrderReviewed(order._id); if(r?.reviewed){setIsReviewed(true);setReviews(r.reviews||[]);} showToast("✅ Đã cập nhật đánh giá!","success"); }}/>}
    </div>
  );
}

function Row({label,value,light,valueColor}){
  const c=light?"rgba(255,255,255,.65)":"#6b7280";
  const vc=valueColor||(light?"rgba(255,255,255,.9)":"#1a1a1a");
  return(
    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
      <span style={{color:c}}>{label}</span>
      <span style={{fontWeight:600,color:vc}}>{value}</span>
    </div>
  );
}

// ─── ORDERS LIST PAGE ────────────────────────────────────────────
function OrdersPage({user,navigate}){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activeTab,setActiveTab]=useState(0);
  const [toast,setToast]=useState(null);
  const [detailId,setDetailId]=useState(null);

  const showToast=(msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

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
      <div className="empty-card">
        <h2>Vui lòng đăng nhập</h2>
        <button className="primary-btn" onClick={()=>navigate("/sign-in")}>Đăng nhập</button>
      </div>
    </div>
  );

  // Show detail page
  if(detailId)return(
    <>
      <OrderDetailPage orderId={detailId} onBack={()=>setDetailId(null)} showToast={showToast} onRefreshList={()=>fetchOrders(false)}/>
      <ToastComp toast={toast} onClose={()=>setToast(null)}/>
      <AnimStyles/>
    </>
  );

  const filtered=orders.filter(o=>{ const f=TAB_FILTERS[activeTab].status; return !f||f.includes(o.status); });
  const activeCount=orders.filter(o=>["pending","confirmed","preparing","ready_for_pickup","shipper_accepted","delivering","shipper_delivered"].includes(o.status)).length;

  return(
    <div className="view-port">
      {/* Header */}
      <div style={{background:"#fff",borderRadius:12,padding:"16px 24px",marginBottom:12,boxShadow:"0 1px 8px rgba(0,0,0,.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#1a1a1a"}}>📦 Đơn hàng của tôi</h2>
        <button onClick={()=>fetchOrders()} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",color:"#6b7280"}}>🔄 Làm mới</button>
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",borderRadius:12,marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.07)",display:"flex",overflowX:"auto"}}>
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
          <div style={{fontSize:36,animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</div>
          <div style={{marginTop:12}}>Đang tải đơn hàng...</div>
        </div>
      ):filtered.length===0?(
        <div style={{textAlign:"center",padding:"80px 0",background:"#fff",borderRadius:12}}>
          <div style={{fontSize:56,marginBottom:12}}>🛒</div>
          <div style={{color:"#9ca3af",fontSize:16,fontWeight:500}}>Chưa có đơn hàng nào</div>
          <button onClick={()=>navigate("/home")} style={{marginTop:16,padding:"10px 28px",background:"#ee4d2d",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>Đặt món ngay →</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(order=>{
            const cfg=SC[order.status]||SC.pending;
            return(
              <div key={order._id} onClick={()=>setDetailId(order._id)} style={{background:"#fff",borderRadius:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #f3f4f6",cursor:"pointer",transition:"all .2s",overflow:"hidden"}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 20px rgba(238,77,45,.12)";e.currentTarget.style.borderColor="#fca5a5";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.07)";e.currentTarget.style.borderColor="#f3f4f6";}}>
                {/* Header */}
                <div style={{padding:"14px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>{order.restaurantName}</span>
                    <span style={{fontSize:11,color:"#9ca3af",fontFamily:"monospace"}}>#{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <span style={{background:cfg.bg,color:cfg.color,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,border:`1px solid ${cfg.color}40`}}>{cfg.emoji} {cfg.label}</span>
                </div>
                {/* Items preview */}
                <div style={{padding:"12px 20px",borderBottom:"1px solid #f3f4f6"}}>
                  {order.items?.slice(0,2).map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"4px 0"}}>
                      <div style={{width:36,height:36,borderRadius:8,background:"#fff8f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,border:"1px solid #fee2e2"}}>{item.emoji||"🍽️"}</div>
                      <span style={{fontSize:14,color:"#374151",flex:1}}>{item.name} <span style={{color:"#9ca3af"}}>x{item.quantity}</span></span>
                      <span style={{fontWeight:600,fontSize:14,color:"#1a1a1a"}}>{fmtMoney(item.price*item.quantity)}</span>
                    </div>
                  ))}
                  {order.items?.length>2&&<div style={{fontSize:12,color:"#9ca3af",marginTop:4}}>+{order.items.length-2} món khác</div>}
                </div>
                {/* Footer */}
                <div style={{padding:"10px 20px",background:"#fafafa",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:12,color:"#9ca3af"}}>{fmtDate(order.createdAt)}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                    <span style={{fontSize:12,color:"#6b7280"}}>Tổng:</span>
                    <span style={{fontSize:18,fontWeight:800,color:"#ee4d2d"}}>{fmtMoney(order.total)}</span>
                    <span style={{fontSize:12,color:"#9ca3af"}}>→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ToastComp toast={toast} onClose={()=>setToast(null)}/>
      <AnimStyles/>
    </div>
  );
}

function ToastComp({toast,onClose}){
  if(!toast)return null;
  return(
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?"#ef4444":toast.type==="warning"?"#f59e0b":"#10b981",color:"#fff",padding:"14px 22px",borderRadius:14,fontWeight:600,fontSize:14,zIndex:99999,boxShadow:"0 8px 32px rgba(0,0,0,.22)",display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap",animation:"toastIn .35s cubic-bezier(.175,.885,.32,1.275)"}}>
      <span>{toast.type==="error"?"❌":toast.type==="warning"?"⚠️":"✅"}</span>
      <span>{toast.msg}</span>
      <button onClick={onClose} style={{marginLeft:8,background:"rgba(255,255,255,.25)",border:"none",color:"#fff",borderRadius:8,width:22,height:22,cursor:"pointer",fontWeight:700}}>✕</button>
    </div>
  );
}

function AnimStyles(){
  return(
    <style>{`
      @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px) scale(.9)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
      @keyframes modalPop{from{opacity:0;transform:scale(.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
    `}</style>
  );
}

export default OrdersPage;
