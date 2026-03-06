import EmptyStateCard from "../components/common/EmptyStateCard";
import { demoOrders } from "../constants/app-data";

function OrdersPage({ user, navigate }) {
  if (!user) {
    return (
      <section className="screen">
        <EmptyStateCard
          title="Đăng nhập để xem đơn hàng"
          description="Trang này giống tab Đơn hàng trong FE và cần tài khoản để đồng bộ."
          actionLabel="Đi đến Đăng nhập"
          onAction={() => navigate("/sign-in")}
        />
      </section>
    );
  }

  return (
    <section className="screen">
      <article className="panel">
        <header className="section-head">
          <h2>Đơn hàng của bạn</h2>
          <p>Theo dõi trạng thái giao hàng theo thời gian thực.</p>
        </header>
        <div className="compact-list">
          {demoOrders.map((order) => (
            <article key={order.id} className="list-card">
              <div>
                <h3>{order.id}</h3>
                <p>{order.title}</p>
              </div>
              <div className="meta-right">
                <span className={`status ${order.status === "Đang giao" ? "live" : ""}`}>
                  {order.status}
                </span>
                <strong>{order.total}</strong>
                <small>{order.time}</small>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export default OrdersPage;
