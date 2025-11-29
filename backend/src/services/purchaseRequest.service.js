import db from "../models/index.js";
const { PurchaseRequest, PurchaseRequestItem, Warehouse, Product, sequelize } =
  db;

function generateReference(id) {
  // Simple pattern: PR00001
  return `PR${String(id).padStart(5, "0")}`;
}

export async function createPurchaseRequest({ warehouseId, items }) {
  return sequelize.transaction(async (t) => {
    const warehouse = await Warehouse.findByPk(warehouseId, { transaction: t });
    if (!warehouse) {
      const error = new Error("Warehouse not found");
      error.status = 400;
      throw error;
    }

    const tempReference = `TEMP-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const pr = await PurchaseRequest.create(
      {
        reference: tempReference,
        warehouse_id: warehouseId,
        status: "DRAFT",
      },
      { transaction: t }
    );

    // assign reference after id known
    const reference = generateReference(pr.id);
    pr.reference = reference;
    await pr.save({ transaction: t });

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        transaction: t,
      });
      if (!product) {
        const error = new Error(`Product not found: ${item.productId}`);
        error.status = 400;
        throw error;
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        const error = new Error("Quantity must be a positive integer");
        error.status = 400;
        throw error;
      }

      await PurchaseRequestItem.create(
        {
          purchase_request_id: pr.id,
          product_id: item.productId,
          quantity: item.quantity,
        },
        { transaction: t }
      );
    }

    return pr;
  });
}

export async function getPurchaseRequest(id) {
  const pr = await PurchaseRequest.findByPk(id, {
    include: [
      {
        model: PurchaseRequestItem,
        as: "items",
        include: [{ model: Product }],
      },
      { model: Warehouse },
    ],
  });

  if (!pr) {
    const error = new Error("Purchase request not found");
    error.status = 404;
    throw error;
  }

  return pr;
}

export async function updatePurchaseRequest(id, payload) {
  return sequelize.transaction(async (t) => {
    const pr = await PurchaseRequest.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!pr) {
      const error = new Error("Purchase request not found");
      error.status = 404;
      throw error;
    }

    if (pr.status !== "DRAFT") {
      const error = new Error("Only DRAFT purchase requests can be updated");
      error.status = 400;
      throw error;
    }

    const { warehouseId, items, status } = payload;

    if (warehouseId) {
      const wh = await Warehouse.findByPk(warehouseId, { transaction: t });
      if (!wh) {
        const error = new Error("Warehouse not found");
        error.status = 400;
        throw error;
      }
      pr.warehouse_id = warehouseId;
    }

    if (items) {
      await PurchaseRequestItem.destroy({
        where: { purchase_request_id: pr.id },
        transaction: t,
      });

      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction: t,
        });
        if (!product) {
          const error = new Error(`Product not found: ${item.productId}`);
          error.status = 400;
          throw error;
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          const error = new Error("Quantity must be a positive integer");
          error.status = 400;
          throw error;
        }

        await PurchaseRequestItem.create(
          {
            purchase_request_id: pr.id,
            product_id: item.productId,
            quantity: item.quantity,
          },
          { transaction: t }
        );
      }
    }

    let needHubCall = false;

    if (status) {
      if (!["DRAFT", "PENDING", "COMPLETED"].includes(status)) {
        const error = new Error("Invalid status");
        error.status = 400;
        throw error;
      }

      // cannot set COMPLETED here (only webhook does that)
      if (status === "COMPLETED") {
        const error = new Error("Status cannot be directly set to COMPLETED");
        error.status = 400;
        throw error;
      }

      if (status === "PENDING") {
        needHubCall = true;
      }

      pr.status = status;
    }

    await pr.save({ transaction: t });

    await pr.reload({
      include: [{ model: PurchaseRequestItem, as: "items" }],
      transaction: t,
    });

    return { pr, needHubCall };
  });
}

export async function deletePurchaseRequest(id) {
  return sequelize.transaction(async (t) => {
    const pr = await PurchaseRequest.findByPk(id, { transaction: t });

    if (!pr) {
      const error = new Error("Purchase request not found");
      error.status = 404;
      throw error;
    }

    if (pr.status !== "DRAFT") {
      const error = new Error("Only DRAFT purchase requests can be deleted");
      error.status = 400;
      throw error;
    }

    await PurchaseRequestItem.destroy({
      where: { purchase_request_id: id },
      transaction: t,
    });

    await pr.destroy({ transaction: t });
  });
}

export async function listPurchaseRequests() {
  // For frontend list (with total qty)
  const prs = await PurchaseRequest.findAll({
    include: [
      { model: PurchaseRequestItem, as: "items" },
      { model: Warehouse },
    ],
  });

  return prs.map((pr) => ({
    id: pr.id,
    reference: pr.reference,
    vendor: pr.vendor_name,
    status: pr.status,
    warehouse_id: pr.warehouse_id,
    warehouse_name: pr.Warehouse?.name,
    created_at: pr.createdAt,
    quantity_total: pr.items.reduce((sum, i) => sum + i.quantity, 0),
  }));
}
