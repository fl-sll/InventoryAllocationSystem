import db from "../models/index.js";
const { PurchaseRequest, PurchaseRequestItem, Stock, Product, sequelize } = db;
const { Transaction } = db.Sequelize;

// payload example shape:
/*
{
  "vendor": "PT FOOM LAB GLOBAL",
  "reference": "PR00001",
  "qty_total": 20,
  "details": [
    {
      "product_name": "ICY MINT",
      "sku_barcode": "ICYMINT",
      "qty": 10
    },
    {
      "product_name": "ICY WATERMELON",
      "sku_barcode": "ICYWATERMELON",
      "qty": 10
    }
  ]
}
*/

function extractPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") {
    return {};
  }

  if (rawPayload.data && typeof rawPayload.data === "object") {
    return {
      vendor: rawPayload.vendor ?? rawPayload.data.vendor,
      reference: rawPayload.data.reference,
      qty_total: rawPayload.data.qty_total,
      details: rawPayload.data.details,
    };
  }

  return rawPayload;
}

export async function handleReceiveStockWebhook(payload) {
  const normalized = extractPayload(payload);
  const { reference, qty_total, details, vendor } = normalized || {};
  if (!reference || !Array.isArray(details) || details.length === 0) {
    const error = new Error("Invalid payload");
    error.status = 400;
    throw error;
  }

  if (typeof qty_total !== "undefined") {
    const detailSum = details.reduce(
      (sum, item) => sum + Number(item?.qty || 0),
      0
    );
    if (Number(qty_total) !== detailSum) {
      const error = new Error("qty_total does not match detailed quantities");
      error.status = 400;
      throw error;
    }
  }

  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async (t) => {
      const pr = await PurchaseRequest.findOne({
        where: { reference },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!pr) {
        const error = new Error("Purchase request reference not found");
        error.status = 404;
        throw error;
      }

      if (vendor && pr.vendor_name && vendor !== pr.vendor_name) {
        const error = new Error("Vendor mismatch for this purchase request");
        error.status = 400;
        throw error;
      }

      if (pr.status === "COMPLETED") {
        return { skipped: true, message: "Already processed" };
      }

      if (pr.status !== "PENDING") {
        const error = new Error(
          "Purchase request must be PENDING to process stock"
        );
        error.status = 400;
        throw error;
      }

      const warehouseId = pr.warehouse_id;

      for (const item of details) {
        const { sku_barcode, qty } = item;
        const quantity = Number(qty);
        if (!sku_barcode || Number.isNaN(quantity) || quantity <= 0) {
          const error = new Error("Invalid item detail in payload");
          error.status = 400;
          throw error;
        }
        const product = await Product.findOne({
          where: { sku: sku_barcode },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!product) {
          const error = new Error(`Product with SKU ${sku_barcode} not found`);
          error.status = 400;
          throw error;
        }

        let stock = await Stock.findOne({
          where: {
            warehouse_id: warehouseId,
            product_id: product.id,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!stock) {
          stock = await Stock.create(
            {
              warehouse_id: warehouseId,
              product_id: product.id,
              quantity: 0,
            },
            { transaction: t }
          );
        }

        stock.quantity += quantity;
        await stock.save({ transaction: t });
      }

      pr.status = "COMPLETED";
      await pr.save({ transaction: t });

      return { skipped: false };
    }
  );
}
