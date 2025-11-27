import { Router } from 'express';
import { receiveStock } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/receive-stock', receiveStock);

export default router;