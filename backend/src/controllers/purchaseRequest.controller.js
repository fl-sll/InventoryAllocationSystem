import {
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
  listPurchaseRequests,
  getPurchaseRequest,
} from "../services/purchaseRequest.service.js";
import { sendPurchaseRequestToHub } from "../services/hubClient.service.js";

export async function createPurchaseRequestHandler(req, res, next) {
  try {
    const { warehouseId, items } = req.body;
    if (!warehouseId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "warehouseId and items are required" });
    }

    const pr = await createPurchaseRequest({ warehouseId, items });
    res.status(201).json(pr);
  } catch (err) {
    next(err);
  }
}

export async function updatePurchaseRequestHandler(req, res, next) {
  try {
    const id = req.params.id;
    const { warehouseId, items, status } = req.body;

    const { pr, needHubCall } = await updatePurchaseRequest(id, {
      warehouseId,
      items,
      status,
    });

    let hubResponse = null;
    if (needHubCall) {
      try {
        hubResponse = await sendPurchaseRequestToHub(pr);
      } catch (hubErr) {
        hubResponse = { error: hubErr.message };
      }
    }

    res.json({ purchaseRequest: pr, hubResponse });
  } catch (err) {
    next(err);
  }
}

export async function deletePurchaseRequestHandler(req, res, next) {
  try {
    const id = req.params.id;
    await deletePurchaseRequest(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listPurchaseRequestsHandler(_req, res, next) {
  try {
    const prs = await listPurchaseRequests();
    res.json(prs);
  } catch (err) {
    next(err);
  }
}

export async function getPurchaseRequestHandler(req, res, next) {
  try {
    const pr = await getPurchaseRequest(req.params.id);
    res.json(pr);
  } catch (err) {
    next(err);
  }
}
