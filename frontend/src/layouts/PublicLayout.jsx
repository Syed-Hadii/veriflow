import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-(--bg) text-(--text)">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.18),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-size-[64px_64px] opacity-20" />

      <Navbar />
      <main id="top">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
