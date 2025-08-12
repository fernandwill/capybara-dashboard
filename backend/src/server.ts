import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import prisma from './utils/database'

import {createServer} from 'http'
import {Server} from 'socket.io'

import playerRoutes from './routes/players'
import matchRoutes from './routes/matches'
import paymentRoutes from './routes/payments'

dotenv.config()

const app = express();
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

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

app.get('/api/health', (req, res) => {
    res.json({status: 'OK', message: 'API is running.'})
})

app.get('/api/stats/monthly', async (req, res) => {
    try {
        const matches = await prisma.match.findMany({
            where: {status: 'COMPLETED'},
            select: {
                date: true,
                time: true,
            }
        });

        const monthlyData = matches.reduce((acc: any, match) => {
            const date = new Date(match.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!acc[monthKey]) {
                acc[monthKey] = {count: 0, totalHours: 0};
            }

            acc[monthKey].count += 1;
            const [startTime, endTime] = match.time.split('-');
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);

            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const durationHours = (endMinutes - startMinutes) / 60;

            acc[monthKey].totalHours += durationHours;

            return acc;
        }, {});

        res.json(monthlyData);
    } catch (error) {
        console.error('Data not found: ', error)
        res.status(500).json({error: 'Failed to fetch monthly stats'});
    }
});

app.put('/api/debug/complete/:id', async (req, res) => {
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

// Import the stats function directly for the /api/stats route
import { getStats } from './controllers/MatchController'
import { dmmfToRuntimeDataModel } from '@prisma/client/runtime/library'
app.get('/api/stats', getStats)

io.on('connection', (socket) => {
    console.log('Client connected: ', socket.id)

    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    })
})

server.listen(PORT, () => {
    console.log(`Server on port ${PORT}`)
    console.log('Socket.io server active.')
})

export {io}