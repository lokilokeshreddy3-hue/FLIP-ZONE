import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useState } from "react";
import { Footer } from "./Footer";
export default function Layout() {
  const [search, setSearch] = useState("");
  return <><Navbar onSearch={setSearch}/><main className="page-shell"><Outlet context={{ search }}/></main><Footer/></>;
}