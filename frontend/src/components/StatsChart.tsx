import {BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import {useState, useEffect} from 'react';
import {io} from 'socket.io-client';

export default function StatsChart() {
    interface ChartData {
        month: string;
        count: number;
        totalHours: number;
    }

    const [data, setData] = useState<ChartData[]>([]);

    useEffect(() => {
        const fetchMonthly = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/stats/monthly');
                const monthlyData: Record<string, {count: number, totalHours: number}> = await response.json();

                const chartData = Object.entries(monthlyData).map(([month, stats]) => ({
                    month, 
                    count: stats.count,
                    totalHours: stats.totalHours
                }));

                setData(chartData);
            } catch (error) {
                console.error('Error fetching monthly data: ', error)
            }
        };

        fetchMonthly();

        const socket = io('http://localhost:8000');
        socket.on('matchUpdated', () => {
            console.log('Match updated, refetching chart data');
            fetchMonthly();
        });

        return () => {
            socket.disconnect();
        }
    
    }, []);
        

    return (
        <div className="monthly-stats-chart">
            <div className="chart-container">
                <ResponsiveContainer width={1050} height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Matches" />
                        <Line type="monotone" dataKey="totalHours" stroke="#22c55e" name="Hours" strokeWidth={3} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}