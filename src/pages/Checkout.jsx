import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { orderApi } from "../api/services";

export default function Checkout() {
  const {
    items,
    total,
    refresh,
  } = useCart();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  // Handle form changes
  const change = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Place order
  async function submit(e) {
    e.preventDefault();

    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    // Validate shipping information
    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.postal_code.trim()
    ) {
      setError("Please fill in all delivery details.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        shipping_address: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
        },

        // Send actual product IDs, not cart item IDs
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      const { data } = await orderApi.checkout(payload);

      // Backend clears the cart after successful checkout.
      // Refresh frontend cart state to reflect that.
      await refresh();

      // Navigate to order history
      navigate(`/orders?created=${data.id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to place your order. Please check your details and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  // Empty cart
  if (!items.length) {
    return (
      <div className="empty-state">
        <h2>Your cart is empty</h2>

        <p className="muted">
          Add products before proceeding to checkout.
        </p>

        <Link className="primary-btn" to="/products">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">ALMOST THERE</span>

        <h1>Checkout</h1>

        <p className="muted">
          Delivery information
        </p>

        <label>
          Full name
          <input
            name="full_name"
            type="text"
            value={form.full_name}
            onChange={change}
            required
            autoComplete="name"
            placeholder="Enter your full name"
          />
        </label>

        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={change}
            required
            autoComplete="tel"
            placeholder="Enter your phone number"
          />
        </label>

        <label>
          Street address
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={change}
            required
            autoComplete="street-address"
            placeholder="Enter your delivery address"
          />
        </label>

        <label>
          City
          <input
            name="city"
            type="text"
            value={form.city}
            onChange={change}
            required
            autoComplete="address-level2"
            placeholder="Enter your city"
          />
        </label>

        <label>
          Postal code
          <input
            name="postal_code"
            type="text"
            value={form.postal_code}
            onChange={change}
            required
            autoComplete="postal-code"
            placeholder="Enter postal code"
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="primary-btn full"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Placing order..."
            : `Place order · ₹${Number(total).toLocaleString("en-IN")}`}
        </button>
      </form>

      <aside className="summary">
        <h3>Your items</h3>

        {items.map((item) => (
          <div key={item.id}>
            <span>
              {item.name} × {item.quantity}
            </span>

            <b>
              ₹
              {Number(
                item.line_total ??
                  item.price * item.quantity
              ).toLocaleString("en-IN")}
            </b>
          </div>
        ))}

        <hr />

        <div className="summary-total">
          <span>Total</span>

          <b>
            ₹{Number(total).toLocaleString("en-IN")}
          </b>
        </div>
      </aside>
    </div>
  );
}