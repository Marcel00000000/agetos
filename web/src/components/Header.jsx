import { useState } from "react";
import {
  Package,
  Search,
  Menu,
  X,
  User,
  BarChart3,
  Settings,
  Home,
  ShoppingBag,
} from "lucide-react";

export default function Header({ currentPath = "/" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isPublicPage =
    currentPath.startsWith("/browse") ||
    currentPath.startsWith("/products/") ||
    currentPath === "/order-success" ||
    currentPath === "/";

  const isDashboardPage = currentPath.startsWith("/dashboard");

  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 hover:opacity-80">
              <Package className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">
                PreOrder Pro
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {/* Public Navigation */}
            {isPublicPage && (
              <>
                <a
                  href="/"
                  className={`flex items-center gap-2 text-sm font-medium hover:text-indigo-600 ${
                    currentPath === "/" ? "text-indigo-600" : "text-gray-700"
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Home
                </a>
                <a
                  href="/browse"
                  className={`flex items-center gap-2 text-sm font-medium hover:text-indigo-600 ${
                    currentPath.startsWith("/browse")
                      ? "text-indigo-600"
                      : "text-gray-700"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Browse Products
                </a>
              </>
            )}

            {/* Dashboard Navigation */}
            {isDashboardPage && (
              <>
                <a
                  href="/dashboard"
                  className={`flex items-center gap-2 text-sm font-medium hover:text-indigo-600 ${
                    currentPath === "/dashboard"
                      ? "text-indigo-600"
                      : "text-gray-700"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </a>
                <a
                  href="/dashboard/products"
                  className={`text-sm font-medium hover:text-indigo-600 ${
                    currentPath.startsWith("/dashboard/products")
                      ? "text-indigo-600"
                      : "text-gray-700"
                  }`}
                >
                  Products
                </a>
                <a
                  href="/dashboard/orders"
                  className={`text-sm font-medium hover:text-indigo-600 ${
                    currentPath.startsWith("/dashboard/orders")
                      ? "text-indigo-600"
                      : "text-gray-700"
                  }`}
                >
                  Orders
                </a>
                <a
                  href="/dashboard/agent"
                  className={`text-sm font-medium hover:text-indigo-600 ${
                    currentPath.startsWith("/dashboard/agent")
                      ? "text-indigo-600"
                      : "text-gray-700"
                  }`}
                >
                  AI Assistant
                </a>
              </>
            )}

            <div className="h-6 w-px bg-gray-300"></div>

            {/* Auth Links */}
            <div className="flex items-center gap-4">
              <a
                href="/account/signin"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                Sign In
              </a>
              <a
                href="/account/signup"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Get Started
              </a>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {/* Public Mobile Navigation */}
              {isPublicPage && (
                <>
                  <a
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </a>
                  <a
                    href="/browse"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Browse Products
                  </a>
                </>
              )}

              {/* Dashboard Mobile Navigation */}
              {isDashboardPage && (
                <>
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </a>
                  <a
                    href="/dashboard/products"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Products
                  </a>
                  <a
                    href="/dashboard/orders"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </a>
                  <a
                    href="/dashboard/agent"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AI Assistant
                  </a>
                </>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-4">
                <a
                  href="/account/signin"
                  className="block text-sm font-medium text-gray-700 hover:text-indigo-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </a>
                <a
                  href="/account/signup"
                  className="block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
