export function TableHeader({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        {cols.map(col => (
          <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}
