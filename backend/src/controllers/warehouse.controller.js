import { listWarehouses } from '../services/warehouse.service.js';

export async function listWarehousesHandler(_req, res, next) {
  try {
    const data = await listWarehouses();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

