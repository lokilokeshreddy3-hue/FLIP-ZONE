import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "../context/CartContext";

const productImages = {
  1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85",
  2: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85",
  3: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85",
  4: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",
  5: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85",
  6: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=85",
  7: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=85",
  8: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85",
};

export default function ProductCard({ product }) {
  const { add } = useCart();

  const imageUrl = product.image_url || productImages[product.id];
  const oldPrice = product.oldPrice ?? product.old_price;

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await add(product);
    } catch (error) {
      console.error("Unable to add product to cart:", error);
      alert("Please log in before adding products to your cart.");
    }
  };

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.id}`}
        className="product-image"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}

        <span
          className="image-fallback"
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          {product.emoji || "🛍️"}
        </span>

        {product.badge && (
          <small className="product-badge">
            {product.badge}
          </small>
        )}
      </Link>

      <div className="product-info">
        <p className="muted">{product.category}</p>

        <Link
          to={`/products/${product.id}`}
          className="product-name"
        >
          {product.name}
        </Link>

        <div className="rating">
          <Star size={14} fill="currentColor" />
          {product.rating || "New"}
        </div>

        <div className="price-row">
          <strong>
            ₹{Number(product.price).toLocaleString("en-IN")}
          </strong>

          {oldPrice && (
            <del>
              ₹{Number(oldPrice).toLocaleString("en-IN")}
            </del>
          )}
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <ShoppingCart size={16} />
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </article>
  );
}