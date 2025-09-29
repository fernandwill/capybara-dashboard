import express, { type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import prisma from './utils/database'
import { createServer } from 'http'
import type { Socket } from 'socket.io'
import playerRoutes from './routes/players'
import matchRoutes from './routes/matches'
import paymentRoutes from './routes/payments'
import { initSocket } from './utils/socket'
import { updateMatchStatuses } from './utils/matchStatus'
import { getStats } from './controllers/MatchController'

dotenv.config()

const app = express();
const server = createServer(app)
const io = initSocket(server)

const PORT = process.env.PORT || 8000;

app.use(helmet())
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}))
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/api/players', playerRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/payments', paymentRoutes)

app.get('/api/health', (req: Request, res: Response) => {
    res.json({status: 'OK', message: 'API is running.'})
})

app.get('/api/stats/monthly', async (req: Request, res: Response) => {
    try {
        const matches = await prisma.match.findMany({
            where: {status: 'COMPLETED'},
            select: {
                date: true,
                time: true,
            }
        });

        const monthlyData: Record<string, {count: number; totalHours: number}> = {};

        for (const match of matches) {
            const date = new Date(match.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {count: 0, totalHours: 0};
            }

            monthlyData[monthKey].count += 1;
            const [startTime, endTime] = match.time.split('-');
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);

            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const durationHours = (endMinutes - startMinutes) / 60;

            monthlyData[monthKey].totalHours += durationHours;
        }

        res.json(monthlyData);
    } catch (error) {
        console.error('Data not found: ', error)
        res.status(500).json({error: 'Failed to fetch monthly stats'});
    }
});

app.get('/api/debug/update-statuses', async (req: Request, res: Response) => {
    try {
        const updatedCount = await updateMatchStatuses();
        res.json({message: 'Status update completed', updatedCount});
    } catch (error) {
        console.error('Error updating match statuses via debug route:', error)
        res.status(500).json({error: 'Failed to update match statuses'});
    }
});

app.get('/api/debug/all-matches', async (req: Request, res: Response) => {
    const matches = await prisma.match.findMany({
        select: { id: true, date: true, time: true, status: true, title: true }
    });
    res.json(matches);
});

app.put('/api/debug/complete/:id', async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const matchStatus = await prisma.match.update({
            where: {id},
            data: {status: 'COMPLETED'}
        });
        res.json(matchStatus);
    } catch (error) {
        res.status(500).json({error: 'Failed to update match'});
    }
});

app.get('/api/stats', getStats)

io.on('connection', (socket: Socket) => {
    console.log('Client connected: ', socket.id)

    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    })
})

server.listen(PORT, () => {
    console.log(`Server on port ${PORT}`)
    console.log('Socket.io server active.')

    setInterval(() => {
        updateMatchStatuses().catch((error) =>
            console.error('Error updating match statuses via interval:', error)
        )
    }, 24 * 60 * 60 * 1000);
})
export {io}