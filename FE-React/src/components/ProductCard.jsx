function ProductCard({ product }) {
  // Handle fallback properties to support existing mock data format
  const title = product.name;
  const price = product.price;
  const image = product.image || "https://cf.shopee.vn/file/vn-11134201-7qukw-lkbscl2h9e3rc4"; // fallback image
  const soldCount = product.soldCount || Math.floor(Math.random() * 500) + 1; // mock sold count
  const badge = product.badge || (product.isBestSeller ? "Yêu thích" : null);

  // Format price
  const formattedPrice = typeof price === 'number' 
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    : price;

  return (
    <a href={`/product/${product.id}`} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <img src={image} alt={title} className="product-image" loading="lazy" />
      {badge && <span className="badge">{badge}</span>}
      <div className="product-info">
        <h3 className="product-name">{title}</h3>
        <div className="product-meta">
          <span className="product-price">{formattedPrice}</span>
          <span className="product-sold">Đã bán {soldCount}</span>
        </div>
      </div>
    </a>
  );
}

export default ProductCard;
