import api from "./client";

// Expected backend routes are documented in API_REQUIREMENTS.md.
export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me")
};
export const productApi = {
  list: (params = {}) => api.get("/products", { params }),
  detail: (id) => api.get(`/products/${id}`)
};
export const cartApi = {
  get: () => api.get("/cart"),
  add: (productId, quantity = 1) => api.post("/cart/items", { product_id: productId, quantity }),
  update: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`)
};
export const orderApi = {
  checkout: (payload) => api.post("/orders", payload),
  list: () => api.get("/orders"),
  detail: (id) => api.get(`/orders/${id}`)
};