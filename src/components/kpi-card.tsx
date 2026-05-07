type KpiCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {detail ? <div className="mt-1 text-sm text-neutral-600">{detail}</div> : null}
    </div>
  );
}
