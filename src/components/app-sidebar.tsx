import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Factory,
  FileText,
  FlaskConical,
  Home,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Табло", icon: Home },
  { href: "/production", label: "Производство", icon: Factory },
  { href: "/products", label: "Продукти и рецепти", icon: Package },
  { href: "/costs", label: "Себестойности", icon: BarChart3 },
  { href: "/materials", label: "Материали и склад", icon: Boxes },
  { href: "/sales", label: "Продажби и клиенти", icon: ShoppingCart },
  { href: "/purchases", label: "Покупки и доставчици", icon: Truck },
  { href: "/expenses", label: "Разходи", icon: ReceiptText },
  { href: "/documents", label: "Документи", icon: FileText },
  { href: "/samples", label: "Мостри", icon: FlaskConical },
  { href: "/reports", label: "Справки", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-72 border-r border-line bg-[#EEE8DA] px-4 py-5">
      <div className="mb-7">
        <div className="text-lg font-semibold tracking-wide">Himcolor</div>
        <div className="text-xs text-neutral-600">Управление на себестойности</div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink hover:bg-white"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
