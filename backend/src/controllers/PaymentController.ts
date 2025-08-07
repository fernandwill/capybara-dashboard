import prisma from '../utils/database'

export const getPayment = async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                player: true,
                match: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        res.json(payments)
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch payments.'})
    }
}

export const getPaymentById = async (req, res) => {
    try {
        const {id} = req.params
        const payment = await prisma.payment.findUnique({
            where: {id},
            include: {
                player: true,
                match: true
            }
        })

        if (!payment) {
            return res.status(404).json({error: 'Payment not found'})
        }

        res.json(payment)
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch payment'})
    }
}

export const createPayment = async (req, res) => {
    try {
        const {playerId, matchId, amount, status = 'PENDING', method, notes} = req.body

        const payment = await prisma.payment.create({
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
        })

        res.status(201).json(payment)
    } catch (error) {
        res.status(500).json({error: 'Failed to create payment.'})
    }
}

export const updatePayment = async (req, res) => {
    try {
        const {id} = req.params
        const {playerId, matchId, amount, status, method, notes} = req.body

        const payment = await prisma.payment.update({
            where: {id},
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
        })

        res.json(payment)
    } catch (error) {
        res.status(500).json({error: 'Failed to update payment.'})
    }
}

export const deletePayment = async (req, res) => {
    try {
        const {id} = req.params
        await prisma.payment.delete({
            where: {id}
        })
        res.status(204).send()
    } catch (error) {
        res.status(500).json({error: 'Failed to delete payment.'})
    }
}