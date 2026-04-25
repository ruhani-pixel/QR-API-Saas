import { Card, CardContent, CardHeader } from '@/components/ui/Card';
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
    if (t.includes('message')) return {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-600',
      glow: 'shadow-emerald-500/20'
    };
    if (t.includes('outbound')) return {
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-500',
      text: 'text-blue-600',
      glow: 'shadow-blue-500/20'
    };
    if (t.includes('inbound')) return {
      bg: 'bg-purple-50/50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-500',
      text: 'text-purple-600',
      glow: 'shadow-purple-500/20'
    };
    if (t.includes('fail')) return {
      bg: 'bg-rose-50/50',
      border: 'border-rose-100',
      iconBg: 'bg-rose-500',
      text: 'text-rose-600',
      glow: 'shadow-rose-500/20'
    };
    return {
      bg: 'bg-brand-gold/10',
      border: 'border-brand-gold/20',
      iconBg: 'bg-brand-gold',
      text: 'text-brand-gold',
      glow: 'shadow-brand-gold/20'
    };
  };

  const colors = getColors();

  return (
    <Card className={cn(
      "relative overflow-hidden border transition-all duration-500 group rounded-[2rem] p-6 bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1",
      colors.border
    )}>
      {/* Background Decorative Element */}
      <div className={cn(
        "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-10 transition-all duration-700 group-hover:scale-150",
        colors.iconBg
      )} />

      <CardHeader className="flex flex-row items-center justify-between p-0 mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 text-white",
          colors.iconBg,
          colors.glow
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
           <div className={cn(
             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
             isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
           )}>
             {isPositive ? '↑ Active' : '↓ Slow'}
           </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</span>
          <div className="text-4xl font-black text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform duration-500">{value}</div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
