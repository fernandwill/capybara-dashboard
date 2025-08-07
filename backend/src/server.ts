import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

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