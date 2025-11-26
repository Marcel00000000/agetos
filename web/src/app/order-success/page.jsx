"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Package,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  Home,
  ShoppingBag,
} from "lucide-react";
import Header from "../../components/Header";
import Breadcrumbs from "../../components/Breadcrumbs";
import Footer from "../../components/Footer";

export default function OrderSuccessPage() {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (sessionId) {
      verifyOrder(sessionId);
    } else {
      setError("No order session found");
      setLoading(false);
    }
  }, []);

  const verifyOrder = async (sessionId) => {
    try {
      const response = await fetch(
        `/api/pre-orders/checkout?session_id=${sessionId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setOrderData(data);
      } else {
        setError("Failed to verify order");
      }
    } catch (error) {
      setError("Failed to load order information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPath="/order-success" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying your order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderData?.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPath="/order-success" />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Order Verification Failed
              </h1>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {error || "There was an issue verifying your order."}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-6">
                If you completed a payment, please contact support with your
                session details.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/browse"
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Browse Products
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Home className="h-4 w-4" />
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
        <Footer showFullFooter={false} />
      </div>
    );
  }

  const { pre_order, session } = orderData;
  const breadcrumbs = [{ label: "Order Confirmation", href: "/order-success" }];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPath="/order-success" />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
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

        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Pre-Order Confirmed!
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Thank you for your pre-order. We'll keep you updated on the status.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Details
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Order Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium text-gray-900 break-all">
                      {pre_order.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(pre_order.order_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Pre-Order Confirmed
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-900 break-all">
                      {pre_order.customer_email}
                    </span>
                  </div>
                  {pre_order.customer_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">
                        {pre_order.customer_name}
                      </span>
                    </div>
                  )}
                  {pre_order.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {pre_order.customer_phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Summary
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium text-gray-900">
                  {pre_order.quantity}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                <span>Total Paid:</span>
                <span className="text-green-600">
                  ${pre_order.payment_amount}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Payment completed successfully
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              What Happens Next?
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Confirmation Email
                  </p>
                  <p className="text-sm text-gray-600">
                    You'll receive a confirmation email with all the order
                    details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Status Updates</p>
                  <p className="text-sm text-gray-600">
                    We'll notify you if there are any changes to the estimated
                    delivery date.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Fulfillment Notice
                  </p>
                  <p className="text-sm text-gray-600">
                    When your item is ready to ship, you'll receive tracking
                    information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Questions about your order?
          </h3>
          <p className="text-blue-800 text-sm">
            Save this page for your records or contact us using the email
            address you provided. We'll be happy to help with any questions
            about your pre-order.
          </p>
        </div>

        {/* Action Buttons at the end */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/browse"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse More Products
          </a>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </a>
        </div>

        {/* Print/Save Options */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Print This Page
          </button>
        </div>
      </div>

      <Footer showFullFooter={false} />
    </div>
  );
}
