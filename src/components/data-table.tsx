type DataTableProps<T> = {
  columns: { key: keyof T; label: string; align?: "left" | "right" }[];
  rows: T[];
};

export function DataTable<T extends Record<string, React.ReactNode>>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#E7DFCF] text-left">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={`px-3 py-2 font-medium ${column.align === "right" ? "text-right" : ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-line">
              {columns.map((column) => (
                <td key={String(column.key)} className={`px-3 py-2 ${column.align === "right" ? "text-right" : ""}`}>
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
