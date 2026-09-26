import { ArrowDownRight, ArrowUpRight, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  unit: string;
  change: string;
  detail: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, unit, change, detail, icon: Icon }: StatCardProps) {
  const positive = change.includes("%") || change === "2";
  return (
    <article className="stat-card">
      <div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon"><Icon size={15} strokeWidth={1.9} /></span></div>
      <div className="stat-number">{value}<span className="stat-unit">{unit}</span></div>
      <div className="stat-bottom">
        {positive ? <ArrowUpRight className="trend-up" size={12} /> : change === "Ready when you are" ? <ArrowDownRight className="trend-down" size={12} /> : <Check className="trend-up" size={12} />}
        <span className={positive ? "trend-up" : ""}>{change}</span><span>{detail}</span>
      </div>
    </article>
  );
}