"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  ArrowLeft,
  Save,
  Key,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";

export default function SettingsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [crewAiToken, setCrewAiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      fetchProfile();
      fetchStripeStatus();
    }
  }, [user, userLoading]);

  // Check URL params for Stripe setup status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("setup") === "stripe") {
      if (urlParams.get("success") === "true") {
        setMessage({
          type: "success",
          text: "Stripe account setup completed successfully!",
        });
        fetchStripeStatus();
      } else if (urlParams.get("refresh") === "true") {
        setMessage({
          type: "error",
          text: "Please complete your Stripe account setup to receive payments.",
        });
        fetchStripeStatus();
      }
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setCrewAiToken(data.profile?.crew_ai_token || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch("/api/stripe-connect/status");
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crew_ai_token: crewAiToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe-connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_url: `${window.location.origin}/dashboard/settings?setup=stripe&refresh=true`,
          return_url: `${window.location.origin}/dashboard/settings?setup=stripe&success=true`,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Failed to setup Stripe account",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to setup Stripe account" });
    } finally {
      setStripeLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </a>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Payment Setup */}
          <div className="rounded-lg bg-white p-8 shadow">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-indigo-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Payment Setup
                </h2>
                <p className="mt-2 text-gray-600">
                  Connect your Stripe account to receive payments from customers
                </p>
              </div>
            </div>

            {stripeStatus ? (
              stripeStatus.connected && stripeStatus.charges_enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          Payments Enabled
                        </p>
                        <p className="text-sm text-green-700">
                          You can now receive payments from customers
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Status:</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee:</span>
                      <span className="font-medium">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span className="font-medium">
                        {stripeStatus.country?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">
                        {stripeStatus.default_currency?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={fetchStripeStatus}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Status
                  </button>
                </div>
              ) : stripeStatus.connected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">
                          Setup Required
                        </p>
                        <p className="text-sm text-yellow-700">
                          Complete your Stripe account setup to receive payments
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStripeConnect}
                    disabled={stripeLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {stripeLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        Complete Setup
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800">
                      Connect your Stripe account to start receiving payments
                      from customers for pre-orders.
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      We collect a 5% platform fee on each transaction.
                    </p>
                  </div>

                  <button
                    onClick={handleStripeConnect}
                    disabled={stripeLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {stripeLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Connect Stripe Account
                      </>
                    )}
                  </button>
                </div>
              )
            ) : (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            )}
          </div>

          {/* API Configuration */}
          <div className="rounded-lg bg-white p-8 shadow">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                API Configuration
              </h2>
              <p className="mt-2 text-gray-600">
                Configure your Crew AI token to enable AI agent functionality
              </p>
            </div>

            <div className="space-y-6">
              {/* Crew AI Token */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Key className="h-4 w-4" />
                  Crew AI Bearer Token
                </label>
                <input
                  type="text"
                  value={crewAiToken}
                  onChange={(e) => setCrewAiToken(e.target.value)}
                  placeholder="Enter your Crew AI token (e.g., d50848c5037b)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Your Crew AI token is used to authenticate requests to the
                  Crew AI API. If not provided, the system will use ChatGPT as a
                  fallback.
                </p>
              </div>

              {/* Account Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Email:
                    </span>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Plan:
                    </span>
                    <p className="capitalize text-gray-900">
                      {profile?.plan_type || "Free"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <p className="capitalize text-gray-900">
                      {profile?.subscription_status || "Inactive"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end border-t border-gray-200 pt-6">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  {loading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
