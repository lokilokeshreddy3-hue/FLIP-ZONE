import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { cartApi } from "../api/services";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch cart from backend
  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await cartApi.get();

      const cartItems = response.data.items || [];

      setItems(cartItems);
      setTotal(Number(response.data.subtotal || 0));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load your cart."
      );

      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load cart whenever the user logs in or changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Add product to backend cart
  const add = async (product, quantity = 1) => {
    if (!user) {
      throw new Error("Please log in to add products to your cart.");
    }

    if (!product?.id) {
      throw new Error("Invalid product.");
    }

    if (quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    setError("");

    try {
      await cartApi.add(product.id, quantity);
      await refresh();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to add product to cart.";

      setError(message);
      throw new Error(message);
    }
  };

  // Update cart item quantity
  const update = async (id, quantity) => {
    if (!user) {
      throw new Error("Please log in to update your cart.");
    }

    if (quantity < 1) {
      return remove(id);
    }

    setError("");

    try {
      await cartApi.update(id, quantity);
      await refresh();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Unable to update cart quantity.";

      setError(message);
      throw new Error(message);
    }
  };

  // Remove cart item
  const remove = async (id) => {
    if (!user) {
      throw new Error("Please log in to manage your cart.");
    }

    setError("");

    try {
      await cartApi.remove(id);
      await refresh();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Unable to remove product from cart.";

      setError(message);
      throw new Error(message);
    }
  };

  // Clear all cart items
  const clear = async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      return;
    }

    setError("");

    try {
      await Promise.all(
        items.map((item) => cartApi.remove(item.id))
      );

      setItems([]);
      setTotal(0);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Unable to clear your cart.";

      setError(message);
      await refresh();
      throw new Error(message);
    }
  };

  // Calculate total number of products
  const count = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        loading,
        error,
        add,
        update,
        remove,
        clear,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}