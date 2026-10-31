
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

type HeaderProps = {
  title: string;
  onMenuClick?: () => void;
};

const paymentNotifications = [
  {
    id: "PAY-2026-010",
    orderId: "PICK-2026-010",
    amount: "₹58,500",
    message: "Payment pending approval",
  },
  {
    id: "PAY-2026-009",
    orderId: "PICK-2026-009",
    amount: "₹45,200",
    message: "Payment pending approval",
  },
];

export default function Header({ title, onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6 xl:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <h1 className="truncate text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <button
            type="button"
            aria-label="Payment notifications"
            onClick={() => {
              setShowNotifications((value) => !value);
              setShowProfile(false);
            }}
            className="relative rounded-xl p-2.5 text-stone-500 transition hover:bg-stone-100"
          >
            <Bell size={22} />
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
              {paymentNotifications.length}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-stone-200 bg-white p-4 shadow-xl sm:w-[360px]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-800">
                  Payment notifications
                </h2>
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setShowNotifications(false)}
                  className="rounded-md p-1 text-stone-400 hover:bg-stone-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {paymentNotifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-stone-100 p-3"
                  >
                    <p className="text-xs font-semibold text-stone-800">
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-orange-600">
                      {item.orderId}
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-800">
                      {item.amount}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[10px] text-stone-400">
                Sample notifications. Live payment data will be connected later.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile((value) => !value);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-stone-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
              SA
            </span>
            <span className="hidden text-sm font-medium text-stone-700 xl:block">
              Super Admin
            </span>
            <ChevronDown size={16} className="hidden text-stone-500 sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
              <p className="text-sm font-semibold text-stone-800">
                Super Admin
              </p>
              <p className="mt-1 truncate text-xs text-stone-500">
                admin@excart.app
              </p>
              <p className="mt-3 border-t border-stone-100 pt-3 text-xs text-stone-400">
                Administrator account
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
