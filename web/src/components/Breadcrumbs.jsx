import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  // Don't show breadcrumbs if there are no items or only one item
  if (!items || items.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <a
        href="/"
        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
      >
        <Home className="h-4 w-4" />
        Home
      </a>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href && index !== items.length - 1 ? (
            <a
              href={item.href}
              className="hover:text-indigo-600 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
