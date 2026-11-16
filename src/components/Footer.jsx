import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-section">
          <h2 className="footer-logo">
            Flip<span>Zone</span>
          </h2>

          <p>
            Discover amazing products at great prices.
            Shop smarter with FlipZone.
          </p>

          <div className="footer-social">
            <a href="https://facebook.com" aria-label="Facebook">
              <Facebook size={24} />
            </a>

            <a href="https://instagram.com" aria-label="Instagram">
              <Instagram size={24} />
            </a>

            <a href="https://twitter.com" aria-label="Twitter">
              <Twitter size={24} />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/products">Shop Products</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/orders">My Orders</Link>
        </div>

        <div className="footer-section">
          <h3>My Account</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/orders">Order History</Link>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>

          <p><Mail size={19} /> support@flipzone.com</p>
          <p><Phone size={19} /> +91 98765 43210</p>
          <p><MapPin size={19} /> India</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} FlipZone.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}