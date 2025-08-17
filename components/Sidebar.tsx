import React from 'react';
import type { ViewType } from '../types.ts';
import { DashboardIcon, EmployeeIcon, InventoryIcon, OrdersIcon, PurchasesIcon, ReportsIcon, WorkshopIcon, AssemblyIcon, SettingsIcon, UsersGroupIcon, DocumentTextIcon } from './icons/Icons.tsx';

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: <DashboardIcon /> },
    { id: 'employees', label: 'کارکنان', icon: <EmployeeIcon /> },
    { id: 'suppliers_customers', label: 'مخاطبین', icon: <UsersGroupIcon /> },
    { id: 'purchases', label: 'خریدها', icon: <PurchasesIcon /> },
    { id: 'inventory', label: 'انبار', icon: <InventoryIcon /> },
    { id: 'assembly', label: 'مونتاژ', icon: <AssemblyIcon /> },
    { id: 'orders', label: 'سفارشات و فروش', icon: <OrdersIcon /> },
    { id: 'expenses', label: 'هزینه‌ها', icon: <DocumentTextIcon /> },
    { id: 'reports', label: 'گزارش‌ها', icon: <ReportsIcon /> },
    { id: 'settings', label: 'تنظیمات', icon: <SettingsIcon /> },
  ] as const;

  return (
    <aside className="w-16 lg:w-64 bg-surface flex flex-col">
      <div className="flex items-center justify-center lg:justify-start p-4 h-20 border-b border-gray-600">
        <WorkshopIcon />
        <h1 className="hidden lg:block mr-3 text-xl font-bold text-on-surface">مدیریت کارگاه</h1>
      </div>
      <nav className="flex-1 px-2 lg:px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center p-3 lg:p-2 rounded-lg w-full text-right transition-colors duration-200 ${
              view === item.id
                ? 'bg-primary text-white'
                : 'text-on-surface-secondary hover:bg-gray-600 hover:text-on-surface'
            }`}
          >
            <span className="w-6 h-6">{item.icon}</span>
            <span className="hidden lg:block mr-4 font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;