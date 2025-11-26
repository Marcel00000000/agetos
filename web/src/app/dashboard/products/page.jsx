"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  Package,
  Plus,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Edit3,
  Clock,
} from "lucide-react";

export default function ProductsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    product_name: "",
    sku: "",
    original_release_date: "",
    current_estimated_date: "",
    supplier: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    if (!userLoading && user) {
      fetchProducts();
    }
  }, [user, userLoading]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingProduct ? "PUT" : "POST";
      const body = editingProduct
        ? { ...formData, id: editingProduct.id }
        : formData;

      const response = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setFormData({
          product_name: "",
          sku: "",
          original_release_date: "",
          current_estimated_date: "",
          supplier: "",
          description: "",
          price: "",
        });
        setShowAddForm(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      product_name: product.product_name,
      sku: product.sku || "",
      original_release_date: product.original_release_date?.split("T")[0] || "",
      current_estimated_date:
        product.current_estimated_date?.split("T")[0] || "",
      supplier: product.supplier || "",
      description: product.description || "",
      price: product.price || "",
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const getStatusColor = (product) => {
    const now = new Date();
    const estimatedDate = new Date(product.current_estimated_date);

    if (estimatedDate < now && product.status === "pre_order") {
      return "bg-red-100 text-red-800";
    }
    if (product.status === "shipped") {
      return "bg-green-100 text-green-800";
    }
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (product) => {
    const now = new Date();
    const estimatedDate = new Date(product.current_estimated_date);

    if (estimatedDate < now && product.status === "pre_order") {
      return "Delayed";
    }
    return product.status
      .replace("_", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
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
                <Package className="h-6 w-6 text-indigo-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Products
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingProduct(null);
                setFormData({
                  product_name: "",
                  sku: "",
                  original_release_date: "",
                  current_estimated_date: "",
                  supplier: "",
                  description: "",
                  price: "",
                });
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Add/Edit Product Form */}
        {showAddForm && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_name: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Original Release Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.original_release_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        original_release_date: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Estimated Date
                  </label>
                  <input
                    type="date"
                    value={formData.current_estimated_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        current_estimated_date: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplier: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Products ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No products yet
              </h3>
              <p className="mt-2 text-gray-600">
                Add your first pre-order product to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Pre-Orders
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {product.product_name}
                          </p>
                          {product.sku && (
                            <p className="text-sm text-gray-600">
                              SKU: {product.sku}
                            </p>
                          )}
                          {product.supplier && (
                            <p className="text-sm text-gray-600">
                              Supplier: {product.supplier}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(product)}`}
                        >
                          {getStatusText(product)}
                        </span>
                        {new Date(product.current_estimated_date) <
                          new Date() &&
                          product.status === "pre_order" && (
                            <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              Needs attention
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p>
                            <span className="font-medium">Original:</span>{" "}
                            {new Date(
                              product.original_release_date,
                            ).toLocaleDateString()}
                          </p>
                          <p>
                            <span className="font-medium">Current:</span>{" "}
                            {new Date(
                              product.current_estimated_date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-semibold">
                            {product.pre_order_count || 0} orders
                          </p>
                          <p className="text-gray-600">
                            {product.total_quantity || 0} items
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
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
