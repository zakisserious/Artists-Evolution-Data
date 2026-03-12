"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Album } from "@/lib/api";

interface ChartProps {
  data: Album[];
}

export default function PopularityChart({ data }: ChartProps) {
  const minScore = Math.min(...data.map(d => d.avg_popularity));
  const maxScore = Math.max(...data.map(d => d.avg_popularity));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            hide
            domain={[Math.max(0, minScore - 80000), maxScore + 80000]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(15,15,25,0.95)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
            }}
            labelStyle={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', fontSize: '12px' }}
            itemStyle={{ color: '#818cf8', fontWeight: '700' }}
            formatter={(value: any) => [Math.round(value as number).toLocaleString(), "Avg Rank"]}
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="avg_popularity"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{ r: 4, fill: "#818cf8", strokeWidth: 2, stroke: "#0a0a0f" }}
            activeDot={{ r: 7, strokeWidth: 0, fill: "#a78bfa" }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
