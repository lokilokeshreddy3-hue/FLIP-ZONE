import { Link } from "react-router-dom";
export default function NotFound(){return <div className="empty-state"><h1>404 — Page not found</h1><Link to="/" className="primary-btn">Go home</Link></div>}