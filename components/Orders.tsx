import React, { useState, useMemo } from 'react';
import type { SalesOrder, Part, Contact, Payment } from '../types.ts';
import { OrderStatus } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import Modal from './shared/Modal.tsx';
import { AddIcon, TrashIcon, LowStockIcon, DocumentTextIcon, TruckIcon, EyeIcon } from './icons/Icons.tsx';
import EmptyState from './shared/EmptyState.tsx';
import PersianDatePicker from './shared/PersianDatePicker.tsx';

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

interface OrdersProps {
    orders: SalesOrder[];
    onAddOrder: (order: Omit<SalesOrder, 'id' | 'totalAmount' | 'payments' | 'status'>) => void;
    onAddPayment: (orderId: number, payment: Omit<Payment, 'id'>) => void;
    onDeleteOrder: (orderId: number) => void;
    onDeliverOrder: (orderId: number) => void;
    parts: Part[];
    customers: Contact[];
}

const Orders: React.FC<OrdersProps> = ({ orders, onAddOrder, onAddPayment, onDeleteOrder, onDeliverOrder, parts, customers }) => {
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

    // Order Form State
    const [customerId, setCustomerId] = useState(customers[0]?.id || 0);
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ id: Date.now(), productId: 0, quantity: 1, price: 0 }]);
    
    // Payment Form State
    const [paymentAmount, setPaymentAmount] = useState(0);
    
    const partsMap = useMemo(() => new Map(parts.map(p => [p.id, p])), [parts]);
    const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

    const getStatusChip = (status: OrderStatus) => {
        const styles = {
            [OrderStatus.PENDING]: "bg-yellow-600 text-yellow-100",
            [OrderStatus.PAID]: "bg-blue-600 text-blue-100",
            [OrderStatus.DELIVERED]: "bg-green-600 text-green-100",
            [OrderStatus.CANCELLED]: "bg-red-600 text-red-100",
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    const totalPaid = (order: SalesOrder) => order.payments.reduce((sum, p) => sum + p.amount, 0);

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        const updatedItem = { ...newItems[index], [field]: value };
        
        newItems[index] = updatedItem;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: 0, quantity: 1, price: 0 }]);
    };
    
    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems = items
            .filter(item => item.productId > 0 && item.quantity > 0 && item.price >= 0)
            .map(item => ({...item, productId: +item.productId, quantity: +item.quantity, price: +item.price}));

        if (!customerId || finalItems.length === 0) {
            alert("لطفاً یک مشتری انتخاب کرده و حداقل یک محصول معتبر اضافه کنید.");
            return;
        }

        onAddOrder({
            customerId: +customerId,
            date: new Date().toISOString().split('T')[0],
            deliveryDate,
            items: finalItems
        });

        setIsOrderModalOpen(false);
        setCustomerId(customers[0]?.id || 0);
        setDeliveryDate(new Date().toISOString().split('T')[0]);
        setItems([{ id: 1, productId: 0, quantity: 1, price: 0 }]);
    };

    const openPaymentModal = (order: SalesOrder) => {
        setSelectedOrder(order);
        setPaymentAmount(order.totalAmount - totalPaid(order));
        setIsPaymentModalOpen(true);
    };
    
    const openDetailsModal = (order: SalesOrder) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    }
    
    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedOrder || paymentAmount <= 0) return;

        onAddPayment(selectedOrder.id, {
            amount: paymentAmount,
            date: new Date().toISOString().split('T')[0],
        });
        setIsPaymentModalOpen(false);
    };

    const checkInventoryShortage = (productId: number, quantity: number): string | null => {
        const product = partsMap.get(productId);
        if (!product) return "محصول یافت نشد";

        if (product.stock >= quantity) return null;
        
        return `موجودی ناکافی (موجود: ${product.stock})`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">سفارشات و فروش</h1>
                <Button icon={<AddIcon />} onClick={() => setIsOrderModalOpen(true)}>
                    سفارش جدید
                </Button>
            </div>
            
            <Card>
                {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="px-4 py-3">شماره سفارش</th>
                                    <th className="px-4 py-3">تاریخ</th>
                                    <th className="px-4 py-3">مشتری</th>
                                    <th className="px-4 py-3">مبلغ کل</th>
                                    <th className="px-4 py-3">پرداخت شده</th>
                                    <th className="px-4 py-3">وضعیت</th>
                                    <th className="px-4 py-3">اقدامات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="px-4 py-2 font-medium">#{order.id}</td>
                                        <td className="px-4 py-2">{formatDateShamsi(order.date)}</td>
                                        <td className="px-4 py-2">{customersMap.get(order.customerId) || 'ناشناس'}</td>
                                        <td className="px-4 py-2">{order.totalAmount.toLocaleString('fa-IR')}</td>
                                        <td className="px-4 py-2">{totalPaid(order).toLocaleString('fa-IR')}</td>
                                        <td className="px-4 py-2">{getStatusChip(order.status)}</td>
                                        <td className="px-4 py-2 flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                                            <button onClick={() => openDetailsModal(order)} className="p-1 text-on-surface-secondary hover:text-primary" title="مشاهده جزئیات"><EyeIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeleteOrder(order.id)} className="p-1 text-on-surface-secondary hover:text-red-500" title="حذف سفارش"><TrashIcon className="w-5 h-5"/></button>
                                            {order.status === OrderStatus.PENDING && (
                                                <Button size="sm" onClick={() => openPaymentModal(order)}>افزودن پرداخت</Button>
                                            )}
                                            {order.status === OrderStatus.PAID && (
                                                <Button size="sm" variant="secondary" icon={<TruckIcon />} onClick={() => onDeliverOrder(order.id)}>تحویل سفارش</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="هیچ سفارشی ثبت نشده است"
                        message="برای شروع مدیریت فروش، اولین سفارش مشتری خود را ثبت کنید."
                        action={<Button icon={<AddIcon />} onClick={() => setIsOrderModalOpen(true)}>ثبت سفارش جدید</Button>}
                    />
                )}
            </Card>

            <Modal title="ایجاد سفارش جدید" isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}>
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="customerId" className="block text-sm font-medium text-on-surface-secondary mb-1">مشتری</label>
                            <select id="customerId" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary">
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="deliveryDate" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ تحویل</label>
                            <PersianDatePicker
                                value={deliveryDate}
                                onChange={date => setDeliveryDate(date)}
                                inputId="deliveryDate"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">محصولات</h3>
                        {items.map((item, index) => {
                            const shortage = item.productId ? checkInventoryShortage(Number(item.productId), Number(item.quantity)) : null;
                            return (
                                <div key={item.id} className="p-2 bg-gray-800 rounded-md space-y-2">
                                    <div className="grid grid-cols-[1fr,80px,120px,auto] gap-2 items-center">
                                        <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1" required>
                                            <option value="0" disabled>انتخاب محصول</option>
                                            {parts.filter(p => p.isAssembly).map(p => <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stock.toLocaleString('fa-IR')})</option>)}
                                        </select>
                                        <input type="number" placeholder="تعداد" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1" required min="1" />
                                        <input type="number" placeholder="قیمت واحد" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1" required min="0"/>
                                        <button type="button" onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-400 p-1">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {shortage && (
                                        <div className="flex items-center text-yellow-400 text-sm">
                                            <LowStockIcon className="w-4 h-4 ml-2" />
                                            <span>{shortage}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                         <Button type="button" size="sm" variant="secondary" onClick={addItem} icon={<AddIcon />}>افزودن محصول</Button>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={() => setIsOrderModalOpen(false)}>لغو</Button>
                        <Button type="submit">ایجاد سفارش</Button>
                    </div>
                </form>
            </Modal>

            {selectedOrder && (
                 <Modal title={`افزودن پرداخت برای سفارش #${selectedOrder.id}`} isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)}>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div>
                            <p>مبلغ کل: {selectedOrder.totalAmount.toLocaleString('fa-IR')}</p>
                            <p>پرداخت شده: {totalPaid(selectedOrder).toLocaleString('fa-IR')}</p>
                            <p className="font-bold">مانده: {(selectedOrder.totalAmount - totalPaid(selectedOrder)).toLocaleString('fa-IR')}</p>
                        </div>
                        <div>
                            <label htmlFor="paymentAmount" className="block text-sm font-medium text-on-surface-secondary mb-1">مبلغ پرداخت (تومان)</label>
                            <input type="number" id="paymentAmount" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0" />
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>لغو</Button>
                            <Button type="submit">ثبت پرداخت</Button>
                        </div>
                    </form>
                </Modal>
            )}
            
            {selectedOrder && (
                 <Modal title={`جزئیات سفارش #${selectedOrder.id}`} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)}>
                    <div className="space-y-6">
                       <div>
                            <h3 className="text-lg font-bold mb-2 text-primary">اطلاعات کلی</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <p><strong className="text-on-surface-secondary">مشتری:</strong> {customersMap.get(selectedOrder.customerId) || 'ناشناس'}</p>
                                <p><strong className="text-on-surface-secondary">تاریخ سفارش:</strong> {formatDateShamsi(selectedOrder.date)}</p>
                                <p><strong className="text-on-surface-secondary">تاریخ تحویل:</strong> {formatDateShamsi(selectedOrder.deliveryDate)}</p>
                                <p><strong className="text-on-surface-secondary">وضعیت:</strong> {getStatusChip(selectedOrder.status)}</p>
                            </div>
                       </div>
                        
                       <div>
                            <h3 className="text-lg font-bold mb-2 text-primary">اقلام سفارش</h3>
                            <ul className="divide-y divide-gray-700">
                                {selectedOrder.items.map(item => (
                                    <li key={item.productId} className="py-2 flex justify-between items-center text-sm">
                                        <span>{partsMap.get(item.productId)?.name}</span>
                                        <span className="font-mono text-on-surface-secondary">{item.quantity.toLocaleString('fa-IR')} عدد × {item.price.toLocaleString('fa-IR')}</span>
                                    </li>
                                ))}
                            </ul>
                       </div>

                       <div>
                            <h3 className="text-lg font-bold mb-2 text-primary">مالی و سودآوری</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-on-surface-secondary">درآمد کل:</span> <span className="font-mono">{selectedOrder.totalAmount.toLocaleString('fa-IR')}</span></div>
                                <div className="flex justify-between"><span className="text-on-surface-secondary">پرداخت شده:</span> <span className="font-mono">{totalPaid(selectedOrder).toLocaleString('fa-IR')}</span></div>
                                {selectedOrder.costOfGoodsSold !== undefined && (
                                    <>
                                        <div className="flex justify-between border-t border-gray-600 pt-2 mt-2"><span className="text-on-surface-secondary">هزینه کالا (COGS):</span> <span className="font-mono text-red-400">-{selectedOrder.costOfGoodsSold.toLocaleString('fa-IR')}</span></div>
                                        <div className="flex justify-between font-bold"><span className="text-on-surface">سود سفارش:</span> <span className="font-mono text-teal-400">{(selectedOrder.totalAmount - selectedOrder.costOfGoodsSold).toLocaleString('fa-IR')}</span></div>
                                    </>
                                )}
                            </div>
                       </div>
                        <div className="mt-6 flex justify-end">
                            <Button type="button" variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>بستن</Button>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
};

export default Orders;