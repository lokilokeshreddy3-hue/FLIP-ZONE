import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Headphones,
} from "lucide-react";

import ProductCard from "../components/ProductCard";
import { productApi } from "../api/services";

const categories = [
  { name: "Electronics", icon: "🎧" },
  { name: "Fashion", icon: "👟" },
  { name: "Home", icon: "🏡" },
  { name: "Beauty", icon: "✨" },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await productApi.list({ page: 1, limit: 8 });

        setProducts(response.data.items || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Unable to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            THE EVERYDAY SHOPPING DESTINATION
          </span>

          <h1>
            Find your next
            <br />
            <em>favourite thing.</em>
          </h1>

          <p>
            Good products, great prices and a smoother way to shop.
            Discover something you'll love today.
          </p>

          <Link to="/products" className="primary-btn">
            Explore products <ArrowRight size={18} />
          </Link>
        </div>

        <div className="hero-art">
          <div className="hero-orbit">🛍️</div>
          <span className="float f1">🎧</span>
          <span className="float f2">⌚</span>
          <span className="float f3">👟</span>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div>
          <Truck />
          <span>
            <b>Quick delivery</b>
            <small>To your doorstep</small>
          </span>
        </div>

        <div>
          <ShieldCheck />
          <span>
            <b>Secure shopping</b>
            <small>Protected checkout</small>
          </span>
        </div>

        <div>
          <Headphones />
          <span>
            <b>Here to help</b>
            <small>Customer support</small>
          </span>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BROWSE BY INTEREST</span>
            <h2>Shop categories</h2>
          </div>

          <Link to="/products" className="see-all">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/products?category=${category.name}`}
              className="category-card"
            >
              <span>{category.icon}</span>
              <b>{category.name}</b>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HANDPICKED FOR YOU</span>
            <h2>Featured products</h2>
          </div>

          <Link to="/products" className="see-all">
            Shop all <ArrowRight size={16} />
          </Link>
        </div>

        {loading && (
          <p>Loading products...</p>
        )}

        {error && (
          <div>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p>No products available right now.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}