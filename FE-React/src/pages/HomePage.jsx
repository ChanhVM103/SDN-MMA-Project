import { useState, useEffect } from "react";
import RestaurantCard from "../components/RestaurantCard";
import {
  getRestaurantsByTags,
  getAllRestaurants,
} from "../services/restaurant-api";
import { TypewriterText } from "../components/ui/TypewriterText";
import CategorySection from "../components/CategorySection";
import CarouselSection from "../components/CarouselSection";

function HomePage({ user, navigate, globalSearchTerm, setGlobalSearchTerm }) {
  // Filters
  const [activeType, setActiveType] = useState("all-type"); // all-type, food, drink
  const [activeCountry, setActiveCountry] = useState("all-country"); // all-country, vietnam, japan, korea
  const [activeCategory, setActiveCategory] = useState(null); // null hoặc tag string

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const typeQueryMap = {
    food: "food",
    drink: "drink",
  };

  const countryMap = {
    vietnam: ["Việt Nam"],
    japan: ["Nhật Bản", "Sushi", "Sashimi"],
    korea: ["Hàn Quốc"],
    italy: ["Ý"],
  };

  const handleCategorySelect = (tag) => {
    if (activeCategory === tag) {
      setActiveCategory(null); // Deselect if clicking same category
    } else {
      setActiveCategory(tag);
      setActiveType("all-type"); // Reset type filter
      setActiveCountry("all-country"); // Reset country filter
      if (setGlobalSearchTerm) setGlobalSearchTerm(""); // Clear search
    }
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const selectedType = typeQueryMap[activeType] || "";
        let countryTags = [];

        // Handle category filter
        if (activeCategory) {
          if (activeCategory === 'flash-sale') {
            // Flash sale special handling
            data = await getAllRestaurants({ limit: 100 });
            rawList = Array.isArray(data) ? data : data.restaurants || [];
            rawList = rawList.filter(r => r.isFlashSale);
            setRestaurants(rawList);
            setLoading(false);
            return;
          } else {
            // Normal category tag
            countryTags = [activeCategory];
          }
        }

        // Append country tags
        if (activeCountry !== "all-country" && countryMap[activeCountry]) {
          countryTags = [...countryMap[activeCountry]];
        }

        let data;
        let rawList = [];
        if (globalSearchTerm) {
          // If a global search term exists, prioritize searching by text over tags locally
          data = await getAllRestaurants({
            search: globalSearchTerm,
            type: selectedType || undefined,
          });
          rawList = Array.isArray(data) ? data : data.restaurants || [];
          if (countryTags.length > 0) {
            rawList = rawList.filter((restaurant) =>
              (restaurant.tags || []).some((tag) => countryTags.includes(tag)),
            );
          }
        } else if (selectedType) {
          data = await getAllRestaurants({ type: selectedType, limit: 100 });
          rawList = Array.isArray(data) ? data : data.restaurants || [];
          if (countryTags.length > 0) {
            rawList = rawList.filter((restaurant) =>
              (restaurant.tags || []).some((tag) => countryTags.includes(tag)),
            );
          }
        } else if (countryTags.length > 0) {
          data = await getRestaurantsByTags(countryTags.join(","));
          rawList = Array.isArray(data) ? data : data.restaurants || [];
        } else {
          data = await getAllRestaurants();
          rawList = Array.isArray(data) ? data : data.restaurants || [];
        }

        // Flash Sale ưu tiên lên trước
        const sorted = [...rawList].sort((a, b) => {
          if (a.isFlashSale && !b.isFlashSale) return -1;
          if (!a.isFlashSale && b.isFlashSale) return 1;
          return 0;
        });
        setRestaurants(sorted);
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [activeType, activeCountry, activeCategory, globalSearchTerm]);

  const isDefaultView = activeType === "all-type" && activeCountry === "all-country" && !activeCategory && !globalSearchTerm;

  const flashSaleRestaurants = restaurants.filter(r => r.isFlashSale);
  const topRatedRestaurants = [...restaurants]
    .filter(r => r.rating >= 4.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);
  const mostOrderedRestaurants = [...restaurants]
    .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
    .slice(0, 10);

  return (
    <div
      style={{
        backgroundColor: "var(--shopee-bg)",
        minHeight: "100vh",
        paddingBottom: "20px",
      }}
    >
      {/* Banner Skeleton */}
      <section
        className="view-port"
        style={{ paddingTop: "20px", paddingBottom: "0" }}
      >
        <div
          className="hero-banner"
          style={{ background: "transparent", boxShadow: "none" }}
        >
          <div
            className="carousel-main"
            style={{
              position: "relative",
              padding: 0,
              overflow: "hidden",
              backgroundColor: "#222",
              borderRadius: "12px",
              boxShadow: "var(--shadow-sm)",
              width: "100%",
              height: "100%",
            }}
          >
              <img
                src="/banner.png"
                alt="FoodieHub Banner"
                style={{ width: "100%", height: "100%", objectFit: "fill" }}
              />
            </div>
            <div className="carousel-side">
              <div
                className="carousel-side-item"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <img
                  src="/freeship.png"
                  alt="Freeship Xtra"
                  style={{ width: "100%", height: "100%", objectFit: "fill" }}
                />
              </div>
              <div
                className="carousel-side-item"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <img
                  src="/flash_sale.png"
                  alt="Flash Sale"
                  style={{ width: "100%", height: "100%", objectFit: "fill" }}
                />
              </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <CategorySection
        onSelectCategory={handleCategorySelect}
        activeCategory={activeCategory}
      />

      {/* Advanced Filter Section */}
      <section
        className="view-port"
        style={{ paddingTop: "0", paddingBottom: "0" }}
      >
        <div className="panel" style={{ padding: "0" }}>
          {/* Type Filter */}
          <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
            {[
              { id: "all-type", label: "Tất cả" },
              { id: "food", label: "Đồ Ăn" },
              { id: "drink", label: "Nước Uống" },
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setActiveType(t.id);
                  if (globalSearchTerm && setGlobalSearchTerm) setGlobalSearchTerm("");
                }}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "15px 0",
                  cursor: "pointer",
                  color:
                    activeType === t.id
                      ? "var(--shopee-orange)"
                      : "var(--text-main)",
                  fontWeight: activeType === t.id ? "500" : "normal",
                  borderBottom:
                    activeType === t.id
                      ? "2px solid var(--shopee-orange)"
                      : "2px solid transparent",
                }}
              >
                {t.label}
              </div>
            ))}
          </div>

          {/* Country Filter */}
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              padding: "12px 16px",
              gap: "10px",
              backgroundColor: "#fafafa",
            }}
            className="hide-scrollbar"
          >
            <span
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                alignSelf: "center",
                marginRight: "8px",
                whiteSpace: "nowrap",
              }}
            >
              Ẩm thực:
            </span>
            {[
              { id: "all-country", label: "Tất cả" },
              { id: "vietnam", label: "Việt Nam 🇻🇳" },
              { id: "japan", label: "Nhật Bản 🇯🇵" },
              { id: "korea", label: "Hàn Quốc 🇰🇷" },
              { id: "italy", label: "Ý 🇮🇹" },
            ].map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setActiveCountry(c.id);
                  if (globalSearchTerm && setGlobalSearchTerm) setGlobalSearchTerm("");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  border:
                    activeCountry === c.id
                      ? "1px solid var(--shopee-orange)"
                      : "1px solid #ddd",
                  color:
                    activeCountry === c.id
                      ? "var(--shopee-orange)"
                      : "var(--text-main)",
                  backgroundColor: activeCountry === c.id ? "#fff5f4" : "#fff",
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      <section className="view-port" style={{ paddingTop: "20px" }}>
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "var(--text-muted)",
            }}
          >
            <div
              className="spinner"
              style={{
                margin: "0 auto 10px",
                width: "30px",
                height: "30px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid var(--shopee-orange)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            Đang tải nhà hàng...
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : isDefaultView ? (
          <>
            <style>{`
              .restaurant-section {
                margin-bottom: 25px;
              }
              .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 4px solid var(--shopee-orange);
                margin-bottom: 15px;
                padding-bottom: 8px;
              }
              .section-header h2 {
                font-size: 16px;
                font-weight: 600;
                letter-spacing: 1px;
                margin: 0;
                color: var(--text-main);
                text-transform: uppercase;
              }
              .see-more {
                font-size: 13px;
                color: var(--shopee-orange);
                cursor: pointer;
                font-weight: 500;
              }
              .horizontal-scroll {
                display: flex;
                overflow-x: auto;
                gap: 15px;
                padding-bottom: 15px;
              }
              .horizontal-scroll::-webkit-scrollbar {
                height: 6px;
              }
              .horizontal-scroll::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
              }
              .horizontal-scroll::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 4px;
              }
              .horizontal-scroll::-webkit-scrollbar-thumb:hover {
                background: #aaa;
              }
              .horizontal-scroll > div {
                min-width: 190px;
                flex: 0 0 190px;
              }
            `}</style>

            {/* Flash Sale Section */}
            <CarouselSection 
              title="⚡ FLASH SALE" 
              restaurants={flashSaleRestaurants} 
              navigate={navigate} 
            />

            {/* Top Rated Section */}
            <CarouselSection 
              title="⭐ QUÁN RATING 5 SAO" 
              restaurants={topRatedRestaurants} 
              navigate={navigate} 
            />

            {/* Most Ordered Section */}
            <CarouselSection 
              title="🏆 ĐẶT NHIỀU NHẤT" 
              restaurants={mostOrderedRestaurants} 
              navigate={navigate} 
            />

            {/* Default State Fallback */}
            {flashSaleRestaurants.length === 0 && topRatedRestaurants.length === 0 && mostOrderedRestaurants.length === 0 && restaurants.length > 0 && (
              <div className="restaurant-section">
                <div className="section-header">
                  <h2>TẤT CẢ NHÀ HÀNG</h2>
                </div>
                <div className="product-grid">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant._id || restaurant.id}
                      restaurant={restaurant}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : restaurants.length > 0 ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "4px solid var(--shopee-orange)",
                marginBottom: "10px",
                paddingBottom: "10px",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "500",
                  letterSpacing: "1px",
                  margin: 0,
                  color: "var(--text-main)",
                }}
              >
                KẾT QUẢ TÌM KIẾM
              </h2>
            </div>
            <div className="product-grid">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant._id || restaurant.id}
                  restaurant={restaurant}
                  navigate={navigate}
                />
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              backgroundColor: "#fff",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <svg
              viewBox="0 0 100 100"
              width="80"
              height="80"
              style={{ fill: "rgba(0,0,0,0.1)", marginBottom: "15px" }}
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
              />
              <path d="M50 30L30 60h40L50 30z" fill="currentColor" />
            </svg>
            <div style={{ color: "var(--text-muted)", fontSize: "16px" }}>
              Không tìm thấy nhà hàng nào phù hợp với bộ lọc.
            </div>
            <button
              className="ghost-btn"
              style={{ marginTop: "15px" }}
              onClick={() => {
                setActiveType("all-type");
                setActiveCountry("all-country");
                if (globalSearchTerm && setGlobalSearchTerm) setGlobalSearchTerm("");
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
