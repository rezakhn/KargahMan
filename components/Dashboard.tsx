import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { SalesOrder, Part, ViewType, Customer } from '../types';
import { OrderStatus } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import { AddIcon, LowStockIcon, MoneyIcon, PendingIcon, ProfitIcon, EmployeeIcon } from './icons/Icons';

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
    financials: {
        revenue: number;
        cogs: number;
        salaries: number;
        netProfit: number;
    }
    overdueUnpaidOrders: SalesOrder[];
    customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders, parts, setView, financials, overdueUnpaidOrders, customers }) => {
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    
    const lowStockItems = parts.filter(p => p.stock < p.threshold).length;
    
    const customersMap = new Map(customers.map(c => [c.id, c.name]));

    const financialChartData = [
        { name: 'سود خالص', value: Math.max(0, financials.netProfit) },
        { name: 'هزینه کالا (COGS)', value: financials.cogs },
        { name: 'حقوق و دستمزد', value: financials.salaries },
    ];
    const COLORS = ['#14b8a6', '#f97316', '#3b82f6'];

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
                            <p className="text-sm text-on-surface-secondary">درآمد (تحویل شده)</p>
                            <p className="text-2xl font-bold text-on-surface">{financials.revenue.toLocaleString('fa-IR')}</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="p-3 bg-teal-500/20 rounded-full">
                            <ProfitIcon className="text-teal-400" />
                        </div>
                        <div className="mr-4">
                            <p className="text-sm text-on-surface-secondary">سود خالص</p>
                            <p className="text-2xl font-bold text-on-surface">{financials.netProfit.toLocaleString('fa-IR')}</p>
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
                        <Button onClick={() => setView('employees')} icon={<EmployeeIcon />}>مدیریت کارکرد</Button>
                    </div>

                    <div className="mt-10">
                        <h2 className="text-2xl font-bold mb-4 text-on-surface">نمای کلی مالی (بر اساس درآمد)</h2 >
                        <Card className="h-80">
                            {financials.revenue > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={financialChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {financialChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString('fa-IR')}`, '']} contentStyle={{ backgroundColor: '#374151', direction: 'rtl' }} />
                                    <Legend wrapperStyle={{ direction: 'rtl', paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-on-surface-secondary">داده‌ای برای نمایش نمودار وجود ندارد.</p>
                                </div>
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