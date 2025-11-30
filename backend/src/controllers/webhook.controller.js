import { handleReceiveStockWebhook } from '../services/webhook.service.js';

function buildApiId() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0];
  return `API_${timestamp}`;
}

export async function receiveStock(req, res, next) {
  try {
    const result = await handleReceiveStockWebhook(req.body);
    const responseBody = {
      API_ID: buildApiId(),
      status: 202,
      message: result.skipped
        ? 'Purchase request already processed.'
        : 'Purchase request accepted. Processing flow started.',
    };
    res.status(202).json(responseBody);
  } catch (err) {
    next(err);
  }
}
