type DataTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

type DataTableProps = {
  columns: DataTableColumn[];
  rows: Record<string, React.ReactNode>[];
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#E7DFCF] text-left">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-2 font-medium ${column.align === "right" ? "text-right" : ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-line">
              {columns.map((column) => (
                <td key={column.key} className={`px-3 py-2 ${column.align === "right" ? "text-right" : ""}`}>
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
