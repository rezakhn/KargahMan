import React, { useState, useEffect } from 'react';
import type { PurchaseInvoice, Supplier, PurchaseItem } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { AddIcon, EditIcon, TrashIcon } from './icons/Icons';
import EmptyState from './shared/EmptyState';

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

interface PurchasesProps {
    purchases: PurchaseInvoice[];
    onAddPurchase: (purchase: Omit<PurchaseInvoice, 'id' | 'totalAmount'>) => void;
    onEditPurchase: (purchase: PurchaseInvoice) => void;
    onDeletePurchase: (purchaseId: number) => void;
    suppliers: Supplier[];
}

const Purchases: React.FC<PurchasesProps> = ({ purchases, onAddPurchase, onEditPurchase, onDeletePurchase, suppliers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<PurchaseInvoice | null>(null);
    
    const initialFormState = {
        supplierId: suppliers[0]?.id || 0,
        date: new Date().toISOString().split('T')[0],
        items: [{ id: Date.now(), itemName: '', quantity: 1, unitPrice: 0 }] as Omit<PurchaseItem, 'invoiceId'>[],
    };
    const [formState, setFormState] = useState(initialFormState);

    useEffect(() => {
        if (editingPurchase) {
            setFormState({
                supplierId: editingPurchase.supplierId,
                date: editingPurchase.date,
                items: editingPurchase.items,
            });
        } else {
            setFormState(initialFormState);
        }
    }, [editingPurchase, isModalOpen]);


    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...formState.items];
        (newItems[index] as any)[field] = value;
        setFormState(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormState(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), itemName: '', quantity: 1, unitPrice: 0 }],
        }));
    };
    
    const removeItem = (id: number) => {
        setFormState(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems = formState.items
            .filter(item => item.itemName && item.quantity > 0 && item.unitPrice >= 0)
            .map(item => ({...item, quantity: +item.quantity, unitPrice: +item.unitPrice}));
        
        if (!formState.supplierId || finalItems.length === 0) {
            alert("لطفاً یک تأمین‌کننده انتخاب کرده و حداقل یک آیتم معتبر اضافه کنید.");
            return;
        }

        if (editingPurchase) {
            const totalAmount = finalItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            onEditPurchase({
                ...editingPurchase,
                supplierId: +formState.supplierId,
                date: formState.date,
                items: finalItems,
                totalAmount: totalAmount,
            });
        } else {
            onAddPurchase({ supplierId: +formState.supplierId, date: formState.date, items: finalItems });
        }
        
        setIsModalOpen(false);
    };

    const openAddModal = () => {
        setEditingPurchase(null);
        setIsModalOpen(true);
    };

    const openEditModal = (purchase: PurchaseInvoice) => {
        setEditingPurchase(purchase);
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">خریدها</h1>
                <Button icon={<AddIcon />} onClick={openAddModal}>
                    فاکتور خرید جدید
                </Button>
            </div>

            <Card>
                {purchases.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="p-4">شماره فاکتور</th>
                                    <th className="p-4">تاریخ</th>
                                    <th className="p-4">تأمین‌کننده</th>
                                    <th className="p-4">تعداد اقلام</th>
                                    <th className="p-4">مبلغ کل</th>
                                    <th className="p-4">اقدامات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(invoice => (
                                    <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="p-4 font-medium">#{invoice.id}</td>
                                        <td className="p-4">{formatDateShamsi(invoice.date)}</td>
                                        <td className="p-4">{suppliers.find(s => s.id === invoice.supplierId)?.name || 'ناشناس'}</td>
                                        <td className="p-4">{invoice.items.length.toLocaleString('fa-IR')}</td>
                                        <td className="p-4">{invoice.totalAmount.toLocaleString('fa-IR')}</td>
                                        <td className="p-4 flex items-center space-x-2 space-x-reverse">
                                            <button onClick={() => openEditModal(invoice)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeletePurchase(invoice.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="هیچ فاکتور خریدی ثبت نشده است"
                        message="اولین فاکتور خرید خود را برای مدیریت موجودی و هزینه‌ها ثبت کنید."
                        action={<Button icon={<AddIcon />} onClick={openAddModal}>ثبت فاکتور خرید</Button>}
                    />
                )}
            </Card>

            <Modal title={editingPurchase ? `ویرایش فاکتور #${editingPurchase.id}` : "فاکتور خرید جدید"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="supplierId" className="block text-sm font-medium text-on-surface-secondary mb-1">تأمین‌کننده</label>
                            <select id="supplierId" value={formState.supplierId} onChange={(e) => setFormState(prev => ({...prev, supplierId: Number(e.target.value)}))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary">
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="date" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ</label>
                            <input type="date" id="date" value={formState.date} onChange={e => setFormState(prev => ({...prev, date: e.target.value}))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">اقلام</h3>
                        {formState.items.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded-md">
                                <input type="text" placeholder="نام کالا" value={item.itemName} onChange={e => handleItemChange(index, 'itemName', e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded px-2 py-1" required />
                                <input type="number" placeholder="تعداد" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1" required min="1" />
                                <input type="number" placeholder="قیمت واحد" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className="w-28 bg-gray-700 border border-gray-600 rounded px-2 py-1" required min="0" step="0.01"/>
                                <button type="button" onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-400 p-1">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                         <Button type="button" size="sm" variant="secondary" onClick={addItem} icon={<AddIcon />}>افزودن کالا</Button>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>لغو</Button>
                        <Button type="submit">ذخیره فاکتور</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Purchases;