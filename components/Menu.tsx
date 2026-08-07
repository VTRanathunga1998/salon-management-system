import Link from "next/link";
import {
  Home,
  Users,
  CalendarDays,
  Scissors,
  UserCog,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

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
      // {
      //   icon: CalendarDays,
      //   label: "Appointments",
      //   href: "/appointment",
      // },
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
        icon: BarChart3,
        label: "Reports",
        href: "/report",
      },
      {
        icon: Settings,
        label: "Settings",
        href: "/setting",
      },
    ],
  },
];

const Menu = () => {
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

            return (
              <Link
                href={item.href}
                key={item.label}
                className="group flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150"
              >
                {/* Icon */}
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-150">
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                </span>

                {/* Label */}
                <span className="hidden lg:block text-sm font-medium leading-none">
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
