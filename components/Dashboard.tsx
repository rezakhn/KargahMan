import React from 'react';
import type { SalesOrder, Part, ViewType, Customer } from '../types';
import { OrderStatus } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import { AddIcon, LowStockIcon, MoneyIcon, PendingIcon, ProfitIcon } from './icons/Icons';

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

interface DashboardProps {
    orders: SalesOrder[];
    parts: Part[];
    setView: (view: ViewType) => void;
    totalRevenue: number;
    grossProfit: number;
    overdueUnpaidOrders: SalesOrder[];
    customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders, parts, setView, totalRevenue, grossProfit, overdueUnpaidOrders, customers }) => {
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    
    const lowStockItems = parts.filter(p => p.stock < p.threshold).length;
    
    const customersMap = new Map(customers.map(c => [c.id, c.name]));

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-on-surface">داشبورد</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-green-500/20 rounded-full">
                            <MoneyIcon className="text-green-400" />
                        </div>
                        <div className="mr-4">
                            <p className="text-sm text-on-surface-secondary">درآمد کل</p>
                            <p className="text-2xl font-bold text-on-surface">{totalRevenue.toLocaleString('fa-IR')}</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-teal-500/20 rounded-full">
                            <ProfitIcon className="text-teal-400" />
                        </div>
                        <div className="mr-4">
                            <p className="text-sm text-on-surface-secondary">سود ناخالص</p>
                            <p className="text-2xl font-bold text-on-surface">{grossProfit.toLocaleString('fa-IR')}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-500/20 rounded-full">
                            <PendingIcon className="text-yellow-400" />
                        </div>
                        <div className="mr-4">
                            <p className="text-sm text-on-surface-secondary">سفارشات در انتظار</p>
                            <p className="text-2xl font-bold text-on-surface">{pendingOrders.toLocaleString('fa-IR')}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-red-500/20 rounded-full">
                            <LowStockIcon className="text-red-400" />
                        </div>
                        <div className="mr-4">
                            <p className="text-sm text-on-surface-secondary">کالاهای رو به اتمام</p>
                            <p className="text-2xl font-bold text-on-surface">{lowStockItems.toLocaleString('fa-IR')}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4 text-on-surface">دسترسی سریع</h2>
                    <div className="flex flex-wrap gap-4">
                        <Button onClick={() => setView('orders')} icon={<AddIcon />}>سفارش جدید</Button>
                        <Button onClick={() => setView('purchases')} icon={<AddIcon />}>خرید جدید</Button>
                        <Button onClick={() => setView('employees')} icon={<AddIcon />}>مدیریت کارکرد</Button>
                    </div>

                    <div className="mt-10">
                        <h2 className="text-2xl font-bold mb-4 text-on-surface">فعالیت‌های اخیر</h2>
                        <Card>
                             {orders.length > 0 ? (
                                <ul className="divide-y divide-gray-600">
                                    {orders.slice(-5).reverse().map(order => (
                                         <li key={order.id} className="py-3">
                                            <p className="font-medium">سفارش جدید #{order.id} به مبلغ {order.totalAmount.toLocaleString('fa-IR')} ثبت شد.</p>
                                            <span className="text-sm text-on-surface-secondary">{formatDateShamsi(order.date)}</span>
                                        </li>
                                    ))}
                                </ul>
                             ) : (
                                <p className="text-on-surface-secondary text-center py-4">هنوز فعالیتی ثبت نشده است.</p>
                             )}
                        </Card>
                    </div>
                </div>
                <div>
                     <h2 className="text-2xl font-bold mb-4 text-on-surface">هشدارها</h2>
                     <Card>
                        {overdueUnpaidOrders.length > 0 ? (
                             <ul className="divide-y divide-gray-600">
                                {overdueUnpaidOrders.map(order => (
                                    <li key={order.id} className="py-3">
                                        <p className="font-medium text-yellow-400">سفارش پرداخت نشده #{order.id}</p>
                                        <p className="text-sm text-on-surface-secondary">
                                            مشتری: {customersMap.get(order.customerId) || 'ناشناس'}
                                        </p>
                                        <p className="text-sm text-on-surface-secondary">
                                            موعد تحویل: {formatDateShamsi(order.deliveryDate)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-on-surface-secondary text-center py-4">هیچ هشدار فعالی وجود ندارد.</p>
                        )}
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;