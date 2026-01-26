import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { Button } from "./ui/button";

interface ChartData {
  month: string;
  count: number;
  totalHours: number;
}

export default function StatsChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const authFetchMonthly = async () => {
      try {
        setLoading(true);
        const response = await authFetch("/api/stats/monthly");
        const monthlyDate: Record<string, { count: number; totalHours: number }> = await response.json();

        const years = Array.from(new Set(Object.keys(monthlyDate).map(key => parseInt(key.split("-")[0])))).sort((a, b) => b - a);

        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
          years.unshift(currentYear);
        }
        setAvailableYears(years);

        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const chartData = monthNames.map((monthName, index) => {
          const monthKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
          const stats = monthlyDate[monthKey] || { count: 0, totalHours: 0 };

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
    }
    authFetchMonthly();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="monthly-stats-chart">
        <div className="chart-header">
          <h3>Monthly Statistics</h3>
        </div>
        <div className="chart-container loading">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
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
        <div className="chart-title-area">
          <h3>Monthly Statistics</h3>
          <div className="year-selector">
            {availableYears.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "ghost"}
                size="sm"
                className={`year-btn ${selectedYear === year ? "active" : ""}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
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
            <XAxis
              dataKey="month"
              stroke="var(--text-color)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--text-color)"
              fontSize={12}
              label={{
                value: "Hours Played",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "var(--text-color)", fontSize: "12px" }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "var(--text-color)"
              }}
            />
            <Bar dataKey="count" fill="var(--primary-color)" name="Matches" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalHours" fill="var(--secondary-color)" name="Total Hours" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
