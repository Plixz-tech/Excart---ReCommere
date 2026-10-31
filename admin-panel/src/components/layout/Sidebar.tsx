import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  ChevronDown,
  Tags,
  Layers3,
  List,
  CreditCard,
  Headset,
  MapPinned,
  Wallet,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", path: "/orders", icon: ShoppingCart },
  { label: "Users", path: "/users", icon: Users },
  { label: "Agents", path: "/agents", icon: UserRound },
  { label: "Pickup Management", path: "/pickups", icon: Truck },
  { label: "Inspections", path: "/inspections", icon: ClipboardCheck },
  { label: "Inventory Management", path: "/inventory", icon: Package },
  { label: "Support Tickets", path: "/tickets", icon: Headset },
  { label: "Agent Earnings & Payouts", path: "/commissions", icon: Wallet },
  { label: "Payments & Transactions", path: "/payments", icon: CreditCard },
  { label: "Service Areas", path: "/service-areas", icon: MapPinned },
  { label: "Reports & Analytics", path: "/reports", icon: ChartNoAxesCombined },
  { label: "Settings", path: "/settings", icon: Settings },
];

const catalogLinks = [
  { label: "Brands", path: "/catalog/brands", icon: Tags },
  { label: "Models", path: "/catalog/models", icon: Layers3 },
  { label: "Catalog", path: "/catalog", icon: List },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isCatalogRoute = location.pathname.startsWith("/catalog");
  const [catalogOpen, setCatalogOpen] = useState(isCatalogRoute);

  useEffect(() => {
    if (isCatalogRoute) setCatalogOpen(true);
  }, [isCatalogRoute]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("admin");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("admin");
    navigate("/login", { replace: true });
  };

  const linkClass = (isActive: boolean) =>
    [
      "group relative flex min-h-[43px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5",
      "text-left text-[13.5px] font-medium tracking-[-0.01em]",
      "transition-[background-color,color,box-shadow,transform] duration-200 ease-out",
      isActive
        ? "bg-orange-500 text-white shadow-[0_5px_14px_rgba(249,115,22,0.20)] before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-[3px] before:rounded-r-full before:bg-white"
        : "text-white/75 hover:bg-white/[0.07] hover:text-white active:scale-[0.99]",
    ].join(" ");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col overflow-hidden border-r border-white/[0.07] bg-[#202020] text-white lg:flex">
      {/* Brand header */}
      <div className="flex h-[74px] shrink-0 items-center border-b border-white/[0.08] px-5">
        <div className="flex items-center gap-3">
          <img
            src="https://res.cloudinary.com/nh9o1pkq/image/upload/Excart_Logo.png"
            alt="ExCart"
            className="h-9 w-9 shrink-0 rounded-xl object-contain"
          />
          <span className="text-[23px] font-extrabold tracking-[-0.045em] text-white">
            E<span className="text-orange-500">x</span>Cart
          </span>
        </div>
      </div>

      {/* Navigation: hidden scrollbar, scroll remains available if content exceeds viewport */}
      <nav
        aria-label="Main navigation"
        className="sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        <div className="space-y-1">
          {navigation.slice(0, 7).map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => linkClass(isActive)}
            >
              <Icon
                size={18}
                strokeWidth={1.85}
                className={`shrink-0 transition-colors ${
                  location.pathname === path ? "text-white" : "text-white/55 group-hover:text-white/90"
                }`}
              />
              <span className="min-w-0 flex-1">{label}</span>
            </NavLink>
          ))}

          {/* Device Catalog parent */}
          <button
            type="button"
            onClick={() => {
              setCatalogOpen((open) => !open);
              if (!isCatalogRoute) navigate("/catalog");
            }}
            aria-expanded={catalogOpen}
            aria-controls="device-catalog-submenu"
            className={linkClass(isCatalogRoute)}
          >
            <Smartphone
              size={18}
              strokeWidth={1.85}
              className={`shrink-0 ${isCatalogRoute ? "text-white" : "text-white/55"}`}
            />
            <span className="min-w-0 flex-1 text-[13.5px] font-medium tracking-[-0.01em]">
              Device Catalog
            </span>
            <ChevronDown
              size={15}
              strokeWidth={2}
              className={`shrink-0 text-white/65 transition-transform duration-200 ease-out ${
                catalogOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Smooth submenu */}
          <div
            id="device-catalog-submenu"
            className={`grid transition-[grid-template-rows,opacity] duration-250 ease-in-out ${
              catalogOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
            aria-hidden={!catalogOpen}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="ml-[19px] space-y-1 border-l border-white/[0.14] py-1 pl-3">
                {catalogLinks.map(({ label, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end
                    tabIndex={catalogOpen ? 0 : -1}
                    className={({ isActive }) =>
                      [
                        "group flex min-h-[37px] items-center gap-2.5 rounded-lg px-3",
                        "text-[12.5px] font-medium transition-[background-color,color] duration-200 ease-out",
                        isActive
                          ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.18)]"
                          : "text-white/65 hover:bg-white/[0.07] hover:text-white",
                      ].join(" ")
                    }
                  >
                    <Icon size={15} strokeWidth={1.9} className="shrink-0 opacity-85" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {navigation.slice(7).map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => linkClass(isActive)}
            >
              <Icon
                size={18}
                strokeWidth={1.85}
                className={`shrink-0 transition-colors ${
                  location.pathname === path ? "text-white" : "text-white/55 group-hover:text-white/90"
                }`}
              />
              <span className="min-w-0 flex-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Fixed footer: never scrolls with navigation */}
      <div className="shrink-0 border-t border-white/[0.08] bg-[#202020] p-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.055] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[13px] font-bold text-white shadow-sm">
            SA
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">Super Admin</p>
            <p className="truncate text-[11.5px] text-white/50">admin@excart.app</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/50 px-3 py-2.5 text-[13px] font-semibold text-orange-400 transition-all duration-200 hover:border-orange-500 hover:bg-orange-500 hover:text-white active:scale-[0.99]"
        >
          <LogOut
            size={16}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          Logout
        </button>
      </div>

      <style>{`
        .sidebar-nav {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .sidebar-nav::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </aside>
  );
}
