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
router.post('/', createPlayer)
router.put('/:id', updatePlayer)
router.delete('/:id', deletePlayer)
a
export default router