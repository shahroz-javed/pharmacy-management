import { useForm, Link } from "@inertiajs/react";
import { ChevronLeft, FlaskConical, RefreshCw } from "lucide-react";
import { FormEventHandler } from "react";

export default function ForgotPassword({ status }: { status?: string }) {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post("/forgot-password");
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
        </div>
        <div className="text-blue-300 text-xs">© 2025 PharmaPro · All rights reserved</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Forgot Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
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
                placeholder="admin@pharmapro.in"
                value={data.email}
                onChange={e => setData("email", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {processing ? <><RefreshCw size={14} className="animate-spin" />Sending…</> : "Send Reset Link"}
            </button>

            <Link href="/login" className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5">
              <ChevronLeft size={14} />Back to sign in
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
