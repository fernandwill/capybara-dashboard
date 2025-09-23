"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.getPlayersFromPastMatches = exports.removePlayerFromMatch = exports.addPlayerToMatch = exports.deleteMatch = exports.updateMatch = exports.createMatch = exports.getMatchById = exports.getAllMatches = void 0;
const database_1 = __importDefault(require("../utils/database"));
const server_1 = require("../server");
const server_2 = require("../server");
const getAllMatches = async (req, res) => {
    try {
        const matches = await database_1.default.match.findMany({
            include: {
                players: {
                    include: {
                        player: true,
                    },
                },
                payments: true,
            },
            orderBy: {
                date: "asc",
            },
        });
        res.json(matches);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to find matches." });
    }
};
exports.getAllMatches = getAllMatches;
const getMatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await database_1.default.match.findUnique({
            where: { id },
            include: {
                players: {
                    include: {
                        player: true,
                    },
                },
                payments: true,
            },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found." });
        }
        res.json(match);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch match." });
    }
};
exports.getMatchById = getMatchById;
const createMatch = async (req, res) => {
    try {
        const { title, location, courtNumber, date, time, fee = 0, status = "UPCOMING", description, } = req.body;
        const match = await database_1.default.match.create({
            data: {
                title,
                location,
                courtNumber,
                date: new Date(date),
                time,
                fee,
                status,
                description,
            },
            include: {
                players: {
                    include: {
                        player: true,
                    },
                },
                payments: true,
            },
        });
        res.status(201).json(match);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create match." });
    }
};
exports.createMatch = createMatch;
const updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, location, courtNumber, date, time, fee, status, description, } = req.body;
        const match = await database_1.default.match.update({
            where: { id },
            data: {
                title,
                location,
                courtNumber,
                date: date ? new Date(date) : undefined,
                time,
                fee,
                status,
                description,
            },
            include: {
                players: {
                    include: {
                        player: true,
                    },
                },
                payments: true,
            },
        });
        await (0, server_1.updateStatus)();
        server_2.io.emit('matchUpdated');
        res.json(match);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update match." });
    }
};
exports.updateMatch = updateMatch;
const deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;
        await database_1.default.match.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete match." });
    }
};
exports.deleteMatch = deleteMatch;
const addPlayerToMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { playerId } = req.body;
        // Check if player is already in this match
        const existingMatchPlayer = await database_1.default.matchPlayer.findUnique({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
        });
        if (existingMatchPlayer) {
            return res
                .status(400)
                .json({ error: "Player is already in this match." });
        }
        const matchPlayer = await database_1.default.matchPlayer.create({
            data: {
                matchId,
                playerId,
            },
            include: {
                player: true,
                match: true,
            },
        });
        res.status(201).json(matchPlayer);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to add player to match." });
    }
};
exports.addPlayerToMatch = addPlayerToMatch;
const removePlayerFromMatch = async (req, res) => {
    try {
        const { matchId, playerId } = req.params;
        // Check if the player is actually in this match
        const existingMatchPlayer = await database_1.default.matchPlayer.findUnique({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
        });
        if (!existingMatchPlayer) {
            return res.status(404).json({ error: "Player is not in this match." });
        }
        await database_1.default.matchPlayer.delete({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: "Failed to remove player from match." });
    }
};
exports.removePlayerFromMatch = removePlayerFromMatch;
const getPlayersFromPastMatches = async (req, res) => {
    try {
        const { matchId, id } = req.params;
        const targetMatchId = matchId ?? id;
        if (!targetMatchId) {
            return res.status(400).json({ error: "Match ID is required." });
        }
        // First, get the current match to know its date
        const currentMatch = await database_1.default.match.findUnique({
            where: { id: targetMatchId },
        });
        if (!currentMatch) {
            return res.status(404).json({ error: "Match not found." });
        }
        // Get the 3 most recent matches before the current match date
        const pastMatches = await database_1.default.match.findMany({
            where: {
                date: {
                    lt: currentMatch.date,
                },
                status: "COMPLETED",
            },
            orderBy: {
                date: "desc",
            },
            take: 3,
            include: {
                players: {
                    include: {
                        player: true,
                    },
                },
            },
        });
        // Extract unique players from past matches
        const playerMap = new Map();
        pastMatches.forEach(match => {
            match.players.forEach(playerMatch => {
                const player = playerMatch.player;
                const normalizedName = player.name.trim().toLowerCase();
                const key = normalizedName.length > 0 ? normalizedName : player.id;
                // Only add if not already in the map (to ensure uniqueness)
                if (!playerMap.has(key)) {
                    playerMap.set(key, player);
                }
            });
        });
        // Convert map values to array
        const uniquePlayers = Array.from(playerMap.values());
        res.json(uniquePlayers);
    }
    catch (error) {
        console.error("Error fetching players from past matches:", error);
        res.status(500).json({ error: "Failed to fetch players from past matches." });
    }
};
exports.getPlayersFromPastMatches = getPlayersFromPastMatches;
const getStats = async (req, res) => {
    try {
        const totalMatches = await database_1.default.match.count();
        const upcomingMatches = await database_1.default.match.count({
            where: {
                status: "UPCOMING",
            },
        });
        const completedMatches = await database_1.default.match.count({
            where: {
                status: "COMPLETED",
            },
        });
        // Calculate total hours played for completed matches
        const completedMatchesWithTime = await database_1.default.match.findMany({
            where: {
                status: "COMPLETED",
            },
            select: {
                time: true,
            },
        });
        let totalHours = 0;
        completedMatchesWithTime.forEach((match) => {
            // Assuming time format is "HH:MM-HH:MM" like "16:00-20:00"
            if (match.time && match.time.includes("-")) {
                const [startTime, endTime] = match.time.split("-");
                const [startHour, startMin] = startTime.split(":").map(Number);
                const [endHour, endMin] = endTime.split(":").map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const durationMinutes = endMinutes - startMinutes;
                totalHours += durationMinutes / 60;
            }
        });
        res.json({
            totalMatches,
            upcomingMatches,
            completedMatches,
            hoursPlayed: totalHours.toFixed(1),
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
exports.getStats = getStats;
//# sourceMappingURL=MatchController.js.map