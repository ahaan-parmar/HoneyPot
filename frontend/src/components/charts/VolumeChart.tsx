import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface VolumeChartProps {
  data: { hour: string; attacks: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-mono text-primary">{payload[0].value} attacks</p>
      </div>
    );
  }
  return null;
};

export const VolumeChart = ({ data }: VolumeChartProps) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(187, 92%, 50%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(187, 92%, 50%)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(222, 30%, 18%)" 
            vertical={false}
          />
          <XAxis 
            dataKey="hour" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="attacks"
            stroke="hsl(187, 92%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAttacks)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
