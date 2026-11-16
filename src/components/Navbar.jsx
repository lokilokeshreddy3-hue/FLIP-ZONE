import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, UserRound, LogOut, Menu } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar({ onSearch }) {
  const { count } = useCart(); const { user, logout } = useAuth();
  const [query, setQuery] = useState(""); const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  function submit(e) { e.preventDefault(); onSearch?.(query); navigate("/products"); setOpen(false); }
  return <header className="navbar"><div className="nav-inner">
    <Link to="/" className="brand"><span className="brand-mark">F</span> Flip<span>Zone</span></Link>
    <form className="search" onSubmit={submit}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search for products, brands and more"/><button>Search</button></form>
    <button className="mobile-menu icon-btn" onClick={()=>setOpen(!open)} aria-label="Toggle menu"><Menu/></button>
    <nav className={open ? "nav-links show" : "nav-links"}>
      <NavLink to="/products">Shop</NavLink>
      {user ? <><NavLink to="/orders">My orders</NavLink><button className="text-btn" onClick={logout}><LogOut size={16}/> Logout</button></> : <NavLink to="/login"><UserRound size={17}/> Login</NavLink>}
      <Link className="cart-link" to="/cart"><ShoppingBag size={19}/> Cart <b>{count}</b></Link>
    </nav>
  </div></header>;
}