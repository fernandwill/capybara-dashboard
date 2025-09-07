"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./utils/database"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const players_1 = __importDefault(require("./routes/players"));
const matches_1 = __importDefault(require("./routes/matches"));
const payments_1 = __importDefault(require("./routes/payments"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const updateStatus = async () => {
    try {
        const now = new Date();
        console.log('Current time: ', now);
        const upcomingMatches = await database_1.default.match.findMany({
            where: { status: 'UPCOMING' },
            select: { id: true, date: true, time: true }
        });
        console.log('Found upcoming matches: ', upcomingMatches.length);
        for (const match of upcomingMatches) {
            const matchDate = new Date(match.date);
            const [, endTime] = match.time.split('-');
            const [endHour, endMin] = endTime.split(':').map(Number);
            matchDate.setHours(endHour, endMin, 0, 0);
            console.log(`Match ${match.id}: ends at ${matchDate}, now is ${now}`);
            console.log(`Should complete? ${matchDate < now}`);
            if (matchDate < now) {
                await database_1.default.match.update({
                    where: { id: match.id },
                    data: { status: 'COMPLETED' }
                });
                console.log(`Completed match: ${match.id}`);
            }
        }
    }
    catch (error) {
        console.error('Error updating match status: ', error);
    }
};
exports.updateStatus = updateStatus;
const PORT = process.env.PORT || 8000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/players', players_1.default);
app.use('/api/matches', matches_1.default);
app.use('/api/payments', payments_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API is running.' });
});
app.get('/api/stats/monthly', async (req, res) => {
    try {
        const matches = await database_1.default.match.findMany({
            where: { status: 'COMPLETED' },
            select: {
                date: true,
                time: true,
            }
        });
        const monthlyData = matches.reduce((acc, match) => {
            const date = new Date(match.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthKey]) {
                acc[monthKey] = { count: 0, totalHours: 0 };
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
    }
    catch (error) {
        console.error('Data not found: ', error);
        res.status(500).json({ error: 'Failed to fetch monthly stats' });
    }
});
app.get('/api/debug/update-statuses', async (req, res) => {
    await updateStatus();
    res.json({ message: 'Status update completed' });
});
app.get('/api/debug/all-matches', async (req, res) => {
    const matches = await database_1.default.match.findMany({
        select: { id: true, date: true, time: true, status: true, title: true }
    });
    res.json(matches);
});
app.put('/api/debug/complete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const matchStatus = await database_1.default.match.update({
            where: { id },
            data: { status: 'COMPLETED' }
        });
        res.json(matchStatus);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update match' });
    }
});
// Import the stats function directly for the /api/stats route
const MatchController_1 = require("./controllers/MatchController");
app.get('/api/stats', MatchController_1.getStats);
io.on('connection', (socket) => {
    console.log('Client connected: ', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    });
});
server.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
    console.log('Socket.io server active.');
    setInterval(updateStatus, 24 * 60 * 60 * 1000);
});
//# sourceMappingURL=server.js.map