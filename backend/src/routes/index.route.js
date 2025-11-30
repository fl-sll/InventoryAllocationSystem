import { Router } from 'express';
import productRoutes from './product.route.js';
import stockRoutes from './stock.route.js';
import purchaseRequestRoutes from './purchaseRequest.route.js';
import webhookRoutes from './webhook.route.js';
import warehouseRoutes from './warehouse.route.js';

const router = Router();

router.use(productRoutes);
router.use(stockRoutes);
router.use(warehouseRoutes);
router.use(purchaseRequestRoutes);
router.use(webhookRoutes);

export default router;