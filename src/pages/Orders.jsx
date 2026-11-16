import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { orderApi } from "../api/services";
import { Eye, Package } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const createdOrderId = searchParams.get("created");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await orderApi.list();
      const orderData = response.data.items || response.data;

      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Could not load orders. Please sign in and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section className="section">
      <span className="eyebrow">YOUR PURCHASES</span>
      <h1>My orders</h1>

      {createdOrderId && (
        <div className="stock">
          Your order #{createdOrderId} was placed successfully!
        </div>
      )}

      {loading && <p>Loading orders...</p>}

      {!loading && error && (
        <div className="empty-state">
          <h2>Unable to load orders</h2>
          <p className="form-error" role="alert">{error}</p>

          <button
            className="primary-btn"
            type="button"
            onClick={fetchOrders}
          >
            Try again
          </button>

          <p><Link to="/login">Login</Link></p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <b>Order #{order.id}</b>
                <p className="muted">{formatDate(order.created_at)}</p>
              </div>

              <span className="status">
                {order.status}
              </span>

              <strong>
                ₹{Number(order.total || 0).toLocaleString("en-IN")}
              </strong>

              <Link
                to={`/orders/${order.id}`}
                className="order-details-link"
              >
                <Eye size={16} />
                View Details
              </Link>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <Package size={42} />
          <h2>No orders yet</h2>
          <p className="muted">
            Your placed orders will appear here.
          </p>

          <Link className="primary-btn" to="/products">
            Start shopping
          </Link>
        </div>
      )}
    </section>
  );
}