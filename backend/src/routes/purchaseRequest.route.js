import { Router } from 'express';
import {
  createPurchaseRequestHandler,
  deletePurchaseRequestHandler,
  getPurchaseRequestHandler,
  listPurchaseRequestsHandler,
  updatePurchaseRequestHandler,
} from '../controllers/purchaseRequest.controller.js';

const router = Router();

router.get('/purchase/requests', listPurchaseRequestsHandler);
router.get('/purchase/request/:id', getPurchaseRequestHandler);
router.post('/purchase/request', createPurchaseRequestHandler);
router.put('/purchase/request/:id', updatePurchaseRequestHandler);
router.delete('/purchase/request/:id', deletePurchaseRequestHandler);

export default router;
