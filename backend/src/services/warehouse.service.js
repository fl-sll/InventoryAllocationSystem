import db from '../models/index.js';

const { Warehouse } = db;

export async function listWarehouses() {
  return Warehouse.findAll({ order: [['id', 'ASC']] });
}

