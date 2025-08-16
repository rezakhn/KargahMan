import React, { useState, useEffect } from 'react';
import type { Supplier, Customer } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import EmptyState from './shared/EmptyState';
import { AddIcon, EditIcon, TrashIcon } from './icons/Icons';

interface SuppliersCustomersProps {
    suppliers: Supplier[];
    customers: Customer[];
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    onEditSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (id: number) => void;
    onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
    onEditCustomer: (customer: Customer) => void;
    onDeleteCustomer: (id: number) => void;
}

type ModalType = 'ADD_SUPPLIER' | 'EDIT_SUPPLIER' | 'ADD_CUSTOMER' | 'EDIT_CUSTOMER';

const SuppliersCustomers: React.FC<SuppliersCustomersProps> = (props) => {
    const { suppliers, customers, onAddSupplier, onEditSupplier, onDeleteSupplier, onAddCustomer, onEditCustomer, onDeleteCustomer } = props;
    
    const [modal, setModal] = useState<{ type: ModalType; data: Supplier | Customer | null } | null>(null);
    const [formState, setFormState] = useState({ name: '', contactInfo: '' });

    useEffect(() => {
        if (modal?.data) {
            setFormState({ name: modal.data.name, contactInfo: modal.data.contactInfo });
        } else {
            setFormState({ name: '', contactInfo: '' });
        }
    }, [modal]);
    
    const openModal = (type: ModalType, data: Supplier | Customer | null = null) => {
        setModal({ type, data });
    };

    const closeModal = () => {
        setModal(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modal) return;
        
        switch (modal.type) {
            case 'ADD_SUPPLIER':
                onAddSupplier(formState);
                break;
            case 'EDIT_SUPPLIER':
                onEditSupplier({ ...modal.data as Supplier, ...formState });
                break;
            case 'ADD_CUSTOMER':
                onAddCustomer(formState);
                break;
            case 'EDIT_CUSTOMER':
                onEditCustomer({ ...modal.data as Customer, ...formState });
                break;
        }
        closeModal();
    };
    
    const getModalTitle = () => {
        if (!modal) return '';
        switch (modal.type) {
            case 'ADD_SUPPLIER': return 'افزودن تأمین‌کننده';
            case 'EDIT_SUPPLIER': return 'ویرایش تأمین‌کننده';
            case 'ADD_CUSTOMER': return 'افزودن مشتری';
            case 'EDIT_CUSTOMER': return 'ویرایش مشتری';
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-on-surface">مخاطبین</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Suppliers Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-on-surface">تأمین‌کنندگان</h2>
                        <Button icon={<AddIcon />} size="sm" onClick={() => openModal('ADD_SUPPLIER')}>
                            تأمین‌کننده جدید
                        </Button>
                    </div>
                    <Card>
                        {suppliers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="border-b border-gray-600">
                                            <th className="p-4">نام</th>
                                            <th className="p-4">اطلاعات تماس</th>
                                            <th className="p-4">اقدامات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suppliers.map(s => (
                                            <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                                <td className="p-4 font-medium">{s.name}</td>
                                                <td className="p-4">{s.contactInfo}</td>
                                                <td className="p-4 flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => openModal('EDIT_SUPPLIER', s)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => onDeleteSupplier(s.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                             <EmptyState
                                title="هیچ تأمین‌کننده‌ای یافت نشد"
                                message="برای ثبت فاکتورهای خرید، ابتدا تأمین‌کنندگان خود را اضافه کنید."
                                action={<Button icon={<AddIcon />} size="sm" onClick={() => openModal('ADD_SUPPLIER')}>افزودن تأمین‌کننده</Button>}
                            />
                        )}
                    </Card>
                </div>
                
                {/* Customers Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-on-surface">مشتریان</h2>
                         <Button icon={<AddIcon />} size="sm" onClick={() => openModal('ADD_CUSTOMER')}>
                            مشتری جدید
                        </Button>
                    </div>
                     <Card>
                        {customers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="border-b border-gray-600">
                                            <th className="p-4">نام</th>
                                            <th className="p-4">اطلاعات تماس</th>
                                            <th className="p-4">اقدامات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map(c => (
                                            <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                                <td className="p-4 font-medium">{c.name}</td>
                                                <td className="p-4">{c.contactInfo}</td>
                                                <td className="p-4 flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => openModal('EDIT_CUSTOMER', c)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => onDeleteCustomer(c.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         ) : (
                             <EmptyState
                                title="هیچ مشتری یافت نشد"
                                message="برای ثبت سفارشات فروش، ابتدا مشتریان خود را اضافه کنید."
                                action={<Button icon={<AddIcon />} size="sm" onClick={() => openModal('ADD_CUSTOMER')}>افزودن مشتری</Button>}
                            />
                        )}
                    </Card>
                </div>
            </div>
            
            <Modal title={getModalTitle()} isOpen={!!modal} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-secondary mb-1">نام</label>
                        <input type="text" id="name" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required />
                    </div>
                    <div>
                        <label htmlFor="contactInfo" className="block text-sm font-medium text-on-surface-secondary mb-1">اطلاعات تماس</label>
                        <input type="text" id="contactInfo" value={formState.contactInfo} onChange={e => setFormState({...formState, contactInfo: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={closeModal}>لغو</Button>
                        <Button type="submit">ذخیره</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuppliersCustomers;