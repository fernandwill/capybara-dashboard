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
import { calculateDurationHours, getMatchEndDate } from './utils/time'

dotenv.config()

const app = express();
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

const updateStatus = async () => {
    try {
        const now = new Date();
        console.log('Current time: ', now);

        const upcomingMatches = await prisma.match.findMany({
            where: {status: 'UPCOMING'},
            select: {id: true, date: true, time: true}
        });

        console.log('Found upcoming matches: ', upcomingMatches.length);

        for (const match of upcomingMatches) {
            const matchDate = new Date(match.date);
            const matchEndDate = getMatchEndDate(matchDate, match.time);

            if (!matchEndDate) {
                console.warn(`Skipping match ${match.id} due to invalid time range: ${match.time}`);
                continue;
            }

            console.log(`Match ${match.id}: ends at ${matchEndDate}, now is ${now}`);
            console.log(`Should complete? ${matchEndDate < now}`);

            if (matchEndDate < now) {
                await prisma.match.update({
                    where: {id: match.id},
                    data: {status: 'COMPLETED'}
                });
                console.log(`Completed match: ${match.id}`);
                }
            }
        } catch (error) {
            console.error('Error updating match status: ', error);
    }
};

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
            const durationHours = calculateDurationHours(match.time);
            if (durationHours !== null) {
                acc[monthKey].totalHours += durationHours;
            }

            return acc;
        }, {});

        res.json(monthlyData);
    } catch (error) {
        console.error('Data not found: ', error)
        res.status(500).json({error: 'Failed to fetch monthly stats'});
    }
});

app.get('/api/debug/update-statuses', async (req, res) => {
    await updateStatus();
    res.json({message: 'Status update completed'});
});

app.get('/api/debug/all-matches', async (req, res) => {
    const matches = await prisma.match.findMany({
        select: { id: true, date: true, time: true, status: true, title: true }
    });
    res.json(matches);
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
import { getStats, updateMatch } from './controllers/MatchController'
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

    updateStatus();
    setInterval(updateStatus, 1 * 60 * 1000); // Update status every minute
})

export {io}
export {updateStatus}