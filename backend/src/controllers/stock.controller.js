import db from "../models/index.js";

const { Stock, Product, Warehouse } = db;

export async function listStocks(_req, res, next) {
  try {
    const stocks = await Stock.findAll({
      include: [
        { model: Product, attributes: ["id", "name", "sku"] },
        { model: Warehouse, attributes: ["id", "name"] },
      ],
      order: [
        ["warehouse_id", "ASC"],
        ["product_id", "ASC"],
      ],
    });

    const response = stocks.map((row) => ({
      warehouseId: row.warehouse_id,
      warehouseName: row.Warehouse?.name,
      productId: row.product_id,
      productName: row.Product?.name,
      sku: row.Product?.sku,
      quantity: row.quantity,
    }));

    res.json(response);
  } catch (err) {
    next(err);
  }
}
