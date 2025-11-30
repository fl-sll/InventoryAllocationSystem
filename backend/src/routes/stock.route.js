import { Router } from 'express';
import { listStocks } from '../controllers/stock.controller.js';

const router = Router();

router.get('/stocks', listStocks);

export default router;
