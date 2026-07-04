import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "warning" | "info"; onClose: () => void }) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300",
    warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300",
  };
  const icons = { success: <CheckCircle2 size={15} />, error: <XCircle size={15} />, warning: <AlertTriangle size={15} />, info: <Info size={15} /> };
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-md text-sm font-medium ${styles[type]}`}>
      {icons[type]}{message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}
