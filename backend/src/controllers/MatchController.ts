import prisma from '../utils/database'

export const getAllMatches = async (req, res) => {
    try {
        const matches = await prisma.match.findMany({
            include: {
                players: {
                    include: {
                        player: true
                    }
                },
                payments: true
            },
            orderBy: {
                date: 'asc'
            }
        })
        res.json(matches)
    } catch (error) {
        res.status(500).json({error: 'Failed to find matches.'})
    }
}

export const getMatchById = async (req, res) => {
    try {
        const {id} = req.paramsc
        const match = await prisma.match.findUnique({
            where: {id},
            include: {
                players: {
                    include: {
                        player: true
                    }
                },
                payments: true
            }
        })

        if (!match) {
            return res.status(404).json({error: 'Match not found.'})
        }

        res.json(match)
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch match.'})
    }
}

export const createMatch = async (req, res) => {
    try {
        const {title, location, courtNumber, date, time, fee = 0, status = 'UPCOMING', description} = req.body

        const match = await prisma.match.create({
            data:{
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
                        player: true
                    }
                },
                payments: true
            }
        })
        
        res.status(201).json(match)
    } catch (error) {
        res.status(500).json({error: 'Failed to create match.'})
    }
}

export const updateMatch = async (req, res) => {
    try {
        const {id} = req.params
        const {title, location, courtNumber, date, time, fee, status, description} = req.body

        const match = await prisma.match.update({
            where: {id},
            data: {
                title,
                location,
                courtNumber,
                date: date ? new Date(date) : undefined,
                time,
                fee,
                status,
                description
            },
            include: {
                players: {
                    include: {
                        player: true
                    }
                },
                payments: true
            }
        })

        res.json(match)
    } catch (error) {
        res.status(500).json({error: 'Failed to update match.'})
    }
}

export const deleteMatch = async (req, res) => {
    try {
        const {id} = req.params
        await prisma.match.delete({
            where: {id}
        })
        res.status(204).send()
    } catch (error) {
        res.status(500).json({error: 'Failed to delete match.'})
    }
}

export const addPlayerToMatch = async (req, res) => {
    try {
        const {matchId} = req.params
        const {playerId} = req.body

        const player = await prisma.player.update({
            where: {id: playerId},
            data: {currentMatchId: matchId}
        })

        const matchPlayer = await prisma.matchPlayer.create({
            data: {
                matchId,
                playerId
            },
            include: {
                player: true,
                match: true
            }
        })

        res.status(201).json(matchPlayer)
    } catch (error) {
        res.status(500).json({error: 'Failed to add player to match.'})
    }
}

export const removePlayerFromMatch = async (req, res) => {
    try {
        const {matchId, playerId} = req.params

        await prisma.player.update({
            where: {id: playerId},
            data: {currentMatchId: null}
        })

        await prisma.matchPlayer.deleteMany({
            where: {
                matchId,
                playerId
            }
        })

        res.status(204).send()
    } catch (error) {
        res.status(500).json({error: 'Failed to remove player from match.'})
    }
}
