import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { productApi } from "../api/services";

const productImages = {
  1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  2: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
  3: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  4: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
  5: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
  6: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
  7: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
  8: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
};

export default function ProductDetails() {
  const { id } = useParams();
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setQuantity(1);

        const response = await productApi.detail(id);

        if (!cancelled) {
          setProduct(response.data);
        }
      } catch (err) {
        console.error("Product details API error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load product details. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;

    try {
      setAdding(true);
      setMessage("");

      await add(product, quantity);

      setMessage("Product added to your cart successfully!");
    } catch (err) {
      console.error("Add to cart failed:", err);

      setMessage(
        err.response?.data?.detail ||
          "Please log in before adding products to your cart."
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        Loading product details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>Unable to load product</h2>
        <p>{error}</p>
        <Link to="/products">Browse products</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state">
        <h2>Product not found</h2>
        <Link to="/products">Browse products</Link>
      </div>
    );
  }

  const oldPrice = product.old_price ?? product.oldPrice;
  const imageUrl = product.image_url || productImages[product.id];

  return (
    <section className="detail-page">
      <div className="detail-layout">
        {/* Product Image */}
        <div className="detail-image">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement.textContent =
                  product.emoji || "🛍️";
              }}
            />
          ) : (
            <span>{product.emoji || "🛍️"}</span>
          )}
        </div>

        {/* Selected Product Information */}
        <div className="detail-copy">
          <Link to="/products" className="muted">
            ← Back to products
          </Link>

          <span className="eyebrow">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          <div className="rating">
            ★ {product.rating || "New"} / 5
          </div>

          <div className="detail-price">
            ₹{Number(product.price).toLocaleString("en-IN")}

            {oldPrice && (
              <del>
                ₹{Number(oldPrice).toLocaleString("en-IN")}
              </del>
            )}
          </div>

          <p className="detail-description">
            {product.description ||
              "A quality product selected for your everyday needs."}
          </p>

          <p className="stock">
            {product.stock > 0
              ? `● ${product.stock} items available`
              : "● Currently out of stock"}
          </p>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="detail-quantity">
              <span>Quantity:</span>

              <div className="quantity-control">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((previous) =>
                      Math.max(1, previous - 1)
                    )
                  }
                  disabled={quantity <= 1}
                >
                  −
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((previous) =>
                      Math.min(product.stock, previous + 1)
                    )
                  }
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <button
            className="primary-btn"
            onClick={handleAddToCart}
            disabled={adding || product.stock <= 0}
          >
            {adding
              ? "Adding..."
              : product.stock > 0
                ? "Add to Cart"
                : "Out of Stock"}
          </button>

          {message && (
            <p className="detail-message">
              {message}
            </p>
          )}

          <p className="muted">
            Free delivery on eligible orders · Secure checkout
          </p>
        </div>
      </div>
    </section>
  );
}