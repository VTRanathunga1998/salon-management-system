"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  CalendarDays,
  Scissors,
  UserCog,
  FileText,
  BarChart3,
  WalletCards,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: Home,
        label: "Home",
        href: "/home",
      },
      {
        icon: Users,
        label: "Customers",
        href: "/customer",
      },
      {
        icon: CalendarDays,
        label: "Appointments",
        href: "/appointment",
      },
      {
        icon: Scissors,
        label: "Services",
        href: "/service",
      },
      {
        icon: UserCog,
        label: "Employees",
        href: "/employee",
      },
      {
        icon: FileText,
        label: "Invoices",
        href: "/invoice",
      },
      {
        icon: WalletCards,
        label: "Expenses",
        href: "/expense",
      },
      {
        icon: BarChart3,
        label: "Reports",
        href: "/report",
        children: [
          {
            label: "Overview Report",
            href: "/report",
          },
          {
            label: "Employee Report",
            href: "/report/employee",
          },
          {
            label: "Expense Report",
            href: "/report/expense",
          },
        ],
      },
    ],
  },
];

const Menu = () => {
  const pathname = usePathname();

  const reportsRef = useRef<HTMLDivElement>(null);

  const [reportsOpen, setReportsOpen] = useState(
    pathname === "/report" || pathname.startsWith("/report/"),
  );

  // Keep Reports open when navigating between report pages
  useEffect(() => {
    if (pathname === "/report" || pathname.startsWith("/report/")) {
      setReportsOpen(true);
    }
  }, [pathname]);

  // Close Reports when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reportsRef.current &&
        !reportsRef.current.contains(event.target as Node)
      ) {
        setReportsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      {menuItems.map((section) => (
        <div key={section.title} className="flex flex-col gap-0.5">
          {/* Section label */}
          <span className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-4 pb-2 select-none">
            {section.title}
          </span>

          {/* Items */}
          {section.items.map((item) => {
            const Icon = item.icon;

            const hasChildren =
              "children" in item && item.children && item.children.length > 0;

            const isReportItem = item.label === "Reports";

            const isActive = hasChildren
              ? pathname === item.href || pathname.startsWith(`${item.href}/`)
              : pathname === item.href;

            /*
             * ---------------------------------------------------------
             * REPORTS MENU
             * ---------------------------------------------------------
             */
            if (isReportItem && hasChildren) {
              return (
                <div key={item.label} ref={reportsRef} className="relative hidden lg:block">
                  {/* Reports toggle */}
                  <button
                    type="button"
                    onClick={() => setReportsOpen((prev) => !prev)}
                    className={`group w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                      isActive || reportsOpen
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {/* Icon */}
                    <span
                      className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 ${
                        isActive || reportsOpen
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </span>

                    {/* Label */}
                    <span
                      className={`hidden lg:block text-sm leading-none flex-1 text-left ${
                        isActive || reportsOpen
                          ? "font-semibold"
                          : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Arrow */}
                    <ChevronDown
                      className={`hidden lg:block w-4 h-4 transition-transform duration-200 ${
                        reportsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Submenu */}
                  {reportsOpen && (
                    <div className="hidden lg:flex flex-col ml-[42px] mt-1 mb-1 border-l border-slate-200 pl-3 gap-0.5">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setReportsOpen(false)}
                            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                              isChildActive
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-slate-500 hover:bg-slate-50 hover:text-blue-700"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /*
             * ---------------------------------------------------------
             * NORMAL MENU ITEMS
             * ---------------------------------------------------------
             */
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`group flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {/* Icon */}
                <span
                  className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 ${
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                </span>

                {/* Label */}
                <span
                  className={`hidden lg:block text-sm leading-none ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default Menu;
