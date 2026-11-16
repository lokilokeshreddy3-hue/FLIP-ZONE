import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const {
    items,
    total,
    loading,
    error,
    update,
    remove,
  } = useCart();

  const [actionError, setActionError] = useState("");
  const [busyItem, setBusyItem] = useState(null);

  // Update product quantity
  const handleUpdate = async (itemId, quantity) => {
    setActionError("");
    setBusyItem(itemId);

    try {
      await update(itemId, quantity);
    } catch (err) {
      setActionError(err.message || "Unable to update quantity.");
    } finally {
      setBusyItem(null);
    }
  };

  // Remove product
  const handleRemove = async (itemId) => {
    setActionError("");
    setBusyItem(itemId);

    try {
      await remove(itemId);
    } catch (err) {
      setActionError(err.message || "Unable to remove product.");
    } finally {
      setBusyItem(null);
    }
  };

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="empty-state">
        <h2>Loading your cart...</h2>
        <p className="muted">Please wait.</p>
      </div>
    );
  }

  // Empty cart
  if (!items.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🛍️</div>
        <h1>Your cart is waiting</h1>
        <p className="muted">
          Add a few things you love.
        </p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <Link className="primary-btn" to="/products">
          Explore products
        </Link>
      </div>
    );
  }

  return (
    <section className="section">
      <span className="eyebrow">READY WHEN YOU ARE</span>

      <h1>Your cart</h1>

      {(actionError || error) && (
        <p className="form-error" role="alert">
          {actionError || error}
        </p>
      )}

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div className="cart-item" key={item.id}>
              <div className="cart-emoji">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  item.emoji || "🛍️"
                )}
              </div>

              <div className="cart-item-info">
                <b>{item.name}</b>

                <small>{item.category}</small>

                <strong>
                  ₹{Number(item.price).toLocaleString("en-IN")}
                </strong>

                <div className="quantity">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate(item.id, item.quantity - 1)
                    }
                    disabled={busyItem === item.id}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate(item.id, item.quantity + 1)
                    }
                    disabled={busyItem === item.id}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemove(item.id)}
                disabled={busyItem === item.id}
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h3>Order summary</h3>

          <div>
            <span>Subtotal</span>
            <b>
              ₹{Number(total).toLocaleString("en-IN")}
            </b>
          </div>

          <div>
            <span>Delivery</span>
            <b className="stock">Free</b>
          </div>

          <hr />

          <div className="summary-total">
            <span>Total</span>
            <b>
              ₹{Number(total).toLocaleString("en-IN")}
            </b>
          </div>

          <Link to="/checkout" className="primary-btn full">
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}