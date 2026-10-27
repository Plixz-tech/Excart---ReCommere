import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders",
  "/users": "Users",
  "/agents": "Agents",
  "/pickups": "Pickup Management",
  "/inspections": "Inspections",
  "/inventory": "Inventory Management",
  "/catalog": "Device Catalog",
  "/catalog/brands": "Brands",
  "/catalog/models": "Models",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

export default function AdminLayout() {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const title = pageTitles[location.pathname] ?? "Admin Portal";

  return (
    <div className="min-h-screen bg-[#f6f6f5]">
      {/* Fixed desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transition-transform duration-200 lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <Sidebar />

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute right-3 top-5 z-[60] rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen lg:ml-[240px]">
        <Header
          title={title}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="min-w-0 p-4 sm:p-6 xl:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}