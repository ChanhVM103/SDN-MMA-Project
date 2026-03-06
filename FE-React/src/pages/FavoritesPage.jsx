import EmptyStateCard from "../components/common/EmptyStateCard";
import { demoFavorites } from "../constants/app-data";

function FavoritesPage({ user, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <EmptyStateCard
          title="Bạn chưa đăng nhập"
          description="Tab Đã thích sẽ lưu món ăn ưa thích khi đăng nhập."
          actionLabel="Đăng nhập ngay"
          onAction={() => navigate("/sign-in")}
        />
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel">
        <header className="section-head">
          <h2>Đã thích</h2>
          <p>Danh sách món bạn hay đặt.</p>
        </header>
        <div className="compact-list">
          {demoFavorites.map((item) => (
            <article key={item.id} className="list-card">
              <div>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </div>
              <button type="button">Đặt lại</button>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export default FavoritesPage;
