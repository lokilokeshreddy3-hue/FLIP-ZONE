import { useEffect, useMemo, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { productApi } from "../api/services";

export default function Products() {
  const { search = "" } = useOutletContext() || {};
  const location = useLocation();

  const initialCategory =
    new URLSearchParams(location.search).get("category") || "All";

  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Update category when the URL changes
  useEffect(() => {
    const urlCategory =
      new URLSearchParams(location.search).get("category") || "All";

    setCategory(urlCategory);
  }, [location.search]);

  // Fetch products from FastAPI
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page: 1,
          limit: 12,
        };

        if (category !== "All") {
          params.category = category;
        }

        if (search.trim()) {
          params.q = search.trim();
        }

        const response = await productApi.list(params);

        if (!cancelled) {
          setProducts(response.data.items || []);
        }
      } catch (err) {
        console.error("Products API error:", err);

        if (!cancelled) {
          setError("Unable to load products. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [category, search]);

  // Sort products
  const filtered = useMemo(() => {
    const list = [...products];

    if (sort === "low") {
      list.sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      list.sort((a, b) => b.price - a.price);
    }

    if (sort === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [products, sort]);

  return (
    <section className="section products-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE FLIP ZONE COLLECTION</span>

          <h1>All products</h1>

          <p className="muted">
            {loading
              ? "Loading products..."
              : `${filtered.length} products found`}
          </p>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="featured">Featured</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {/* Category Filters */}
      <div className="filter-row">
        {["All", "Electronics", "Fashion", "Home", "Beauty"].map((c) => (
          <button
            key={c}
            className={category === c ? "filter active" : "filter"}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="empty-state">
          Loading products...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="empty-state">
          <p>{error}</p>

          <button onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          No products match your search.
        </div>
      )}
    </section>
  );
}