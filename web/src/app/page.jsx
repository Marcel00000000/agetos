import {
  ArrowRight,
  Package,
  Bell,
  Clock,
  BarChart,
  CreditCard,
  Users,
  TrendingUp,
  MessageCircle,
  Bot,
  Zap,
  Mail,
  Shield,
  Globe,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Info Banner */}
      <div className="bg-indigo-600 text-white py-2 text-center text-sm">
        <p>
          🤖 Powered by Advanced AI • Automate 90% of pre-order communications
          <span className="font-medium ml-2">Start free trial today</span>
        </p>
      </div>

      {/* Header */}
      <Header currentPath="/" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl lg:text-7xl">
            Automate Pre-Order
            <span className="block text-indigo-600">Delay Communications</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
            Turn frustrated customers into loyal fans. Our AI automatically
            handles delay notifications, creates professional templates, and
            keeps customers informed when pre-orders run late.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/account/signup"
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white hover:bg-indigo-700"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="/dashboard/agent"
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-indigo-600 px-8 py-4 text-lg font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Try AI Assistant
              <Bot className="h-5 w-5" />
            </a>
          </div>
          <div className="mt-8 text-sm text-indigo-700">
            🚀 Free 30-day trial • No setup fees • Cancel anytime
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            How Our AI Saves Your Business
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            From delay to delivery, keep customers happy with automated
            communication
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Delay Detected
            </h3>
            <p className="text-gray-600">
              Your supplier informs you about delays. Instead of manually
              crafting messages to each customer, our AI takes over
              automatically.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
              <Bot className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              AI Creates Messages
            </h3>
            <p className="text-gray-600">
              Our specialized Crew AI agent generates professional, empathetic
              communications tailored to your brand and customer situation.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Customers Stay Happy
            </h3>
            <p className="text-gray-600">
              Professional communication maintains trust. Customers receive
              timely updates via email and SMS, keeping them informed and
              engaged.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          Complete Pre-Order Communication Suite
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <Bot className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              AI-Powered Assistant
            </h3>
            <p className="text-gray-600">
              Crew AI integration creates professional delay notifications,
              templates, and customer service responses automatically.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Multi-Channel Messaging
            </h3>
            <p className="text-gray-600">
              Send notifications via email and SMS. Reach customers on their
              preferred channels for maximum engagement.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Pre-Order Management
            </h3>
            <p className="text-gray-600">
              Track all pre-orders, set estimated dates, and automatically
              notify customers when delays occur.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Smart Templates
            </h3>
            <p className="text-gray-600">
              Pre-built templates for delays, shipping updates, cancellations,
              and follow-ups. Customize for your brand voice.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Customer Database
            </h3>
            <p className="text-gray-600">
              Organize customer information, order history, and communication
              preferences in one centralized dashboard.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <Bell className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Automated Alerts
            </h3>
            <p className="text-gray-600">
              Get notified when products are delayed, customers respond, or
              action is required. Stay on top of everything.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <BarChart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Performance Analytics
            </h3>
            <p className="text-gray-600">
              Track customer satisfaction, response rates, and communication
              effectiveness to improve your process.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Brand Protection
            </h3>
            <p className="text-gray-600">
              Maintain your professional reputation even during delays. AI
              ensures consistent, empathetic communication.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <h2 className="mb-6 text-center text-4xl font-bold text-gray-900">
          Simple, Scalable Pricing
        </h2>
        <p className="mb-12 text-center text-xl text-gray-600">
          Start free, scale as your business grows. No setup fees or hidden
          charges.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Starter Plan */}
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
            <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">Free</span>
              <span className="ml-2 text-gray-600">forever</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> 100 AI
                communications/month
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Email notifications
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Basic templates
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> 1 AI agent
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Dashboard analytics
              </li>
            </ul>
            <a
              href="/account/signup"
              className="mt-8 block w-full rounded-lg border-2 border-indigo-600 py-3 text-center font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Start Free Trial
            </a>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Professional</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">$49</span>
              <span className="ml-2 text-gray-600">/month</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> 2,000 AI
                communications/month
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Email + SMS
                notifications
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Advanced AI templates
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> 5 AI agents
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Advanced analytics
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Priority support
              </li>
            </ul>
            <a
              href="/account/signup"
              className="mt-8 block w-full rounded-lg bg-indigo-600 py-3 text-center font-semibold text-white hover:bg-indigo-700"
            >
              Start 30-Day Trial
            </a>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
            <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">$149</span>
              <span className="ml-2 text-gray-600">/month</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> 10,000 AI
                communications/month
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Unlimited channels
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Custom AI training
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Unlimited agents
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> API access
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Dedicated support
              </li>
            </ul>
            <a
              href="/account/signup"
              className="mt-8 block w-full rounded-lg border-2 border-indigo-600 py-3 text-center font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Contact Sales
            </a>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block rounded-lg bg-blue-50 border border-blue-200 px-6 py-4">
            <p className="text-blue-800 font-medium">
              🎯 30-day free trial on all plans • No credit card required
            </p>
            <p className="text-blue-700 text-sm mt-1">
              Save hours weekly on customer communication
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Automate Your Pre-Order Communications?
          </h2>
          <p className="mt-4 text-xl text-indigo-100">
            Join stores that save 10+ hours weekly with AI-powered messaging
          </p>
          <a
            href="/account/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-semibold text-indigo-600 hover:bg-gray-50"
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </a>
          <p className="mt-4 text-sm text-indigo-200">
            Free 30-day trial • Setup in under 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
