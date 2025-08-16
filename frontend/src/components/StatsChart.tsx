import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

interface ChartData {
  month: string;
  count: number;
  totalHours: number;
}

export default function StatsChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthly = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/stats/monthly");
        const monthlyData: Record<
          string,
          { count: number; totalHours: number }
        > = await response.json();

        // Create array of all 12 months with abbreviated names for better mobile display
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Transform data to show month names and include all months
        const chartData = monthNames.map((monthName, index) => {
          const monthKey = `2025-${String(index + 1).padStart(2, '0')}`;
          const stats = monthlyData[monthKey] || { count: 0, totalHours: 0 };
          
          return {
            month: monthName,
            count: stats.count,
            totalHours: stats.totalHours,
          };
        });

        setData(chartData);
      } catch (error) {
        console.error("Error fetching monthly data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthly();
  }, []);

  if (loading) {
    return (
      <div className="monthly-stats-chart">
        <div className="chart-header">
          <h3>Monthly Statistics</h3>
        </div>
        <div className="chart-container loading">
          <div className="loading-spinner">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="monthly-stats-chart">
        <div className="chart-header">
          <h3>Monthly Statistics</h3>
        </div>
        <div className="chart-container empty">
          <div className="empty-state">
            <p>No match data available yet</p>
            <span>Create some matches to see statistics</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-stats-chart">
      <div className="chart-header">
        <h3>Monthly Statistics</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color matches"></div>
            <span>Matches</span>
          </div>
          <div className="legend-item">
            <div className="legend-color hours"></div>
            <span>Total Hours</span>
          </div>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--text-color)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--text-color)"
              fontSize={12}
              label={{ 
                value: 'Hours Played', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'var(--text-color)', fontSize: '12px' }
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-color)'
              }}
            />
            <Bar dataKey="count" fill="var(--primary-color)" name="Matches" radius={[4, 4, 0, 0]} />
            <Line 
              type="monotone" 
              dataKey="totalHours" 
              stroke="var(--secondary-color)" 
              strokeWidth={3}
              dot={{ fill: 'var(--secondary-color)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--secondary-color)', strokeWidth: 2 }}
              name="Total Hours"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
