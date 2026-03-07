import { useState, useEffect } from "react";
import RestaurantCard from "../components/RestaurantCard";
import { getRestaurantsByTags, getAllRestaurants } from "../services/restaurant-api";
import { TypewriterText } from "../components/ui/TypewriterText";

function HomePage({ user, navigate }) {
  // Filters
  const [activeType, setActiveType] = useState("all-type"); // all-type, food, drink
  const [activeCountry, setActiveCountry] = useState("all-country"); // all-country, vietnam, japan, korea

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Type mappings
  const typeMap = {
    "food": ["Đồ ăn", "Phở", "Pizza", "Burger", "Hải Sản", "Nem nướng", "Lẩu"],
    "drink": ["Đồ uống", "Trà sữa", "Cà phê"],
  };

  const countryMap = {
    "vietnam": ["Việt Nam"],
    "japan": ["Nhật Bản", "Sushi", "Sashimi"],
    "korea": ["Hàn Quốc"],
    "italy": ["Ý"]
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        let tagsToSearch = [];

        // Append type tags
        if (activeType !== "all-type" && typeMap[activeType]) {
          tagsToSearch = [...tagsToSearch, ...typeMap[activeType]];
        }

        // Append country tags
        if (activeCountry !== "all-country" && countryMap[activeCountry]) {
          tagsToSearch = [...tagsToSearch, ...countryMap[activeCountry]];
        }

        let data;
        if (tagsToSearch.length > 0) {
          // Send tags as comma separated string
          data = await getRestaurantsByTags(tagsToSearch.join(","));
        } else {
          data = await getAllRestaurants();
        }

        setRestaurants(Array.isArray(data) ? data : data.restaurants || []);
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [activeType, activeCountry]);

  return (
    <div style={{ backgroundColor: "var(--shopee-bg)", minHeight: "100vh", paddingBottom: "20px" }}>
      {/* Banner Skeleton */}
      <section className="view-port" style={{ paddingTop: "20px", paddingBottom: "0" }}>
        <div className="hero-banner">
          <div className="carousel-main">
            <h2>
              <TypewriterText
                words={[
                  "Trải nghiệm ẩm thực đỉnh cao",
                  "Giao hàng siêu tốc 🚀",
                  "Khám phá món ngon mỗi ngày",
                  "FoodieHub - Đặt đồ ăn dễ dàng",
                ]}
                typingSpeed={80}
                deletingSpeed={40}
                pauseDuration={2000}
              />
            </h2>
          </div>
          <div className="carousel-side">
            <div className="carousel-side-item">Freeship Xtra</div>
            <div className="carousel-side-item">Flash Sale</div>
          </div>
        </div>
      </section>

      {/* Advanced Filter Section */}
      <section className="view-port" style={{ paddingTop: "0", paddingBottom: "0" }}>
        <div className="panel" style={{ padding: "0" }}>

          {/* Type Filter */}
          <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
            {[
              { id: "all-type", label: "Tất cả" },
              { id: "food", label: "Đồ Ăn" },
              { id: "drink", label: "Nước Uống" }
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveType(t.id)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "15px 0",
                  cursor: "pointer",
                  color: activeType === t.id ? "var(--shopee-orange)" : "var(--text-main)",
                  fontWeight: activeType === t.id ? "500" : "normal",
                  borderBottom: activeType === t.id ? "2px solid var(--shopee-orange)" : "2px solid transparent"
                }}
              >
                {t.label}
              </div>
            ))}
          </div>

          {/* Country Filter */}
          <div style={{ display: "flex", overflowX: "auto", padding: "12px 16px", gap: "10px", backgroundColor: "#fafafa" }} className="hide-scrollbar">
            <span style={{ fontSize: "14px", color: "var(--text-muted)", alignSelf: "center", marginRight: "8px", whiteSpace: "nowrap" }}>Ẩm thực:</span>
            {[
              { id: "all-country", label: "Tất cả" },
              { id: "vietnam", label: "Việt Nam 🇻🇳" },
              { id: "japan", label: "Nhật Bản 🇯🇵" },
              { id: "korea", label: "Hàn Quốc 🇰🇷" },
              { id: "italy", label: "Ý 🇮🇹" }
            ].map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveCountry(c.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  border: activeCountry === c.id ? "1px solid var(--shopee-orange)" : "1px solid #ddd",
                  color: activeCountry === c.id ? "var(--shopee-orange)" : "var(--text-main)",
                  backgroundColor: activeCountry === c.id ? "#fff5f4" : "#fff"
                }}
              >
                {c.label}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* General Restaurant Grid */}
      <section className="view-port" style={{ paddingTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "4px solid var(--shopee-orange)", marginBottom: "10px", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "500", letterSpacing: "1px", margin: 0, color: "var(--text-main)" }}>NHÀ HÀNG NỔI BẬT</h2>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>Xem thêm &gt;</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
            <div className="spinner" style={{ margin: "0 auto 10px", width: "30px", height: "30px", border: "3px solid #f3f3f3", borderTop: "3px solid var(--shopee-orange)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            Đang tải nhà hàng...
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : restaurants.length > 0 ? (
          <div className="product-grid">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant._id || restaurant.id} restaurant={restaurant} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "#fff", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }}>
            <svg viewBox="0 0 100 100" width="80" height="80" style={{ fill: "rgba(0,0,0,0.1)", marginBottom: "15px" }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" />
              <path d="M50 30L30 60h40L50 30z" fill="currentColor" />
            </svg>
            <div style={{ color: "var(--text-muted)", fontSize: "16px" }}>Không tìm thấy nhà hàng nào phù hợp với bộ lọc.</div>
            <button className="ghost-btn" style={{ marginTop: "15px" }} onClick={() => { setActiveType("all-type"); setActiveCountry("all-country"); }}>Xóa bộ lọc</button>
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
