import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AttackTypeChartProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  'hsl(187, 92%, 50%)',  // Primary cyan
  'hsl(0, 72%, 51%)',    // Red
  'hsl(38, 92%, 50%)',   // Amber
  'hsl(142, 71%, 45%)',  // Green
  'hsl(270, 70%, 60%)',  // Purple
  'hsl(200, 80%, 50%)',  // Blue
  'hsl(330, 70%, 55%)',  // Pink
  'hsl(60, 70%, 50%)',   // Yellow
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
        <p className="text-lg font-mono text-primary">{payload[0].value} attacks</p>
      </div>
    );
  }
  return null;
};

export const AttackTypeChart = ({ data }: AttackTypeChartProps) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
