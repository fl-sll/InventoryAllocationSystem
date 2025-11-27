import { Router } from 'express';
import { listWarehousesHandler } from '../controllers/warehouse.controller.js';

const router = Router();

router.get('/warehouses', listWarehousesHandler);

export default router;