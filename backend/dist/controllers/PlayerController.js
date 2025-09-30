"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlayer = exports.updatePlayer = exports.createPlayer = exports.getPlayerById = exports.getAllPlayer = void 0;
const database_1 = __importDefault(require("../utils/database"));
const getAllPlayer = async (req, res) => {
    try {
        const players = await database_1.default.player.findMany({
            include: {
                matchPlayers: {
                    include: {
                        match: true
                    }
                },
                payments: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(players);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch players.' });
    }
};
exports.getAllPlayer = getAllPlayer;
const getPlayerById = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await database_1.default.player.findUnique({
            where: { id },
            include: {
                matchPlayers: {
                    include: {
                        match: true
                    }
                },
                payments: {
                    include: {
                        match: true
                    }
                }
            }
        });
        if (!player) {
            return res.status(404).json({ error: 'Player not found.' });
        }
        res.json(player);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch player.' });
    }
};
exports.getPlayerById = getPlayerById;
const createPlayer = async (req, res) => {
    try {
        const { name, email, phone, status = 'ACTIVE' } = req.body;
        const player = await database_1.default.player.create({
            data: {
                name,
                email,
                phone,
                status,
            },
            include: {
                matchPlayers: {
                    include: {
                        match: true
                    }
                },
                payments: true
            }
        });
        res.status(201).json(player);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create player.' });
    }
};
exports.createPlayer = createPlayer;
const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, status } = req.body;
        const player = await database_1.default.player.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(email !== undefined ? { email } : {}),
                ...(phone !== undefined ? { phone } : {}),
                ...(status !== undefined ? { status } : {}),
            },
            include: {
                matchPlayers: {
                    include: {
                        match: true
                    }
                },
                payments: true
            }
        });
        res.json(player);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update player.' });
    }
};
exports.updatePlayer = updatePlayer;
const deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        await database_1.default.player.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete player.' });
    }
};
exports.deletePlayer = deletePlayer;
//# sourceMappingURL=PlayerController.js.map