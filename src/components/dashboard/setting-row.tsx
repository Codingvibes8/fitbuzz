import type { ReactNode } from "react";

type SettingRowProps = {
  title: string;
  help: string;
  children: ReactNode;
};

export function SettingRow({ title, help, children }: SettingRowProps) {
  return (
    <div className="setting-row">
      <div><div className="setting-name">{title}</div><div className="setting-help">{help}</div></div>
      {children}
    </div>
  );
}