"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_1 = require("../controllers/PaymentController");
const router = (0, express_1.Router)();
router.get('/', PaymentController_1.getPayment);
router.get('/:id', PaymentController_1.getPaymentById);
router.post('/', PaymentController_1.createPayment);
router.put('/:id', PaymentController_1.updatePayment);
router.delete('/:id', PaymentController_1.deletePayment);
exports.default = router;
//# sourceMappingURL=payments.js.map