"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MatchController_1 = require("../controllers/MatchController");
const router = (0, express_1.Router)();
router.get('/stats', MatchController_1.getStats);
router.get('/', MatchController_1.getAllMatches);
router.get('/:id', MatchController_1.getMatchById);
router.get('/:id/players/past', MatchController_1.getPlayersFromPastMatches);
router.post('/', MatchController_1.createMatch);
router.put('/:id', MatchController_1.updateMatch);
router.delete('/:id', MatchController_1.deleteMatch);
router.post('/:matchId/players', MatchController_1.addPlayerToMatch);
router.delete('/:matchId/players/:playerId', MatchController_1.removePlayerFromMatch);
exports.default = router;
//# sourceMappingURL=matches.js.map