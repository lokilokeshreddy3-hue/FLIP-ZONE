import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orderApi } from "../api/services";
import {
  ArrowLeft,
  Package,
  MapPin,
  CalendarDays,
  CreditCard,
} from "lucide-react";

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError("");

      try {
        const response = await orderApi.detail(id);

        // Supports either a direct order response or { order: ... }
        setOrder(response.data.order || response.data);
      } catch (err) {
        const detail = err.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getAddress(address) {
    if (!address) return null;

    if (typeof address === "string") {
      try {
        return JSON.parse(address);
      } catch {
        return { address };
      }
    }

    return address;
  }

  if (loading) {
    return (
      <section className="section">
        <p>Loading order details...</p>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="section">
        <div className="empty-state">
          <h2>Order not found</h2>
          <p className="form-error" role="alert">
            {error || "This order could not be found."}
          </p>

          <Link to="/orders" className="primary-btn">
            Back to My Orders
          </Link>
        </div>
      </section>
    );
  }

  const address = getAddress(order.shipping_address);
  const items = order.items || [];

  return (
    <section className="section order-details-page">
      <Link to="/orders" className="back-link">
        <ArrowLeft size={17} />
        Back to My Orders
      </Link>

      <div className="order-details-heading">
        <div>
          <span className="eyebrow">ORDER INFORMATION</span>
          <h1>Order #{order.id}</h1>
          <p className="muted">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        <span className="status">
          {order.status}
        </span>
      </div>

      <div className="order-details-grid">
        <div className="order-main-column">
          <div className="detail-card">
            <h2>
              <Package size={20} />
              Ordered Products
            </h2>

            {items.length === 0 ? (
              <p className="muted">No product details available.</p>
            ) : (
              <div className="ordered-items">
                {items.map((item, index) => {
                  const name =
                    item.product_name ||
                    item.name ||
                    item.product?.name ||
                    `Product ${item.product_id || ""}`;

                  const price = Number(
                    item.unit_price ??
                    item.price ??
                    item.product?.price ??
                    0
                  );

                  const quantity = Number(item.quantity || 1);

                  const lineTotal = Number(
                    item.line_total ??
                    item.subtotal ??
                    price * quantity
                  );

                  return (
                    <div className="ordered-item" key={item.id || index}>
                      <div className="ordered-item-info">
                        <b>{name}</b>
                        <p className="muted">
                          ₹{price.toLocaleString("en-IN")} × {quantity}
                        </p>
                      </div>

                      <strong>
                        ₹{lineTotal.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="detail-card">
            <h2>
              <MapPin size={20} />
              Shipping Address
            </h2>

            {address ? (
              <div className="shipping-address">
                {address.full_name && <b>{address.full_name}</b>}
                {address.phone && <p>{address.phone}</p>}
                {address.address && <p>{address.address}</p>}
                {address.city && <p>{address.city}</p>}
                {address.postal_code && <p>{address.postal_code}</p>}
              </div>
            ) : (
              <p className="muted">Shipping address unavailable.</p>
            )}
          </div>
        </div>

        <aside className="order-side-column">
          <div className="detail-card">
            <h2>
              <CreditCard size={20} />
              Payment Summary
            </h2>

            <div className="price-row">
              <span>Subtotal</span>
              <span>
                ₹{Number(order.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="price-row">
              <span>Shipping</span>
              <span>
                ₹{Number(order.shipping_fee || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="price-row total-row">
              <strong>Total</strong>
              <strong>
                ₹{Number(order.total || 0).toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <div className="detail-card">
            <h2>
              <CalendarDays size={20} />
              Order Status
            </h2>

            <span className="status">
              {order.status}
            </span>

            <p className="muted">
              Order ID: #{order.id}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}