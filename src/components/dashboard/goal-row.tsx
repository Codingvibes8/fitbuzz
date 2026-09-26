import type { LucideIcon } from "lucide-react";

type GoalRowProps = {
  icon: LucideIcon;
  title: string;
  help: string;
  value: string;
  progress: string;
};

export function GoalRow({ icon: Icon, title, help, value, progress }: GoalRowProps) {
  return (
    <div className="goal-row">
      <span className="goal-icon"><Icon size={15} /></span>
      <div><div className="goal-name">{title}</div><div className="goal-help">{help}</div></div>
      <div className="goal-value">{value}<span>{progress} complete</span></div>
    </div>
  );
}