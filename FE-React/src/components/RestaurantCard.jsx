import FlashSaleCountdown from "./FlashSaleCountdown";

function RestaurantCard({ restaurant, navigate }) {
  // Handle fallback properties to support existing mock data format
  const name = restaurant.name;
  const image = restaurant.image || "https://cf.shopee.vn/file/vn-11134201-7qukw-lkbscl2h9e3rc4"; // fallback image
  const rating = restaurant.rating || 0;
  const reviews = restaurant.reviews || 0;
  const tags = restaurant.tags || [];
  const distance = restaurant.distance || "";
  const deliveryTime = restaurant.deliveryTime || 0;
  const isFlashSale = restaurant.isFlashSale;
  const discountPercent = restaurant.discountPercent || 0;
  
  // Calculate flash sale end time (ends at midnight today + 1 day)
  const getFlashSaleEndTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  };

  return (
    <a href={`/restaurant/${restaurant.id || restaurant._id}`} className="product-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative' }}>
        <img src={image} alt={name} className="product-image" loading="lazy" style={{ height: '160px', objectFit: 'cover' }} />
        {isFlashSale && (
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 1 }}>
            <span className="badge" style={{ backgroundColor: 'var(--shopee-orange)', color: 'white', padding: '4px 8px', fontSize: '10px', fontWeight: '600', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>⚡ Flash Sale</span>
            <FlashSaleCountdown endTime={getFlashSaleEndTime()} />
          </div>
        )}
        {isFlashSale && discountPercent > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#ee4d2d', color: 'white', padding: '6px 10px', fontSize: '13px', fontWeight: '700', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 1 }}>
            -{discountPercent}%
          </div>
        )}
      </div>
      <div className="product-info" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
           <h3 className="product-name" style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</h3>
           {tags.length > 0 && (
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {tags.map((tag, idx) => (
                  <span key={idx} style={{ backgroundColor: '#f5f5f5', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 4px', borderRadius: '2px' }}>{tag}</span>
                ))}
             </div>
           )}
        </div>
        
        <div className="product-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#ffb500', display: 'flex', alignItems: 'center', gap: '2px' }}>
                ★ {rating.toFixed(1)} <span style={{ color: 'var(--text-muted)', marginLeft: '2px' }}>({reviews}+)</span>
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{distance}</span>
          </div>
          <div style={{ borderTop: '1px dashed #eee', paddingTop: '4px', marginTop: '2px', fontSize: '12px', color: 'var(--text-muted)' }}>
             Giao hàng: {deliveryTime} phút
          </div>
        </div>
      </div>
    </a>
  );
}

export default RestaurantCard;
