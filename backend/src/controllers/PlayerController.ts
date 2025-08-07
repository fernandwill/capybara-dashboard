import prisma from '../utils/database'

export const getAllPlayer = async (req, res) => {
    try {
        const players = await prisma.player.findMany({
            include: {
                currentMatch: true,
                payments: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        res.json(players)
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch players.'})
    }
}

export const getPlayerById = async (req, res) => {
    try {
        const {id} = req.params;
        const player = await prisma.player.findUnique({
            where: {id},
            include: {
                currentMatch: true,
                payments: {
                    include: {
                        match: true
                    }
                }
            }
        })

        if (!player) {
            return res.status(404).json({error: 'Player not found.'})
        }

        res.json(player)
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch player.'})
    }
}

export const createPlayer = async (req, res) => {
    try {
        const {name, email, phone, status = 'ACTIVE', paymentStatus = 'BELUM_SETOR'} = req.body

        const player = await prisma.player.create({
            data: {
                name, 
                email,
                phone,
                status,
                paymentStatus,
            },
            include: {
                currentMatch: true,
                payments: true
            }
        })

        res.status(201).json(player)
    } catch (error) {
        res.status(500).json({error: 'Failed to create player.'})
    }
}

export const updatePlayer = async (req, res) => {
    try {
        const {id} = req.params
        const {name, email, phone, status, paymentStatus, currentMatchId} = req.body

        const player = await prisma.player.update({
            where: {id},
            data: {
                name,
                email, 
                phone,
                status,
                paymentStatus,
                currentMatchId
            },
            include: {
                currentMatch: true,
                payments: true
            }
        })

        res.json(player)
    } catch (error) {
        res.status(500).json({error: 'Failed to update player.'})
    }
}

export const deletePlayer = async (req, res) => {
    try {
        const {id} = req.params
        await prisma.player.delete({
            where: {id}
        })
        res.status(204).send()
    } catch (error) {
        res.status(500).json({error: 'Failed to delete player.'})
    }
}

