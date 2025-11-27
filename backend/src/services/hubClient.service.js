import axios from "axios";
import db from "../models/index.js";

const { PurchaseRequest, PurchaseRequestItem, Product } = db;

const hub = axios.create({
  baseURL: process.env.HUB_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

async function hydratePurchaseRequest(pr) {
  const include = [
    { model: PurchaseRequestItem, as: "items", include: [{ model: Product }] },
  ];

  if (pr && typeof pr.reload === "function") {
    return pr.reload({ include });
  }

  if (!pr?.id) {
    throw new Error("Purchase request id is required to notify hub");
  }

  const record = await PurchaseRequest.findByPk(pr.id, { include });
  if (!record) {
    throw new Error(`Purchase request ${pr.id} not found`);
  }

  return record;
}

export async function sendPurchaseRequestToHub(pr) {
  const prRecord = await hydratePurchaseRequest(pr);

  if (!Array.isArray(prRecord.items) || prRecord.items.length === 0) {
    throw new Error("Cannot send purchase request without line items");
  }

  const details = prRecord.items.map((item) => {
    const sku = item.Product?.sku;
    const productName = item.Product?.name;

    if (!sku) {
      throw new Error(`Missing SKU for product ${item.product_id}`);
    }
    if (!productName) {
      throw new Error(`Missing product name for product ${item.product_id}`);
    }

    return {
      product_name: productName,
      sku_barcode: sku,
      qty: item.quantity,
    };
  });

  const payload = {
    vendor: prRecord.vendor_name || "PT FOOM LAB GLOBAL",
    reference: prRecord.reference,
    qty_total: details.reduce((sum, item) => sum + item.qty, 0),
    details,
  };

  const headers = {};
  if (process.env.HUB_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.HUB_API_KEY}`;
  }

  const res = await hub.post("/purchase-requests", payload, { headers });
  return res.data;
}
