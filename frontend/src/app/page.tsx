"use client";

import { useEffect, useMemo, useState } from "react";

type Product = { id: number; name: string; sku: string };
type Warehouse = { id: number; name: string };
type StockRow = {
  productId: number;
  productName: string;
  productSku: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
};
type PurchaseRequestListItem = {
  id: number;
  reference: string;
  vendor: string;
  status: "DRAFT" | "PENDING" | "COMPLETED";
  warehouse_id: number;
  warehouse_name?: string;
  created_at: string;
  quantity_total: number;
};
type PurchaseRequestDetail = {
  id: number;
  reference: string;
  status: "DRAFT" | "PENDING" | "COMPLETED";
  vendor_name: string;
  warehouse_id: number;
  Warehouse?: Warehouse;
  items: { id: number; product_id: number; quantity: number; Product?: Product }[];
};

type EditableItem = { productId: string; quantity: number };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch (err) {
    // ignore parse errors
  }

  if (!res.ok) {
    const message = body?.error || res.statusText || "Request failed";
    throw new Error(message);
  }

  return body as T;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestListItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequestDetail | null>(null);

  const [newRequest, setNewRequest] = useState<{ warehouseId: string; items: EditableItem[] }>(
    { warehouseId: "", items: [{ productId: "", quantity: 1 }] }
  );

  const [editDraft, setEditDraft] = useState<
    { warehouseId: string; items: EditableItem[]; status: PurchaseRequestDetail["status"] | "" }
  >({ warehouseId: "", items: [], status: "" });

  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    // default selections once products/warehouses arrive
    if (!newRequest.warehouseId && warehouses[0]) {
      setNewRequest((prev) => ({ ...prev, warehouseId: String(warehouses[0].id) }));
    }
    if (newRequest.items[0]?.productId === "" && products[0]) {
      setNewRequest((prev) => ({
        ...prev,
        items: prev.items.map((item, idx) =>
          idx === 0 ? { ...item, productId: String(products[0].id) } : item
        ),
      }));
    }
  }, [products, warehouses]);

  const refreshAll = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([
        fetchProducts(),
        fetchWarehouses(),
        fetchStocks(),
        fetchPurchaseRequests(),
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const data = await api<Product[]>("/products");
    setProducts(data);
  };

  const fetchWarehouses = async () => {
    const data = await api<Warehouse[]>("/warehouses");
    setWarehouses(data);
  };

  const fetchStocks = async () => {
    const data = await api<StockRow[]>("/stocks");
    setStocks(data);
  };

  const fetchPurchaseRequests = async () => {
    const data = await api<PurchaseRequestListItem[]>("/purchase/requests");
    setPurchaseRequests(data);
  };

  const fetchPurchaseRequestDetail = async (id: number) => {
    const detail = await api<PurchaseRequestDetail>(`/purchase/request/${id}`);
    setSelectedRequest(detail);
    setEditDraft({
      warehouseId: String(detail.warehouse_id),
      items: detail.items.map((i) => ({ productId: String(i.product_id), quantity: i.quantity })),
      status: detail.status,
    });
  };

  const handleNewItemChange = (idx: number, key: keyof EditableItem, value: string | number) => {
    setNewRequest((prev) => {
      const next = prev.items.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
      return { ...prev, items: next };
    });
  };

  const handleEditItemChange = (idx: number, key: keyof EditableItem, value: string | number) => {
    setEditDraft((prev) => {
      const next = prev.items.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
      return { ...prev, items: next };
    });
  };

  const addNewRow = (isEdit = false) => {
    if (isEdit) {
      setEditDraft((prev) => ({
        ...prev,
        items: [...prev.items, { productId: products[0] ? String(products[0].id) : "", quantity: 1 }],
      }));
    } else {
      setNewRequest((prev) => ({
        ...prev,
        items: [...prev.items, { productId: products[0] ? String(products[0].id) : "", quantity: 1 }],
      }));
    }
  };

  const removeRow = (idx: number, isEdit = false) => {
    if (isEdit) {
      setEditDraft((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    } else {
      setNewRequest((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    }
  };

  const submitNewRequest = async () => {
    try {
      setError("");
      setMessage("");
      const warehouseId = Number(newRequest.warehouseId);
      const items = newRequest.items.map((i) => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity),
      })).filter((i) => i.productId && i.quantity > 0);

      if (!warehouseId || items.length === 0) {
        setError("Please select a warehouse and add at least one item with quantity.");
        return;
      }

      await api("/purchase/request", {
        method: "POST",
        body: JSON.stringify({ warehouseId, items }),
      });

      setMessage("Purchase request created (status DRAFT)");
      setNewRequest({ warehouseId: String(warehouseId), items: [{ productId: "", quantity: 1 }] });
      await fetchPurchaseRequests();
    } catch (err: any) {
      setError(err.message || "Failed to create purchase request");
    }
  };

  const submitUpdate = async (nextStatus?: "DRAFT" | "PENDING") => {
    if (!selectedRequest) return;
    if (selectedRequest.status !== "DRAFT" && nextStatus !== "PENDING") {
      setError("Only DRAFT requests can be edited");
      return;
    }

    try {
      setError("");
      setMessage("");
      const warehouseId = Number(editDraft.warehouseId);
      const items = editDraft.items.map((i) => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity),
      })).filter((i) => i.productId && i.quantity > 0);

      if (!warehouseId || items.length === 0) {
        setError("Warehouse and items are required for updates.");
        return;
      }

      const payload: any = { warehouseId, items };
      if (nextStatus) {
        payload.status = nextStatus;
      }

      await api(`/purchase/request/${selectedRequest.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setMessage(nextStatus === "PENDING" ? "Request sent to hub (PENDING)" : "Request updated");
      await fetchPurchaseRequests();
      await fetchPurchaseRequestDetail(selectedRequest.id);
    } catch (err: any) {
      setError(err.message || "Failed to update purchase request");
    }
  };

  const deleteRequest = async (id: number) => {
    try {
      setError("");
      setMessage("");
      await api(`/purchase/request/${id}`, { method: "DELETE" });
      setMessage("Purchase request deleted");
      setSelectedRequest(null);
      await fetchPurchaseRequests();
    } catch (err: any) {
      setError(err.message || "Failed to delete purchase request");
    }
  };

  const selectRequest = async (id: number) => {
    try {
      setError("");
      await fetchPurchaseRequestDetail(id);
    } catch (err: any) {
      setError(err.message || "Failed to load purchase request");
    }
  };

  const formattedStocks = useMemo(() => stocks, [stocks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Inventory Allocation</p>
            <h1 className="text-3xl font-bold">FOOM Lab Global</h1>
            <p className="text-sm text-slate-600">Plan incoming stock, track requests, and visualize warehouse levels.</p>
          </div>
          <button
            onClick={refreshAll}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        {(error || message) && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
            {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">{message}</div>}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Stock Dashboard</h2>
              <button
                onClick={fetchStocks}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Refresh stocks
              </button>
            </div>
            <div className="overflow-auto rounded-xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Warehouse</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formattedStocks.map((row) => (
                    <tr key={`${row.warehouseId}-${row.productId}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{row.productName}</td>
                      <td className="px-4 py-3 text-slate-600">{row.productSku}</td>
                      <td className="px-4 py-3 text-slate-700">{row.warehouseName}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{row.quantity}</td>
                    </tr>
                  ))}
                  {formattedStocks.length === 0 && (
                    <tr>
                      <td className="px-4 py-3 text-center text-slate-500" colSpan={4}>
                        No stock rows yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Create Purchase Request</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Warehouse</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={newRequest.warehouseId}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, warehouseId: e.target.value }))}
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Items</p>
                  <button
                    type="button"
                    onClick={() => addNewRow(false)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add item
                  </button>
                </div>
                {newRequest.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                      value={item.productId}
                      onChange={(e) => handleNewItemChange(idx, "productId", e.target.value)}
                    >
                      <option value="">Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                      value={item.quantity}
                      onChange={(e) => handleNewItemChange(idx, "quantity", Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(idx, false)}
                      className="rounded-lg border border-slate-200 px-3 text-sm text-slate-500 hover:border-red-300 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={submitNewRequest}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                Save as Draft
              </button>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Purchase Requests</h2>
              <button
                onClick={fetchPurchaseRequests}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Refresh list
              </button>
            </div>
            <div className="overflow-auto rounded-xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Warehouse</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseRequests.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{pr.reference}</td>
                      <td className="px-4 py-3 text-slate-700">{pr.vendor}</td>
                      <td className="px-4 py-3 text-slate-700">{pr.warehouse_name || pr.warehouse_id}</td>
                      <td className="px-4 py-3 text-center font-semibold tabular-nums">{pr.quantity_total}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            pr.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700"
                              : pr.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {pr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(pr.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => selectRequest(pr.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            View
                          </button>
                          {pr.status === "DRAFT" && (
                            <button
                              onClick={() => deleteRequest(pr.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {purchaseRequests.length === 0 && (
                    <tr>
                      <td className="px-4 py-3 text-center text-slate-500" colSpan={7}>
                        No purchase requests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Request Detail</h2>
              {selectedRequest && (
                <span className="text-xs font-semibold text-slate-500">{selectedRequest.reference}</span>
              )}
            </div>
            {!selectedRequest ? (
              <p className="mt-3 text-sm text-slate-600">Select a request to edit or review.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Status</p>
                    <p className="text-sm text-slate-600">{selectedRequest.vendor_name}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedRequest.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : selectedRequest.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Warehouse</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                    value={editDraft.warehouseId}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, warehouseId: e.target.value }))}
                    disabled={selectedRequest.status !== "DRAFT"}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Items</p>
                    {selectedRequest.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => addNewRow(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        + Add item
                      </button>
                    )}
                  </div>
                  {editDraft.items.map((item, idx) => (
                    <div key={`${selectedRequest.id}-${idx}`} className="flex gap-2">
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                        value={item.productId}
                        onChange={(e) => handleEditItemChange(idx, "productId", e.target.value)}
                        disabled={selectedRequest.status !== "DRAFT"}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                        value={item.quantity}
                        onChange={(e) => handleEditItemChange(idx, "quantity", Number(e.target.value))}
                        disabled={selectedRequest.status !== "DRAFT"}
                      />
                      {selectedRequest.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => removeRow(idx, true)}
                          className="rounded-lg border border-slate-200 px-3 text-sm text-slate-500 hover:border-red-300 hover:text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  {selectedRequest.status === "DRAFT" && (
                    <button
                      onClick={() => submitUpdate()}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
                    >
                      Save changes
                    </button>
                  )}
                  {selectedRequest.status === "DRAFT" && (
                    <button
                      onClick={() => submitUpdate("PENDING")}
                      className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      Submit to hub (mark PENDING)
                    </button>
                  )}
                  {selectedRequest.status !== "DRAFT" && (
                    <p className="text-sm text-slate-600">
                      Updates are locked; status is {selectedRequest.status}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
