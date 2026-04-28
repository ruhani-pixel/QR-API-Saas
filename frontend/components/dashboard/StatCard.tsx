import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  const isPositive = trend === 'up';
  
  const getColors = () => {
    const t = title.toLowerCase();
    if (t.includes('message') || t.includes('inbound')) return {
      iconBg: 'bg-orange-50',
      iconColor: 'text-[#FF5F38]',
      trendBg: 'bg-emerald-50',
      trendText: 'text-emerald-500'
    };
    if (t.includes('outbound')) return {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      trendBg: 'bg-blue-50',
      trendText: 'text-blue-500'
    };
    if (t.includes('fail') || t.includes('health')) return {
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      trendBg: 'bg-rose-50',
      trendText: 'text-rose-500'
    };
    return {
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-400',
      trendBg: 'bg-slate-50',
      trendText: 'text-slate-400'
    };
  };

  const colors = getColors();

  return (
    <Card className="premium-card p-6 flex items-center gap-6 group relative overflow-hidden bg-white border-none shadow-[0_8px_40px_rgba(0,0,0,0.03)]">
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110",
        colors.iconBg
      )}>
        <Icon className={cn("w-7 h-7", colors.iconColor)} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          {trend && (
            <span className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
              colors.trendBg,
              colors.trendText
            )}>
              {isPositive ? '↑ High' : '↓ Low'}
            </span>
          )}
        </div>
        <div className="text-3xl font-black text-slate-900 tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString() : value}+
        </div>
      </div>

      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
         <Icon size={80} />
      </div>
    </Card>
  );
}
