"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  Users,
  Plus,
  Mail,
  Phone,
  ArrowLeft,
  Calendar,
  Package,
  Bell,
} from "lucide-react";

export default function OrdersPage() {
  const { data: user, loading: userLoading } = useUser();
  const [preOrders, setPreOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    order_number: "",
    quantity: 1,
  });

  useEffect(() => {
    if (!userLoading && user) {
      fetchPreOrders();
      fetchProducts();
    }
  }, [user, userLoading]);

  const fetchPreOrders = async () => {
    try {
      const response = await fetch("/api/pre-orders");
      if (response.ok) {
        const data = await response.json();
        setPreOrders(data.preOrders);
      }
    } catch (error) {
      console.error("Error fetching pre-orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/pre-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          product_id: "",
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          order_number: "",
          quantity: 1,
        });
        setShowAddForm(false);
        fetchPreOrders();
      }
    } catch (error) {
      console.error("Error saving pre-order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkNotify = async () => {
    if (selectedOrders.size === 0) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_order_ids: Array.from(selectedOrders),
          notification_type: "email",
        }),
      });

      if (response.ok) {
        alert("Notifications sent successfully!");
        setSelectedOrders(new Set());
        fetchPreOrders();
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      alert("Failed to send notifications");
    }
  };

  const getStatusColor = (order) => {
    switch (order.status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "notified":
        return "bg-yellow-100 text-yellow-800";
      case "fulfilled":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </a>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-indigo-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Pre-Orders
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {selectedOrders.size > 0 && (
                <button
                  onClick={handleBulkNotify}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                >
                  <Bell className="h-5 w-5" />
                  Notify Selected ({selectedOrders.size})
                </button>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5" />
                Add Order
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Add Order Form */}
        {showAddForm && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Add New Pre-Order
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product *
                  </label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_id: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.product_name}{" "}
                        {product.sku && `(${product.sku})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_name: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_email: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_phone: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={formData.order_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order_number: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  Add Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders List */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pre-Orders ({preOrders.length})
            </h2>
          </div>

          {preOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No pre-orders yet
              </h3>
              <p className="mt-2 text-gray-600">
                Add your first customer pre-order to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(
                              new Set(preOrders.map((o) => o.id)),
                            );
                          } else {
                            setSelectedOrders(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Expected Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.customer_name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {order.customer_email}
                            </span>
                            {order.customer_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {order.customer_phone}
                              </span>
                            )}
                          </div>
                          {order.order_number && (
                            <p className="text-sm text-gray-600">
                              Order #{order.order_number}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {order.product_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Qty: {order.quantity}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order)}`}
                        >
                          {order.status
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        {order.last_notification_sent && (
                          <p className="mt-1 text-xs text-gray-500">
                            Last notified:{" "}
                            {new Date(
                              order.last_notification_sent,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.order_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(
                            order.current_estimated_date,
                          ).toLocaleDateString()}
                        </div>
                        {new Date(order.current_estimated_date) !==
                          new Date(order.original_release_date) && (
                          <p className="text-xs text-orange-600">
                            (Originally:{" "}
                            {new Date(
                              order.original_release_date,
                            ).toLocaleDateString()}
                            )
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
