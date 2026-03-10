interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export default function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg p-5 animate-fade-in">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
        {label}
      </p>
      <p className="font-display text-3xl font-bold text-foreground">
        {value}
        {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
