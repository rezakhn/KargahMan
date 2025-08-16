import React, { useState, useEffect } from 'react';
import type { AssemblyOrder, Part } from '../types';
import { AssemblyStatus } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { AddIcon, TrashIcon } from './icons/Icons';
import EmptyState from './shared/EmptyState';

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

interface AssemblyProps {
    assemblyOrders: AssemblyOrder[];
    parts: Part[];
    onAddAssemblyOrder: (order: Omit<AssemblyOrder, 'id' | 'status'>) => void;
    onCompleteAssemblyOrder: (orderId: number) => void;
    onDeleteAssemblyOrder: (orderId: number) => void;
}

const Assembly: React.FC<AssemblyProps> = ({ assemblyOrders, parts, onAddAssemblyOrder, onCompleteAssemblyOrder, onDeleteAssemblyOrder }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [partId, setPartId] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const assemblyProducts = parts.filter(p => p.isAssembly);

    useEffect(() => {
        if (!partId && assemblyProducts.length > 0) {
            setPartId(assemblyProducts[0].id);
        }
    }, [parts, assemblyProducts, partId]);

    const getStatusChip = (status: AssemblyStatus) => {
        const styles = {
            [AssemblyStatus.PENDING]: "bg-yellow-600 text-yellow-100",
            [AssemblyStatus.COMPLETED]: "bg-green-600 text-green-100",
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!partId || quantity <= 0) {
            alert("لطفاً یک محصول و تعداد معتبر انتخاب کنید.");
            return;
        }
        onAddAssemblyOrder({
            partId: Number(partId),
            quantity: Number(quantity),
            date: new Date().toISOString().split('T')[0],
        });
        setIsModalOpen(false);
        setQuantity(1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">سفارشات مونتاژ</h1>
                <Button icon={<AddIcon />} onClick={() => setIsModalOpen(true)}>
                    سفارش مونتاژ جدید
                </Button>
            </div>
            
            <Card>
                {assemblyOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="p-4">شماره سفارش</th>
                                    <th className="p-4">تاریخ</th>
                                    <th className="p-4">محصول مونتاژی</th>
                                    <th className="p-4">تعداد</th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4">اقدامات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assemblyOrders.map(order => (
                                    <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="p-4 font-medium">#{order.id}</td>
                                        <td className="p-4">{formatDateShamsi(order.date)}</td>
                                        <td className="p-4">{parts.find(p => p.id === order.partId)?.name || 'قطعه ناشناس'}</td>
                                        <td className="p-4 font-mono">{order.quantity.toLocaleString('fa-IR')}</td>
                                        <td className="p-4">{getStatusChip(order.status)}</td>
                                        <td className="p-4 flex items-center space-x-2 space-x-reverse">
                                            <button onClick={() => onDeleteAssemblyOrder(order.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                            {order.status === AssemblyStatus.PENDING && (
                                                <Button size="sm" onClick={() => onCompleteAssemblyOrder(order.id)}>تکمیل</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="هیچ سفارش مونتاژی در جریان نیست"
                        message="برای شروع تولید، اولین سفارش مونتاژ خود را ثبت کنید."
                        action={<Button icon={<AddIcon />} onClick={() => setIsModalOpen(true)}>ثبت سفارش مونتاژ</Button>}
                    />
                )}
            </Card>

            <Modal title="سفارش مونتاژ جدید" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="partId" className="block text-sm font-medium text-on-surface-secondary mb-1">محصول مونتاژی</label>
                        <select id="partId" value={partId} onChange={e => setPartId(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required>
                             <option value="0" disabled>یک محصول را انتخاب کنید</option>
                             {assemblyProducts.map(p => (
                                 <option key={p.id} value={p.id}>{p.name}</option>
                             ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-on-surface-secondary mb-1">تعداد</label>
                        <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="1" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>لغو</Button>
                        <Button type="submit">ایجاد سفارش</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Assembly;