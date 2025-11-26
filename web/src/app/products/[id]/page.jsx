"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import Header from "../../../components/Header";
import Breadcrumbs from "../../../components/Breadcrumbs";
import Footer from "../../../components/Footer";

export default function ProductPage({ params }) {
  const { id } = params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    customer_email: "",
    customer_name: "",
    customer_phone: "",
    quantity: 1,
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else {
        setError("Product not found");
      }
    } catch (error) {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrdering(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/pre-orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: parseInt(id),
          ...formData,
          success_url: `${window.location.origin}/order-success`,
          cancel_url: window.location.href,
        }),
      });

      if (response.ok) {
        const { checkout_url } = await response.json();
        window.location.href = checkout_url;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create order");
      }
    } catch (error) {
      setError("Failed to process order");
    } finally {
      setOrdering(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPath={`/products/${id}`} />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
        <Footer showFullFooter={false} />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPath={`/products/${id}`} />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Product Not Found
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/browse"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
              >
                <ShoppingBag className="h-4 w-4" />
                Browse Other Products
              </a>
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </a>
            </div>
          </div>
        </div>
        <Footer showFullFooter={false} />
      </div>
    );
  }

  const isAvailable = product?.status === "pre_order" && product?.price;
  const estimatedDate =
    product?.current_estimated_date || product?.original_release_date;

  const breadcrumbs = [
    { label: "Browse Products", href: "/browse" },
    { label: product?.product_name || "Product", href: `/products/${id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPath={`/products/${id}`} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} />

        {/* Back button for mobile */}
        <div className="sm:hidden mb-6">
          <a
            href="/browse"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </a>
        </div>

        {/* Product Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="h-24 w-24 sm:h-32 sm:w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {product?.product_name}
                </h1>

                {product?.description && (
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
                    {product.description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center sm:text-left">
                    <span className="text-sm font-medium text-gray-600">
                      Price
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      ${product?.price?.toFixed(2)}
                    </p>
                  </div>

                  <div className="text-center sm:text-left">
                    <span className="text-sm font-medium text-gray-600">
                      Status
                    </span>
                    <p className="text-base sm:text-lg font-medium text-indigo-600 capitalize">
                      {product?.status?.replace("_", " ")}
                    </p>
                  </div>

                  {estimatedDate && (
                    <div className="text-center sm:text-left">
                      <span className="text-sm font-medium text-gray-600">
                        Estimated Date
                      </span>
                      <p className="text-base sm:text-lg font-medium text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(estimatedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {product?.sku && (
                  <div className="mt-4 text-center sm:text-left">
                    <span className="text-sm font-medium text-gray-600">
                      SKU:{" "}
                    </span>
                    <span className="text-sm text-gray-900">{product.sku}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center sm:justify-start gap-3">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              Place Pre-Order
            </h2>

            {!isAvailable ? (
              <div className="p-4 sm:p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      Pre-orders not available
                    </p>
                    <p className="text-sm text-yellow-700">
                      This product is not currently available for pre-order or
                      pricing is not set.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-800 text-sm sm:text-base">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-green-800 text-sm sm:text-base">
                        {success}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                      Order Summary
                    </h3>
                    <div className="space-y-2 text-sm sm:text-base">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {product.product_name}
                        </span>
                        <span className="font-medium">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity</span>
                        <span className="font-medium">{formData.quantity}</span>
                      </div>
                      <div className="flex justify-between text-base sm:text-lg font-bold border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>
                          ${(product.price * formData.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm leading-relaxed">
                      🔒 Your payment will be processed securely through Stripe.
                      You'll receive email updates about your pre-order status
                      and estimated delivery dates.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={ordering}
                    className="w-full bg-indigo-600 text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {ordering ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processing...
                      </div>
                    ) : (
                      `Pre-Order Now - $${(product.price * formData.quantity).toFixed(2)}`
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pre-Order Information
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              • Pre-orders help ensure you receive the item when it becomes
              available
            </p>
            <p>
              • You'll be charged the full amount at the time of placing your
              order
            </p>
            <p>
              • We'll send you updates if the estimated delivery date changes
            </p>
            <p>
              • If you have questions, you can contact us using the email you
              provide
            </p>
          </div>
        </div>
      </div>

      <Footer showFullFooter={false} />
    </div>
  );
}
