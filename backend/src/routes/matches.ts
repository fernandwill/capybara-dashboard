import { Router } from 'express'
import {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  addPlayerToMatch,
  removePlayerFromMatch,
  getStats,
  getPlayersFromPastMatches
} from '../controllers/MatchController'

const router = Router()

router.get('/stats', getStats)
router.get('/', getAllMatches)
router.get('/:id', getMatchById)
router.get('/:matchId/players/past', getPlayersFromPastMatches)
router.post('/', createMatch)
router.put('/:id', updateMatch)
router.delete('/:id', deleteMatch)
router.post('/:matchId/players', addPlayerToMatch)
router.delete('/:matchId/players/:playerId', removePlayerFromMatch)

export default router