import { useForm, Link } from "@inertiajs/react";
import { FlaskConical, RefreshCw } from "lucide-react";
import { FormEventHandler } from "react";

export default function Login({ status }: { status?: string }) {
  const { data, setData, post, processing, errors } = useForm({
    email: "admin@pharmapro.in",
    password: "",
    remember: false,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-2/5 bg-primary p-10 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <FlaskConical size={20} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg">PharmaPro</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-white leading-tight mb-3">
            Complete Pharmacy<br />Management System
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Manage inventory, sales, purchases, suppliers, and customers from a single powerful platform.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[["847", "Medicines"], ["2,847", "Monthly Sales"], ["48", "Suppliers"], ["1,240", "Customers"]].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-mono font-bold text-white">{v}</div>
                <div className="text-blue-200 text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-blue-300 text-xs">© 2025 PharmaPro · All rights reserved</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Sign in to PharmaPro</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access the dashboard</p>
          </div>

          {status && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-md text-sm text-emerald-700 dark:text-emerald-400">
              {status}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Email address</label>
              <input
                type="email"
                value={data.email}
                onChange={e => setData("email", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password"
                value={data.password}
                onChange={e => setData("password", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {processing ? <><RefreshCw size={14} className="animate-spin" />Signing in…</> : "Sign In"}
            </button>
          </form>

          <div className="mt-6 p-3 bg-muted/50 rounded-md">
            <div className="text-xs font-medium text-foreground mb-1">Demo credentials</div>
            <div className="text-xs text-muted-foreground font-mono">admin@pharmapro.in / admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
