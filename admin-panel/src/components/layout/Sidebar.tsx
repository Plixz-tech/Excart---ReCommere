
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserRound,
  Truck,
  ClipboardCheck,
  Package,
  Smartphone,
  ChartNoAxesCombined,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", path: "/orders", icon: ShoppingCart },
  { label: "Users", path: "/users", icon: Users },
  { label: "Agents", path: "/agents", icon: UserRound },
  { label: "Pickup Management", path: "/pickups", icon: Truck },
  { label: "Inspections", path: "/inspections", icon: ClipboardCheck },
  { label: "Inventory Management", path: "/inventory", icon: Package },
  { label: "Device Catalog", path: "/catalog", icon: Smartphone },
  { label: "Reports & Analytics", path: "/reports", icon: ChartNoAxesCombined },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("admin");

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("admin");

    navigate("/login", { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-white/5 bg-[#222222] text-white lg:flex">
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center border-b border-white/10 px-5">
        <div className="flex items-center gap-2.5">
          <img
            src="https://res.cloudinary.com/nh9o1pkq/image/upload/Excart_Logo.png"
            alt="ExCart"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-2xl font-extrabold tracking-tight">
            E<span className="text-orange-500">x</span>Cart
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-stone-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={20} strokeWidth={1.9} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Admin profile and logout */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold">
            SA
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Super Admin</p>
            <p className="truncate text-xs text-stone-400">
              admin@excart.app
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500/40 px-3 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
