export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "In Stock": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Low Stock": "bg-amber-50 text-amber-700 border border-amber-200",
    "Out of Stock": "bg-red-50 text-red-700 border border-red-200",
    "Expired": "bg-gray-100 text-gray-600 border border-gray-200",
    "Paid": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Pending": "bg-amber-50 text-amber-700 border border-amber-200",
    "Cancelled": "bg-red-50 text-red-700 border border-red-200",
    "Active": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Inactive": "bg-gray-100 text-gray-600 border border-gray-200",
    "Received": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Ordered": "bg-blue-50 text-blue-700 border border-blue-200",
    "Partial": "bg-amber-50 text-amber-700 border border-amber-200",
    "Held": "bg-blue-50 text-blue-700 border border-blue-200",
    "Returned": "bg-red-50 text-red-700 border border-red-200",
    "Partially Returned": "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${map[status] || "bg-gray-100 text-gray-600 border border-gray-200"}`}>
      {status}
    </span>
  );
}
