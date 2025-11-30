import db from "../models/index.js";
const { Product } = db;

export async function listProducts() {
  return Product.findAll({ order: [["id", "ASC"]] });
}
