"use client";

import { useState, useEffect, useCallback } from "react";
import useUser from "@/utils/useUser";
import {
  Bot,
  Send,
  ArrowLeft,
  MessageCircle,
  Zap,
  Clock,
  Mail,
} from "lucide-react";
import Breadcrumbs from "../../../components/Breadcrumbs";

export default function AgentChatPage() {
  const { data: user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `👋 Welcome to your PreOrder Communication Assistant! I'm here to help you with:

🔸 **Writing delay notifications**: "Help me write a professional delay email for [product name]"
🔸 **Creating templates**: "Create an SMS template for shipping notifications"  
🔸 **Customer service**: "How should I respond to an angry customer about delays?"
🔸 **Process improvement**: "What's the best way to handle pre-order delays?"

What would you like help with today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userLoading && user) {
      fetchStats();
    }
  }, [user, userLoading]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/usage/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, agentId: "preorder-assistant" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        tokensUsed: data.tokensUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant",
        content: `❌ Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const setQuickPrompt = (prompt) => {
    setInput(prompt);
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

  const remainingRequests = stats?.monthly
    ? stats.monthly.limit - stats.monthly.requests
    : 100;

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "AI Assistant", href: "/dashboard/agent" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbs} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 sm:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </a>
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-indigo-600" />
                <div>
                  <span className="text-lg font-semibold text-gray-900">
                    PreOrder AI Assistant
                  </span>
                  <p className="text-sm text-gray-500">
                    Communication & Template Helper
                  </p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{remainingRequests}</span> requests
              remaining
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex h-full flex-col rounded-lg bg-white shadow">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.tokensUsed && (
                      <div className="text-xs opacity-70 mt-2">
                        {msg.tokensUsed} tokens used
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-indigo-600" />
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about delay notifications, templates, or customer communication..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() =>
                setQuickPrompt(
                  "Help me write a professional delay notification for a product that was supposed to ship this week",
                )
              }
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm text-left group"
            >
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-red-500 group-hover:text-red-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Delay Notice</h3>
                  <p className="text-sm text-gray-600">
                    Professional delay messages
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                setQuickPrompt(
                  "Create an email template for notifying customers when their pre-order item ships",
                )
              }
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm text-left group"
            >
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-green-500 group-hover:text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Ship Notice</h3>
                  <p className="text-sm text-gray-600">
                    Shipping notifications
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                setQuickPrompt(
                  "How should I respond to an angry customer who is upset about multiple delays?",
                )
              }
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm text-left group"
            >
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6 text-blue-500 group-hover:text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Customer Service
                  </h3>
                  <p className="text-sm text-gray-600">Handle complaints</p>
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                setQuickPrompt(
                  "Create an SMS template for urgent delay notifications that is under 160 characters",
                )
              }
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm text-left group"
            >
              <div className="flex items-center space-x-3">
                <Mail className="h-6 w-6 text-purple-500 group-hover:text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">SMS Template</h3>
                  <p className="text-sm text-gray-600">Quick text alerts</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
