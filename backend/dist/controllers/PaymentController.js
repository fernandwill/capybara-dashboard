"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.updatePayment = exports.createPayment = exports.getPaymentById = exports.getPayment = void 0;
const database_1 = __importDefault(require("../utils/database"));
const getPayment = async (req, res) => {
    try {
        const payments = await database_1.default.payment.findMany({
            include: {
                player: true,
                match: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(payments);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments.' });
    }
};
exports.getPayment = getPayment;
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await database_1.default.payment.findUnique({
            where: { id },
            include: {
                player: true,
                match: true
            }
        });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(payment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
};
exports.getPaymentById = getPaymentById;
const createPayment = async (req, res) => {
    try {
        const { playerId, matchId, amount, status = 'PENDING', method, notes } = req.body;
        const payment = await database_1.default.payment.create({
            data: {
                playerId,
                matchId,
                amount,
                status,
                method,
                notes,
                paidAt: status === 'PAID' ? new Date() : null
            },
            include: {
                player: true,
                match: true
            }
        });
        res.status(201).json(payment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create payment.' });
    }
};
exports.createPayment = createPayment;
const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { playerId, matchId, amount, status, method, notes } = req.body;
        const payment = await database_1.default.payment.update({
            where: { id },
            data: {
                playerId,
                matchId,
                amount,
                status,
                method,
                notes,
                paidAt: status === 'PAID' ? new Date() : null
            },
            include: {
                player: true,
                match: true
            }
        });
        res.json(payment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update payment.' });
    }
};
exports.updatePayment = updatePayment;
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        await database_1.default.payment.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete payment.' });
    }
};
exports.deletePayment = deletePayment;
//# sourceMappingURL=PaymentController.js.map