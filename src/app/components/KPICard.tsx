import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  bgColor: string;
  iconColor: string;
  hoverColor: string;
}

export function KPICard({ icon: Icon, value, label, bgColor, iconColor, hoverColor }: KPICardProps) {
  return (
    <button className="flex flex-col p-6 rounded-xl bg-white transition-all hover:scale-[1.02] active:scale-95 text-left group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <ArrowUpRight className={`w-6 h-6 text-slate-400 ${hoverColor} transition-colors`} />
      </div>
      <p className="text-4xl font-bold text-[#191c1e] mb-1">{value}</p>
      <p className="text-[11px] font-semibold text-[#4c616d] uppercase tracking-wider">{label}</p>
    </button>
  );
}
