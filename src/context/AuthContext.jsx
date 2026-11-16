import React, { createContext, useContext, useState } from "react";
import { authApi } from "../api/services";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("flipzone_user")) || null;
    } catch {
      return null;
    }
  });

  // LOGIN
  async function login(email, password) {
    const { data } = await authApi.login({
      email,
      password,
    });

    if (!data.access_token) {
      throw new Error("Login successful, but no access token was returned.");
    }

    localStorage.setItem("flipzone_token", data.access_token);

    if (data.user) {
      localStorage.setItem("flipzone_user", JSON.stringify(data.user));
      setUser(data.user);
    }

    return data.user;
  }

  // REGISTER
  async function register(name, email, password) {
    const { data } = await authApi.register({
      name,
      email,
      password,
    });

    if (data.access_token) {
      localStorage.setItem("flipzone_token", data.access_token);
    }

    if (data.user) {
      localStorage.setItem("flipzone_user", JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem("flipzone_token");
    localStorage.removeItem("flipzone_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}