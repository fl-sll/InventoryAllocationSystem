import db from "../models/index.js";
const { Stock, Product, Warehouse } = db;

export async function listStocks() {
  const stocks = await Stock.findAll({
    include: [{ model: Product }, { model: Warehouse }],
    order: [
      ["warehouse_id", "ASC"],
      ["product_id", "ASC"],
    ],
  });

  return stocks.map((s) => ({
    productId: s.product_id,
    productName: s.Product.name,
    productSku: s.Product.sku,
    warehouseId: s.warehouse_id,
    warehouseName: s.Warehouse.name,
    quantity: s.quantity,
  }));
}
