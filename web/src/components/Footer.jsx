import {
  Package,
  Mail,
  HelpCircle,
  FileText,
  Shield,
  ShoppingBag,
  BarChart3,
  MessageCircle,
  Settings,
  User,
} from "lucide-react";

export default function Footer({ showFullFooter = true }) {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {showFullFooter && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-indigo-600" />
                <span className="font-bold text-gray-900 text-lg">
                  PreOrder Pro
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Accept pre-orders & get paid instantly. Turn delays into revenue
                with professional AI-powered communications.
              </p>
              <div className="text-sm text-gray-500">
                🔒 Secure payments via Stripe
                <br />📧 Automated notifications
                <br />💰 5% platform fee only
              </div>
            </div>

            {/* For Customers */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                For Customers
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="/browse"
                    className="text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Browse Products
                  </a>
                </li>
                <li>
                  <a
                    href="/browse?sort=newest"
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    New Pre-Orders
                  </a>
                </li>
                <li>
                  <a
                    href="/browse?sort=price_low"
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    Best Deals
                  </a>
                </li>
                <li>
                  <a
                    href="/order-success"
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    Order Status
                  </a>
                </li>
              </ul>
            </div>

            {/* For Sellers */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Sellers</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="/account/signup"
                    className="text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Create Account
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    className="text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/products"
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    Manage Products
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/agent"
                    className="text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    AI Assistant
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="https://createanything.com/docs"
                    className="text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@preorderpro.com"
                    className="text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Contact Support
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/billing"
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    Pricing & Billing
                  </a>
                </li>
                <li>
                  <a
                    href="https://stripe.com/privacy"
                    className="text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Shield className="h-4 w-4" />
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between ${showFullFooter ? "border-t border-gray-200 pt-8" : ""}`}
        >
          <div className="flex items-center gap-2">
            {!showFullFooter && (
              <>
                <Package className="h-5 w-5 text-indigo-600" />
                <span className="font-bold text-gray-900">PreOrder Pro</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 mt-4 sm:mt-0">
            <span>© 2025 PreOrder Pro. All rights reserved.</span>
            <div className="hidden sm:flex items-center gap-4">
              <a href="/account/signin" className="hover:text-indigo-600">
                Sign In
              </a>
              <a href="/account/signup" className="hover:text-indigo-600">
                Sign Up
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links for Mobile */}
        <div className="sm:hidden border-t border-gray-200 pt-6 mt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <a href="/" className="block text-gray-600 hover:text-indigo-600">
                Home
              </a>
              <a
                href="/browse"
                className="block text-gray-600 hover:text-indigo-600"
              >
                Browse Products
              </a>
              <a
                href="/account/signup"
                className="block text-gray-600 hover:text-indigo-600"
              >
                Get Started
              </a>
            </div>
            <div className="space-y-2">
              <a
                href="/dashboard"
                className="block text-gray-600 hover:text-indigo-600"
              >
                Dashboard
              </a>
              <a
                href="/account/signin"
                className="block text-gray-600 hover:text-indigo-600"
              >
                Sign In
              </a>
              <a
                href="https://createanything.com/docs"
                className="block text-gray-600 hover:text-indigo-600"
                target="_blank"
              >
                Help
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
