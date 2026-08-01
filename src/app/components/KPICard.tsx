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
    <button className="flex flex-col p-6 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:scale-[1.02] active:scale-95 text-left group">
      <div className="flex justify-between items-start mb-6 w-full">
        <div className={`w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center ${iconColor} bg-slate-50`}>
          <Icon className="w-6 h-6" />
        </div>
        <ArrowUpRight className={`w-4 h-4 text-slate-300 ${hoverColor} transition-colors`} />
      </div>
      <p className="text-3xl font-black text-slate-800 mb-1">{value}</p>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </button>
  );
}
