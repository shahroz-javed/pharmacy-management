import { useForm } from "@inertiajs/react";
import { FlaskConical, RefreshCw } from "lucide-react";
import { FormEventHandler } from "react";

export default function ResetPassword({ token, email }: { token: string; email: string }) {
  const { data, setData, post, processing, errors } = useForm({
    token,
    email,
    password: "",
    password_confirmation: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post("/reset-password");
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
            <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account</p>
          </div>

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
              <label className="text-xs font-medium text-foreground block mb-1.5">New Password</label>
              <input
                type="password"
                value={data.password}
                onChange={e => setData("password", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={data.password_confirmation}
                onChange={e => setData("password_confirmation", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {processing ? <><RefreshCw size={14} className="animate-spin" />Resetting…</> : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
