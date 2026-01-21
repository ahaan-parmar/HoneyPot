import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RequestsChartProps {
  data: number[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground">{label} min ago</p>
        <p className="text-lg font-mono text-primary">{payload[0].value} req/min</p>
      </div>
    );
  }
  return null;
};

export const RequestsChart = ({ data }: RequestsChartProps) => {
  const chartData = data.map((value, index) => ({
    minute: 60 - index,
    requests: value,
  })).reverse();

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(222, 30%, 18%)" 
            vertical={false}
          />
          <XAxis 
            dataKey="minute" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
            interval={9}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="requests"
            fill="hsl(187, 92%, 50%)"
            radius={[2, 2, 0, 0]}
            maxBarSize={8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
