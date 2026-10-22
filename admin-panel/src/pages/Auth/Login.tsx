
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";

const LOGO_URL =
  "https://res.cloudinary.com/nh9o1pkq/image/upload/Excart_Logo.png";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/admin/login", {
        email: email.trim(),
        password,
        deviceType: "web",
        deviceId: "chrome",
      });

      const { accessToken, refreshToken, admin } =
        response.data.data ?? {};

      if (!accessToken || !refreshToken || !admin) {
        throw new Error("Invalid login response from server.");
      }


      // Clear old authentication data from both storage locations.
      const authKeys = ["accessToken", "refreshToken", "admin"];

      for (const key of authKeys) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }

      // Save authentication data based on Remember me.
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("accessToken", accessToken);
      storage.setItem("refreshToken", refreshToken);
      storage.setItem("admin", JSON.stringify(admin));


      // Navigate to the dashboard after successful authentication.
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      let message = "Unable to sign in. Please try again.";

      if (
        err instanceof Error &&
        err.message === "Invalid login response from server."
      ) {
        message = err.message;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const apiMessage = (
          err as { response?: { data?: { message?: string } } }
        ).response?.data?.message;

        if (apiMessage) {
          message = apiMessage;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10 text-stone-900">
      {/* Soft orange background accents */}
      <div className="pointer-events-none absolute -right-32 -top-36 h-[420px] w-[420px] rounded-full bg-orange-100/80 blur-[2px]" />
      <div className="pointer-events-none absolute -bottom-52 -left-40 h-[540px] w-[540px] rounded-full bg-orange-100/70 blur-[2px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-[300px] w-[300px] rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative z-10 w-full max-w-[480px]">
        {/* ExCart logo */}
        <header className="mb-2 flex justify-center">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="ExCart icon"
              className="h-14 w-14 shrink-0 object-contain"
            />

            <span className="whitespace-nowrap text-[38px] font-extrabold tracking-tight text-[#202020]">
              E<span className="text-orange-500">x</span>Cart
            </span>
          </div>
        </header>

        {/* Login heading */}
        <div className="mb-5 text-center">
          <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">
            Sign in to manage your ExCart operations.
          </p>
        </div>

        {/* Login card */}
        <section className="rounded-[24px] border border-stone-100 bg-white/95 p-6 shadow-[0_16px_50px_rgba(41,37,36,0.07)] sm:p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2.5 block text-sm font-semibold text-stone-800"
              >
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/60 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/10">
                <Mail size={19} className="shrink-0 text-stone-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                  className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2.5 block text-sm font-semibold text-stone-800"
              >
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/60 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/10">
                <LockKeyhole
                  size={19}
                  className="shrink-0 text-stone-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  className="min-w-0 flex-1 bg-transparent py-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-stone-400 transition hover:text-stone-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Login options */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2.5 text-stone-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 accent-orange-500"
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() =>
                  setError("Please contact support to reset your password.")
                }
                className="font-semibold text-orange-600 transition hover:text-orange-700"
              >
                Forgot password?
              </button>
            </div>

            {/* Login error */}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            {/* Sign in */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(249,115,22,0.22)] transition hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && (
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />

            <p className="flex items-center gap-2 text-center text-xs text-stone-500">
              <ShieldCheck size={15} className="shrink-0 text-orange-500" />
              Secure access for authorized administrators
            </p>

            <div className="h-px flex-1 bg-stone-200" />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-7 text-center text-xs leading-5 text-stone-400">
          © {new Date().getFullYear()} ExCart
          <span className="mx-2">•</span>
          Buy better. Sell smarter.
        </footer>
      </div>
    </main>
  );
}
