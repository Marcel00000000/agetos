"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  Bot,
  Package,
  MessageCircle,
  Settings,
  CreditCard,
  LogOut,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const { data: user, loading: userLoading } = useUser();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!userLoading && user) {
      fetchStats();
      fetchSubscription();
    }
  }, [user, userLoading]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/status");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  if (userLoading || loadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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

  const notificationUsage = stats?.monthly_notifications || 0;
  const notificationLimit =
    subscription?.plan === "Starter"
      ? 100
      : subscription?.plan === "Professional"
        ? 2000
        : subscription?.plan === "Enterprise"
          ? 10000
          : 100;
  const usagePercentage = Math.min(
    (notificationUsage / notificationLimit) * 100,
    100,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">
                PreOrder Pro
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <a
                href="/account/logout"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to PreOrder Pro!
          </h1>
          <p className="mt-2 text-gray-600">
            Automate your pre-order delay communications and keep customers
            informed.
          </p>
        </div>

        {/* Upgrade Banner */}
        {subscription && subscription.plan === "Starter" && (
          <div className="mb-8 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-indigo-900">
                  Upgrade to unlock SMS notifications & advanced features
                </h3>
                <p className="mt-1 text-indigo-700">
                  Send SMS alerts, create custom templates, and get analytics
                </p>
              </div>
              <a
                href="/dashboard/billing"
                className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        )}

        {/* Delayed Products Alert */}
        {stats?.delayed_products > 0 && (
          <div className="mb-8 rounded-lg border-2 border-red-200 bg-red-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    {stats.delayed_products} product(s) need delay notifications
                  </h3>
                  <p className="mt-1 text-red-700">
                    Some pre-orders are past their estimated dates
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/products"
                className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
              >
                Review Products
              </a>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          {/* Active Pre-Orders */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Pre-Orders
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats?.active_preorders || 0}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Awaiting fulfillment
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Monthly Notifications */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Notifications Sent
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {notificationUsage}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  of {notificationLimit} limit
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Delayed Products */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Delayed Products
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {stats?.delayed_products || 0}
                </p>
                <p className="mt-1 text-sm text-gray-500">Need attention</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Response Rate
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats?.response_rate || "95"}%
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Customer satisfaction
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <a
            href="/dashboard/products"
            className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-indigo-600 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 group-hover:bg-indigo-600">
                <Package className="h-6 w-6 text-indigo-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Manage Products
                </h3>
                <p className="text-sm text-gray-600">
                  Add pre-order items and set dates
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/orders"
            className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-indigo-600 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-indigo-600">
                <Users className="h-6 w-6 text-green-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Orders
                </h3>
                <p className="text-sm text-gray-600">
                  View and manage pre-orders
                </p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard/agent"
            className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-indigo-600 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-indigo-600">
                <Bot className="h-6 w-6 text-purple-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Assistant
                </h3>
                <p className="text-sm text-gray-600">
                  Get help with notifications
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {stats?.recent_notifications?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {notification.type === "delay"
                              ? "Delay notification sent"
                              : "Notification sent"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {notification.customer_email} •{" "}
                            {notification.product_name}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No notifications sent yet. Start by adding products and
                  pre-orders!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
