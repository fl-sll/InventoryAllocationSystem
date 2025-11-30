import db from '../models/index.js';

const { Product } = db;

export async function listProducts(_req, res, next) {
  try {
    const products = await Product.findAll({ order: [['id', 'ASC']] });
    res.json(products);
  } catch (err) {
    next(err);
  }
}