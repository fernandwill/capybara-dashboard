import {Router} from 'express'
import {
    getAllPlayer,
    getPlayerById,
    createPlayer,
    updatePlayer,
    deletePlayer
} from '../controllers/PlayerController'

const router = Router()

router.get('/', getAllPlayer)
router.get('/:id', getPlayerById)
router.get('/', createPlayer)
router.get('/:id', updatePlayer)
router.get('/:id', deletePlayer)

export default router