"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  ArrowLeft,
} from "lucide-react";
import useUser from "@/utils/useUser";

export default function BillingPage() {
  const { data: user, loading: userLoading } = useUser();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch("/api/subscription/manage");
        if (!response.ok) {
          throw new Error("Failed to fetch subscription data");
        }
        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading && user) {
      fetchSubscriptionData();
    }
  }, [user, userLoading]);

  const handleSubscriptionAction = async (action) => {
    setActionLoading(action);
    setError("");

    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      const result = await response.json();

      if (action === "create_portal_session" && result.url) {
        window.location.href = result.url;
        return;
      }

      // Refresh subscription data
      const refreshResponse = await fetch("/api/subscription/manage");
      const refreshedData = await refreshResponse.json();
      setSubscriptionData(refreshedData);

      if (result.message) {
        alert(result.message);
      }
    } catch (err) {
      console.error("Error performing action:", err);
      setError("Failed to perform action. Please try again.");
    } finally {
      setActionLoading("");
    }
  };

  const handleUpgrade = async (plan) => {
    setActionLoading("upgrade");
    try {
      const response = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          redirectURL: window.location.origin + "/dashboard/billing",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Error starting checkout:", err);
      setError("Failed to start checkout. Please try again.");
    } finally {
      setActionLoading("");
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing information...</p>
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

  const { subscription, profile } = subscriptionData || {};
  const currentPlan = profile?.plan_type || "free";
  const subscriptionStatus = profile?.subscription_status || "inactive";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </a>
            <h1 className="text-xl font-semibold text-gray-900">
              Billing & Subscription
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Current Subscription */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Current Subscription
            </h2>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold capitalize text-indigo-600">
                  {currentPlan} Plan
                </h3>
                <div className="flex items-center mt-1">
                  {subscriptionStatus === "active" && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Active</span>
                    </div>
                  )}
                  {subscriptionStatus === "past_due" && (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Payment Required</span>
                    </div>
                  )}
                  {subscriptionStatus === "inactive" && (
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Free Plan</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <CreditCard className="h-12 w-12 text-gray-300 mr-4" />
                {subscription && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatAmount(
                        subscription.plan_amount,
                        subscription.plan_currency,
                      )}
                      <span className="text-sm font-normal text-gray-500">
                        /{subscription.plan_interval}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {subscription && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current period</p>
                    <p className="font-medium">
                      {formatDate(subscription.current_period_start)} -{" "}
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">
                      {subscription.status}
                    </p>
                    {subscription.cancel_at_period_end && (
                      <p className="text-sm text-red-600">
                        Cancels at period end
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {subscription && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() =>
                    handleSubscriptionAction("create_portal_session")
                  }
                  disabled={actionLoading === "create_portal_session"}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {actionLoading === "create_portal_session"
                    ? "Loading..."
                    : "Manage Billing"}
                </button>

                {subscription?.cancel_at_period_end ? (
                  <button
                    onClick={() =>
                      handleSubscriptionAction("reactivate_subscription")
                    }
                    disabled={actionLoading === "reactivate_subscription"}
                    className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "reactivate_subscription"
                      ? "Processing..."
                      : "Reactivate Subscription"}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleSubscriptionAction("cancel_subscription")
                    }
                    disabled={actionLoading === "cancel_subscription"}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {actionLoading === "cancel_subscription"
                      ? "Processing..."
                      : "Cancel Subscription"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Available Plans */}
        {currentPlan === "free" && (
          <div className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Upgrade Your Plan
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Professional Plan */}
              <div className="border-2 border-indigo-600 rounded-2xl bg-white p-8 shadow relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
                  Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Professional
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">
                    $49.99
                  </span>
                  <span className="ml-2 text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">
                  Perfect for growing businesses
                </p>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    500 products
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    2,000 notifications/month
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    SMS notifications
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    AI Assistant
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Email support
                  </li>
                </ul>

                <button
                  onClick={() => handleUpgrade("professional")}
                  disabled={actionLoading === "upgrade"}
                  className="mt-8 w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === "upgrade"
                    ? "Processing..."
                    : "Upgrade to Professional"}
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="border-2 border-gray-200 rounded-2xl bg-white p-8 shadow">
                <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">
                    $149.99
                  </span>
                  <span className="ml-2 text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-gray-600">For large scale operations</p>

                <ul className="mt-8 space-y-4">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Unlimited products
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    10,000 notifications/month
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Dedicated support
                  </li>
                </ul>

                <button
                  onClick={() => handleUpgrade("enterprise")}
                  disabled={actionLoading === "upgrade"}
                  className="mt-8 w-full border-2 border-indigo-600 text-indigo-600 rounded-lg py-3 font-semibold hover:bg-indigo-50 disabled:opacity-50"
                >
                  {actionLoading === "upgrade"
                    ? "Processing..."
                    : "Upgrade to Enterprise"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">Need help choosing?</h3>
          <p className="mt-2 text-blue-700">
            All plans include secure hosting, automatic backups, and 99.9%
            uptime guarantee. You can upgrade or downgrade at any time.
          </p>
        </div>
      </main>
    </div>
  );
}
