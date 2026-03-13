import { useState, useEffect } from "react";
import RestaurantCard from "../components/RestaurantCard";
import {
  getRestaurantsByTags,
  getAllRestaurants,
} from "../services/restaurant-api";
import CategorySection from "../components/CategorySection";
import CarouselSection from "../components/CarouselSection";

function HomePage({ user, navigate, globalSearchTerm, setGlobalSearchTerm }) {
  const [activeType, setActiveType] = useState("all-type");
  const [activeCountry, setActiveCountry] = useState("all-country");
  const [activeCategory, setActiveCategory] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const typeQueryMap = { food: "food", drink: "drink" };
  const countryMap = {
    vietnam: ["Việt Nam"],
    japan: ["Nhật Bản", "Sushi", "Sashimi"],
    korea: ["Hàn Quốc"],
    italy: ["Ý"],
  };

  const handleCategorySelect = (tag) => {
    if (activeCategory === tag) {
      setActiveCategory(null);
    } else {
      setActiveCategory(tag);
      setActiveType("all-type");
      setActiveCountry("all-country");
      if (setGlobalSearchTerm) setGlobalSearchTerm("");
    }
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const selectedType = typeQueryMap[activeType] || "";
        let countryTags = [];
        let data;
        let rawList = [];

        if (activeCategory) {
          if (activeCategory === "flash-sale") {
            data = await getAllRestaurants({ limit: 100 });
            rawList = Array.isArray(data) ? data : data.restaurants || [];
            rawList = rawList.filter((r) => r.isFlashSale);
            setRestaurants(rawList);
            setLoading(false);
            return;
          } else {
            countryTags = [activeCategory];
          }
        }

        if (activeCountry !== "all-country" && countryMap[activeCountry]) {
          countryTags = [...countryMap[activeCountry]];
        }

        if (globalSearchTerm) {
          data = await getAllRestaurants({ search: globalSearchTerm, type: selectedType || undefined });
          rawList = Array.isArray(data) ? data : data.restaurants || [];
          if (countryTags.length > 0) {
            rawList = rawList.filter((r) => (r.tags || []).some((t) => countryTags.includes(t)));
          }
        } else if (selectedType) {
          data = await getAllRestaurants({ type: selectedType, limit: 100 });
          rawList = Array.isArray(data) ? data : data.restaurants || [];
          if (countryTags.length > 0) {
            rawList = rawList.filter((r) => (r.tags || []).some((t) => countryTags.includes(t)));
          }
        } else if (countryTags.length > 0) {
          data = await getRestaurantsByTags(countryTags.join(","));
          rawList = Array.isArray(data) ? data : data.restaurants || [];
        } else {
          data = await getAllRestaurants();
          rawList = Array.isArray(data) ? data : data.restaurants || [];
        }

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

  const isDefaultView =
    activeType === "all-type" &&
    activeCountry === "all-country" &&
    !activeCategory &&
    !globalSearchTerm;

  const flashSaleRestaurants = restaurants.filter((r) => r.isFlashSale);
  const topRatedRestaurants = [...restaurants]
    .filter((r) => r.rating >= 4.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);
  const mostOrderedRestaurants = [...restaurants]
    .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
    .slice(0, 10);

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh", paddingBottom: "40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        .fd-hero {
          background: linear-gradient(135deg, #fff9f5 0%, #fff3ee 100%);
          padding: 60px 0 0 0;
          overflow: hidden;
        }
        .fd-hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 40px;
          min-height: 380px;
        }
        .fd-hero-badge {
          display: inline-block;
          background: #fff0eb;
          color: #ee4d2d;
          border: 1px solid #ffd0c4;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .fd-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: 52px;
          font-weight: 800;
          line-height: 1.1;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .fd-hero-title em {
          font-style: italic;
          color: #ee4d2d;
        }
        .fd-hero-desc {
          font-size: 14px;
          color: #777;
          line-height: 1.7;
          margin-bottom: 28px;
          max-width: 380px;
        }
        .fd-search-bar {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 50px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.10);
          padding: 6px 6px 6px 20px;
          max-width: 440px;
          gap: 10px;
          margin-bottom: 28px;
          border: 1.5px solid #f0f0f0;
          transition: border-color 0.2s;
        }
        .fd-search-bar:focus-within {
          border-color: #ee4d2d;
        }
        .fd-search-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #333;
          background: transparent;
        }
        .fd-search-bar input::placeholder { color: #bbb; }
        .fd-search-btn {
          background: #ee4d2d;
          color: #fff;
          border: none;
          border-radius: 40px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s;
        }
        .fd-search-btn:hover { background: #d44027; transform: scale(1.03); }
        .fd-customers {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #555;
        }
        .fd-avatars {
          display: flex;
        }
        .fd-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid #fff;
          margin-left: -8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fde;
        }
        .fd-avatar:first-child { margin-left: 0; }
        .fd-hero-img {
          position: relative;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }
        .fd-hero-food-img {
          width: 100%;
          max-width: 460px;
          height: 320px;
          object-fit: cover;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .fd-avg-badge {
          position: absolute;
          bottom: 24px;
          left: 0;
          background: #fff;
          border-radius: 12px;
          padding: 10px 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }
        .fd-avg-badge .icon { font-size: 22px; }
        .fd-avg-badge .label { color: #999; font-size: 11px; }
        .fd-avg-badge .value { font-weight: 700; color: #1a1a1a; font-size: 15px; }

        /* Categories */
        .fd-categories {
          background: #fff;
          padding: 40px 0;
          margin-bottom: 8px;
        }
        .fd-section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .fd-section-sub {
          font-size: 13px;
          color: #999;
          margin-bottom: 24px;
        }
        .fd-section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .fd-view-all {
          font-size: 13px;
          color: #ee4d2d;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          padding-top: 2px;
        }
        .fd-cat-grid {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .fd-cat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          flex: 0 0 calc(16.666% - 17px);
          min-width: 80px;
          transition: transform 0.2s;
        }
        .fd-cat-item:hover { transform: translateY(-4px); }
        .fd-cat-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          transition: box-shadow 0.2s, border 0.2s;
        }
        .fd-cat-name {
          font-size: 13px;
          font-weight: 500;
          color: #444;
          text-align: center;
        }

        /* Flash deals */
        .fd-flash {
          background: #fff;
          padding: 40px 0;
          margin-bottom: 8px;
        }
        .fd-flash-title {
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fd-flash-icon {
          color: #ee4d2d;
          font-size: 20px;
        }

        /* How it works */
        .fd-steps {
          background: #fffaf8;
          padding: 60px 0;
          text-align: center;
          margin-bottom: 8px;
        }
        .fd-steps-title {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 40px;
        }
        .fd-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          max-width: 700px;
          margin: 0 auto;
        }
        .fd-step-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(238,77,45,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 28px;
          border: 1.5px solid #ffe0d9;
        }
        .fd-step-title {
          font-weight: 700;
          font-size: 15px;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .fd-step-desc {
          font-size: 13px;
          color: #888;
          line-height: 1.6;
        }

        /* App CTA */
        .fd-app-cta {
          background: #1a1a1a;
          border-radius: 24px;
          margin: 0 auto;
          max-width: 1200px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          overflow: hidden;
          position: relative;
        }
        .fd-app-cta-left {
          padding: 50px 50px 50px 50px;
          position: relative;
          z-index: 2;
        }
        .fd-app-cta-title {
          font-family: 'Poppins', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .fd-app-cta-desc {
          font-size: 14px;
          color: #aaa;
          line-height: 1.7;
          margin-bottom: 28px;
        }
        .fd-app-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .fd-app-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          color: #1a1a1a;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .fd-app-btn:hover { background: #f5f5f5; transform: scale(1.04); }
        .fd-app-btn .store-icon { font-size: 22px; }
        .fd-app-cta-right {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          height: 260px;
          position: relative;
        }
        .fd-phone-mockup {
          width: 140px;
          height: 220px;
          background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          position: relative;
          bottom: 0;
        }

        /* Filters */
        .fd-filters {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-bottom: 20px;
          overflow: hidden;
        }
        .fd-tab-bar {
          display: flex;
          border-bottom: 1px solid #f0f0f0;
        }
        .fd-tab {
          flex: 1;
          text-align: center;
          padding: 14px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          color: #888;
        }
        .fd-tab.active {
          color: #ee4d2d;
          border-bottom: 2px solid #ee4d2d;
        }
        .fd-country-bar {
          display: flex;
          overflow-x: auto;
          padding: 12px 16px;
          gap: 8px;
          background: #fafafa;
          scrollbar-width: none;
        }
        .fd-country-bar::-webkit-scrollbar { display: none; }
        .fd-country-chip {
          padding: 6px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          white-space: nowrap;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          color: #444;
          transition: all 0.2s;
          font-weight: 500;
        }
        .fd-country-chip.active {
          border-color: #ee4d2d;
          color: #ee4d2d;
          background: #fff5f3;
        }

        @media (max-width: 768px) {
          .fd-hero-inner { grid-template-columns: 1fr; padding: 0 16px; min-height: auto; }
          .fd-hero-img { display: none; }
          .fd-hero-title { font-size: 34px; }
          .fd-steps-grid { grid-template-columns: 1fr; }
          .fd-app-cta { grid-template-columns: 1fr; border-radius: 16px; }
          .fd-app-cta-right { display: none; }
          .fd-cat-item { flex: 0 0 calc(33% - 14px); }
          .fd-app-cta-left { padding: 32px 24px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .fd-spinner {
          width: 32px; height: 32px;
          border: 3px solid #f0f0f0;
          border-top: 3px solid #ee4d2d;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin: 0 auto 12px;
        }

        .fd-section-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section className="fd-hero">
        <div className="fd-hero-inner">
          <div>
            <div className="fd-hero-badge">🚀 Fast &amp; Fresh</div>
            <h1 className="fd-hero-title">
              Fastest<br />
              Delivery<br />
              <em>in Town</em>
            </h1>
            <p className="fd-hero-desc">
              Craving something delicious? Get your favorite meals delivered fresh and fast to your doorstep. Explore thousands of local favorites.
            </p>

            {/* Search bar */}
            <div className="fd-search-bar">
              <span style={{ fontSize: 16, color: "#ee4d2d" }}>📍</span>
              <input
                placeholder="Enter your delivery address"
                value={globalSearchTerm || ""}
                onChange={(e) => setGlobalSearchTerm && setGlobalSearchTerm(e.target.value)}
              />
              <button className="fd-search-btn">
                🔍 Find Food
              </button>
            </div>

            {/* Social proof */}
            <div className="fd-customers">
              <div className="fd-avatars">
                {["🧑", "👩", "🧑‍🦱"].map((e, i) => (
                  <div key={i} className="fd-avatar">{e}</div>
                ))}
              </div>
              <span><strong>500k+</strong> Happy Customers</span>
            </div>
          </div>

          {/* Right side: food image */}
          <div className="fd-hero-img">
            <img
              src="/banner.png"
              alt="Delicious food"
              className="fd-hero-food-img"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div style={{
              display: "none", width: "100%", maxWidth: 460, height: 320,
              background: "linear-gradient(135deg, #ff9a7c, #ee4d2d)",
              borderRadius: "20px 20px 0 0",
              alignItems: "center", justifyContent: "center", fontSize: 80
            }}>🍔</div>

            {/* Avg time badge */}
            <div className="fd-avg-badge">
              <span className="icon">⏱️</span>
              <div>
                <div className="label">Average Time</div>
                <div className="value">20–30 Mins</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR CATEGORIES ── */}
      <section className="fd-categories">
        <div className="fd-section-wrap">
          <div className="fd-section-header">
            <div>
              <div className="fd-section-title">Popular Categories</div>
              <div className="fd-section-sub">Explore your favorite cuisines</div>
            </div>
            <button className="fd-view-all">View All &rsaquo;</button>
          </div>
          <CategorySectionInline
            onSelectCategory={handleCategorySelect}
            activeCategory={activeCategory}
          />
        </div>
      </section>

      {/* ── FILTERS ── */}
      <div className="fd-section-wrap" style={{ marginBottom: 8 }}>
        <div className="fd-filters">
          <div className="fd-tab-bar">
            {[
              { id: "all-type", label: "Tất cả" },
              { id: "food", label: "🍽️ Đồ Ăn" },
              { id: "drink", label: "🧋 Nước Uống" },
            ].map((t) => (
              <div
                key={t.id}
                className={`fd-tab ${activeType === t.id ? "active" : ""}`}
                onClick={() => {
                  setActiveType(t.id);
                  if (globalSearchTerm && setGlobalSearchTerm) setGlobalSearchTerm("");
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
          <div className="fd-country-bar">
            <span style={{ fontSize: 13, color: "#aaa", alignSelf: "center", marginRight: 4, whiteSpace: "nowrap" }}>Ẩm thực:</span>
            {[
              { id: "all-country", label: "Tất cả" },
              { id: "vietnam", label: "🇻🇳 Việt Nam" },
              { id: "japan", label: "🇯🇵 Nhật Bản" },
              { id: "korea", label: "🇰🇷 Hàn Quốc" },
              { id: "italy", label: "🇮🇹 Ý" },
            ].map((c) => (
              <div
                key={c.id}
                className={`fd-country-chip ${activeCountry === c.id ? "active" : ""}`}
                onClick={() => {
                  setActiveCountry(c.id);
                  if (globalSearchTerm && setGlobalSearchTerm) setGlobalSearchTerm("");
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RESTAURANT LISTINGS ── */}
      <div className="fd-section-wrap">
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
            <div className="fd-spinner" />
            Đang tải nhà hàng...
          </div>
        ) : isDefaultView ? (
          <>
            {/* Flash Deals */}
            {flashSaleRestaurants.length > 0 && (
              <section className="fd-flash" style={{ borderRadius: 16, marginBottom: 8, padding: "30px 0 10px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "0 15px" }}>
                  <div className="fd-flash-title">
                    <span className="fd-flash-icon">⚡</span> Flash Deals
                  </div>
                  <button className="fd-view-all">Xem thêm &rsaquo;</button>
                </div>
                <CarouselSection
                  title=""
                  restaurants={flashSaleRestaurants}
                  navigate={navigate}
                />
              </section>
            )}

            {/* Top Rated */}
            <CarouselSection title="⭐ QUÁN RATING 5 SAO" restaurants={topRatedRestaurants} navigate={navigate} />

            {/* Most Ordered */}
            <CarouselSection title="🏆 ĐẶT NHIỀU NHẤT" restaurants={mostOrderedRestaurants} navigate={navigate} />

            {flashSaleRestaurants.length === 0 && topRatedRestaurants.length === 0 && mostOrderedRestaurants.length === 0 && restaurants.length > 0 && (
              <div>
                <div style={{ fontFamily: "Poppins,sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1a1a1a" }}>Tất cả nhà hàng</div>
                <div className="product-grid">
                  {restaurants.map((r) => <RestaurantCard key={r._id || r.id} restaurant={r} navigate={navigate} />)}
                </div>
              </div>
            )}
          </>
        ) : restaurants.length > 0 ? (
          <>
            <div style={{ fontFamily: "Poppins,sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1a1a1a", borderBottom: "3px solid #ee4d2d", paddingBottom: 10 }}>
              Kết quả tìm kiếm
            </div>
            <div className="product-grid">
              {restaurants.map((r) => <RestaurantCard key={r._id || r.id} restaurant={r} navigate={navigate} />)}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, color: "#aaa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#555", marginBottom: 8 }}>Không tìm thấy nhà hàng phù hợp</div>
            <button
              style={{ marginTop: 12, background: "#ee4d2d", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
              onClick={() => { setActiveType("all-type"); setActiveCountry("all-country"); if (setGlobalSearchTerm) setGlobalSearchTerm(""); }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="fd-steps" style={{ margin: "32px 0 8px 0" }}>
        <div className="fd-section-wrap">
          <div className="fd-steps-title">Simple Steps to Your Meal</div>
          <div className="fd-steps-grid">
            {[
              { icon: "🛍️", title: "Select Your Food", desc: "Browse thousands of restaurants and menus from your area." },
              { icon: "👨‍🍳", title: "Cooked by Professionals", desc: "Our partner restaurants prepare your meal with the freshest ingredients." },
              { icon: "🛵", title: "Fastest Delivery", desc: "Our riders deliver your food warm and fresh to your doorstep." },
            ].map((step, i) => (
              <div key={i}>
                <div className="fd-step-icon-wrap">{step.icon}</div>
                <div className="fd-step-title">{step.title}</div>
                <div className="fd-step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP CTA ── */}
      <div className="fd-section-wrap" style={{ marginTop: 40, marginBottom: 20 }}>
        <div className="fd-app-cta">
          <div className="fd-app-cta-left">
            <div className="fd-app-cta-title">
              Experience the best<br />delivery on our<br />Mobile App
            </div>
            <div className="fd-app-cta-desc">
              Order food anywhere and track your rider in real-time. Get exclusive app-only discounts.
            </div>
            <div className="fd-app-buttons">
              <button className="fd-app-btn">
                <span className="store-icon">🍎</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "#888" }}>DOWNLOAD ON THE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>App Store</div>
                </div>
              </button>
              <button className="fd-app-btn">
                <span className="store-icon">▶️</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "#888" }}>GET IT ON</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Google Play</div>
                </div>
              </button>
            </div>
          </div>
          <div className="fd-app-cta-right">
            <div className="fd-phone-mockup">
              🍔
              <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #ee4d2d, #ff6b3d)", color: "#fff", borderRadius: 20, padding: "6px 20px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                Order Now
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline Category Section (styled for FoodDash) ──
import { useEffect as useEff, useState as useSt } from "react";

const CATEGORY_MAP = {
  'Pizza':    { emoji: '🍕', color: '#FFF3E0', label: 'Pizza' },
  'Burger':   { emoji: '🍔', color: '#FEF9E7', label: 'Burgers' },
  'Sushi':    { emoji: '🍣', color: '#FDE8E8', label: 'Sushi' },
  'Hải sản':  { emoji: '🦐', color: '#E3F2FD', label: 'Seafood' },
  'Salad':    { emoji: '🥗', color: '#E8F5E9', label: 'Salads' },
  'Nướng':    { emoji: '🍖', color: '#FFF3E0', label: 'BBQ' },
  'Phở':      { emoji: '🍜', color: '#FFFDE7', label: 'Noodles' },
  'Hàn Quốc':{ emoji: '🇰🇷', color: '#F3E5F5', label: 'Korean' },
  'Ý':        { emoji: '🍝', color: '#E8F5E9', label: 'Italian' },
};

const FALLBACK_CATS = [
  { id: 'flash-sale', name: 'Sale', emoji: '🔥', color: '#FFE8E0', tag: 'flash-sale' },
  { id: '2', name: 'Pizza', emoji: '🍕', color: '#FFF3E0', tag: 'Pizza' },
  { id: '3', name: 'Burgers', emoji: '🍔', color: '#FEF9E7', tag: 'Burger' },
  { id: '4', name: 'Sushi', emoji: '🍣', color: '#FDE8E8', tag: 'Sushi' },
  { id: '5', name: 'Salads', emoji: '🥗', color: '#E8F5E9', tag: 'Salad' },
  { id: '6', name: 'Noodles', emoji: '🍜', color: '#FFFDE7', tag: 'Phở' },
];

function CategorySectionInline({ onSelectCategory, activeCategory }) {
  const [categories, useCats] = useSt(FALLBACK_CATS);

  useEff(() => {
    getAllRestaurants({ limit: 500 }).then(data => {
      const list = Array.isArray(data) ? data : data.restaurants || [];
      const tagsSet = new Set();
      list.forEach(r => (r.tags || []).forEach(t => { if (CATEGORY_MAP[t]) tagsSet.add(t); }));
      const cats = [
        { id: 'flash-sale', name: 'Sale', emoji: '🔥', color: '#FFE8E0', tag: 'flash-sale' },
        ...Array.from(tagsSet).map((tag, i) => ({
          id: `cat-${i}`, name: CATEGORY_MAP[tag].label || tag,
          emoji: CATEGORY_MAP[tag].emoji, color: CATEGORY_MAP[tag].color, tag,
        }))
      ];
      useCats(cats.slice(0, 8));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {categories.map(cat => {
        const isActive = activeCategory === cat.tag;
        return (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.tag)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 10, cursor: "pointer", flex: "0 0 auto",
              minWidth: 72, transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: cat.color, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 30, transition: "all 0.2s",
              boxShadow: isActive ? "0 6px 16px rgba(238,77,45,0.25)" : "0 2px 10px rgba(0,0,0,0.07)",
              border: isActive ? "2.5px solid #ee4d2d" : "2px solid transparent",
            }}>
              {cat.emoji}
            </div>
            <span style={{
              fontSize: 13, fontWeight: isActive ? 700 : 500,
              color: isActive ? "#ee4d2d" : "#444", textAlign: "center",
            }}>
              {cat.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default HomePage;
