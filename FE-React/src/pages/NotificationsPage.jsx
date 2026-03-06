import EmptyStateCard from "../components/common/EmptyStateCard";
import { demoNotifications } from "../constants/app-data";

function NotificationsPage({ user, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <EmptyStateCard
          title="Thông báo cá nhân"
          description="Vui lòng đăng nhập để nhận thông báo về đơn hàng và ưu đãi."
          actionLabel="Đăng nhập"
          onAction={() => navigate("/sign-in")}
        />
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel">
        <header className="section-head">
          <h2>Thông báo</h2>
          <p>Cập nhật tình trạng đơn và khuyến mãi mới.</p>
        </header>
        <div className="compact-list">
          {demoNotifications.map((item) => (
            <article key={item.id} className="list-card">
              <div>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export default NotificationsPage;
