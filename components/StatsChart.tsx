import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TopicPlan } from '../types';

interface StatsChartProps {
  plans: TopicPlan[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ plans }) => {
  const data = React.useMemo(() => {
    const counts = { NB: 0, TH: 0, VD: 0, VDC: 0 };
    plans.forEach(p => {
      if (counts[p.level] !== undefined) {
        counts[p.level] += p.count;
      }
    });
    return [
      { name: 'Nhận biết', value: counts.NB, color: '#3b82f6' }, // Blue
      { name: 'Thông hiểu', value: counts.TH, color: '#10b981' }, // Emerald
      { name: 'Vận dụng', value: counts.VD, color: '#f59e0b' }, // Amber
      { name: 'VD Cao', value: counts.VDC, color: '#ef4444' }, // Red
    ].filter(d => d.value > 0);
  }, [plans]);

  if (plans.length === 0) return null;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};