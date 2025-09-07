"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlayerController_1 = require("../controllers/PlayerController");
const router = (0, express_1.Router)();
router.get('/', PlayerController_1.getAllPlayer);
router.get('/:id', PlayerController_1.getPlayerById);
router.post('/', PlayerController_1.createPlayer);
router.put('/:id', PlayerController_1.updatePlayer);
router.delete('/:id', PlayerController_1.deletePlayer);
exports.default = router;
//# sourceMappingURL=players.js.map