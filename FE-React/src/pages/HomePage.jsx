import { useState } from "react";
import { categories, dishes, promoBlocks } from "../constants/app-data";

function HomePage({ user, navigate }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredDishes =
    activeCategory === "all"
      ? dishes
      : dishes.filter((dish) => dish.category === activeCategory);

  return (
    <section className="screen">
      <article className="hero">
        <p className="eyebrow">Nền tảng giao đồ ăn</p>
        <h1>Xin chào {user ? user.fullName : "thực khách"}.</h1>
        <p>
          Bản web React đã được xây theo mẫu FE: gradient hero, card menu, tabbar dưới, auth flow
          và profile state.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" type="button" onClick={() => navigate("/orders")}>
            Đặt món ngay
          </button>
          <button
            className="ghost-btn alt"
            type="button"
            onClick={() => navigate(user ? "/profile" : "/sign-in")}
          >
            {user ? "Xem hồ sơ" : "Đăng nhập để đặt nhanh"}
          </button>
        </div>
        <div className="hero-metrics">
          <article>
            <span>4.9</span>
            <p>Đánh giá trung bình</p>
          </article>
          <article>
            <span>18p</span>
            <p>Thời gian giao</p>
          </article>
          <article>
            <span>130+</span>
            <p>Nhà hàng đối tác</p>
          </article>
        </div>
      </article>

      <article className="panel">
        <header className="section-head">
          <h2>Món nổi bật</h2>
          <p>Lọc theo danh mục giống FE home.</p>
        </header>

        <div className="chips">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${activeCategory === category.id ? "active" : ""}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="dish-grid">
          {filteredDishes.map((dish) => (
            <article key={dish.id} className={`dish-card ${dish.tone}`}>
              <span className="badge">{dish.badge}</span>
              <h3>{dish.name}</h3>
              <div className="dish-meta">
                <span>{dish.rating} sao</span>
                <span>{dish.eta}</span>
              </div>
              <div className="dish-footer">
                <strong>{dish.price}</strong>
                <button type="button">Thêm</button>
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="panel">
        <header className="section-head">
          <h2>Ưu đãi nhanh</h2>
          <p>Khối ưu đãi theo concept FE.</p>
        </header>
        <div className="promo-grid">
          {promoBlocks.map((promo) => (
            <article key={promo.id} className={`promo-card ${promo.tone}`}>
              <h3>{promo.title}</h3>
              <p>{promo.body}</p>
              <button type="button">Nhận ưu đãi</button>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export default HomePage;
