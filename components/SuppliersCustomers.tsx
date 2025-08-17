import React, { useState, useEffect, useMemo } from 'react';
import type { Supplier, Customer, SalesOrder, Part } from '../types';
import { OrderStatus } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import EmptyState from './shared/EmptyState';
import { AddIcon, EditIcon, TrashIcon, ClipboardDocumentListIcon } from './icons/Icons';

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

const getStatusChip = (status: OrderStatus) => {
    const styles = {
        [OrderStatus.PENDING]: "bg-yellow-600 text-yellow-100",
        [OrderStatus.PAID]: "bg-blue-600 text-blue-100",
        [OrderStatus.DELIVERED]: "bg-green-600 text-green-100",
        [OrderStatus.CANCELLED]: "bg-red-600 text-red-100",
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
};

interface CustomerHistoryModalProps {
    customer: Customer;
    orders: SalesOrder[];
    partsMap: Map<number, Part>;
    onClose: () => void;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({ customer, orders, partsMap, onClose }) => {
    const customerOrders = useMemo(() => {
        return orders
            .filter(o => o.customerId === customer.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [customer, orders]);
    
    return (
        <Modal size="lg" title={`تاریخچه سفارشات برای ${customer.name}`} isOpen={true} onClose={onClose}>
            <div className="max-h-[70vh] overflow-y-auto space-y-4">
            {customerOrders.length > 0 ? customerOrders.map(order => (
                <Card key={order.id}>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">سفارش #{order.id}</h4>
                        {getStatusChip(order.status)}
                    </div>
                    <p className="text-sm text-on-surface-secondary mb-2">تاریخ: {formatDateShamsi(order.date)}</p>
                    <ul className="text-sm divide-y divide-gray-700 border-y border-gray-700 py-2 my-2">
                        {order.items.map(item => (
                             <li key={item.productId} className="py-1 flex justify-between">
                                <span>{partsMap.get(item.productId)?.name || 'محصول حذف شده'}</span>
                                <span>{item.quantity} × {item.price.toLocaleString('fa-IR')}</span>
                            </li>
                        ))}
                    </ul>
                     <div className="flex justify-between font-bold text-sm">
                        <span>مبلغ کل:</span>
                        <span>{order.totalAmount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                </Card>
            )) : (
                <p className="text-center text-on-surface-secondary py-8">هیچ سفارشی برای این مشتری ثبت نشده است.</p>
            )}
            </div>
        </Modal>
    )
}


interface SuppliersCustomersProps {
    suppliers: Supplier[];
    customers: Customer[];
    orders: SalesOrder[];
    partsMap: Map<number, Part>;
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    onEditSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (id: number) => void;
    onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
    onEditCustomer: (customer: Customer) => void;
    onDeleteCustomer: (id: number) => void;
}

type ModalType = 'ADD_SUPPLIER' | 'EDIT_SUPPLIER' | 'ADD_CUSTOMER' | 'EDIT_CUSTOMER';

const SuppliersCustomers: React.FC<SuppliersCustomersProps> = (props) => {
    const { suppliers, customers, orders, partsMap, onAddSupplier, onEditSupplier, onDeleteSupplier, onAddCustomer, onEditCustomer, onDeleteCustomer } = props;
    
    const [modal, setModal] = useState<{ type: ModalType; data: Supplier | Customer | null } | null>(null);
    const [historyModalCustomer, setHistoryModalCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState = { name: '', contactInfo: '', phone: '', address: '', job: '', activityType: '' };
    const [formState, setFormState] = useState(initialFormState);

    useEffect(() => {
        if (modal?.data) {
            const data = modal.data as any;
            setFormState({
                name: data.name || '',
                contactInfo: data.contactInfo || '',
                phone: data.phone || '',
                address: data.address || '',
                job: data.job || '',
                activityType: data.activityType || '',
            });
        } else {
            setFormState(initialFormState);
        }
    }, [modal]);
    
    const openModal = (type: ModalType, data: Supplier | Customer | null = null) => {
        setModal({ type, data });
    };

    const closeModal = () => {
        setModal(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modal) return;
        
        const commonPayload = {
            name: formState.name,
            contactInfo: formState.contactInfo,
            phone: formState.phone,
            address: formState.address,
        };

        switch (modal.type) {
            case 'ADD_SUPPLIER':
                onAddSupplier({ ...commonPayload, activityType: formState.activityType });
                break;
            case 'EDIT_SUPPLIER':
                onEditSupplier({ ...modal.data as Supplier, ...commonPayload, activityType: formState.activityType });
                break;
            case 'ADD_CUSTOMER':
                onAddCustomer({ ...commonPayload, job: formState.job });
                break;
            case 'EDIT_CUSTOMER':
                onEditCustomer({ ...modal.data as Customer, ...commonPayload, job: formState.job });
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

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        const lowercasedFilter = searchTerm.toLowerCase();
        return suppliers.filter(s =>
            Object.values(s).some(value => 
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [suppliers, searchTerm]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowercasedFilter = searchTerm.toLowerCase();
        return customers.filter(c =>
             Object.values(c).some(value => 
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [customers, searchTerm]);


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-on-surface">مخاطبین</h1>
             <div className="mb-6">
                <input
                    type="text"
                    placeholder="جستجو در نام، شماره تماس، آدرس و سایر اطلاعات..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                />
            </div>
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
                                            <th className="px-4 py-3">نام</th>
                                            <th className="px-4 py-3">شماره تماس</th>
                                            <th className="px-4 py-3">نوع فعالیت</th>
                                            <th className="px-4 py-3">اقدامات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSuppliers.map(s => (
                                            <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                                <td className="px-4 py-2 font-medium">{s.name}</td>
                                                <td className="px-4 py-2 font-mono">{s.phone || '-'}</td>
                                                <td className="px-4 py-2">{s.activityType || '-'}</td>
                                                <td className="px-4 py-2 flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => openModal('EDIT_SUPPLIER', s)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => onDeleteSupplier(s.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredSuppliers.length === 0 && searchTerm && <p className="text-center p-4 text-on-surface-secondary">موردی با این مشخصات یافت نشد.</p>}
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
                                            <th className="px-4 py-3">نام</th>
                                            <th className="px-4 py-3">شماره تماس</th>
                                            <th className="px-4 py-3">شغل</th>
                                            <th className="px-4 py-3">اقدامات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCustomers.map(c => (
                                            <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                                <td className="px-4 py-2 font-medium">{c.name}</td>
                                                <td className="px-4 py-2 font-mono">{c.phone || '-'}</td>
                                                <td className="px-4 py-2">{c.job || '-'}</td>
                                                <td className="px-4 py-2 flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => setHistoryModalCustomer(c)} className="p-1 text-on-surface-secondary hover:text-blue-400" title="تاریخچه سفارشات"><ClipboardDocumentListIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => openModal('EDIT_CUSTOMER', c)} className="p-1 text-on-surface-secondary hover:text-primary" title="ویرایش"><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => onDeleteCustomer(c.id)} className="p-1 text-on-surface-secondary hover:text-red-500" title="حذف"><TrashIcon className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                 {filteredCustomers.length === 0 && searchTerm && <p className="text-center p-4 text-on-surface-secondary">موردی با این مشخصات یافت نشد.</p>}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-on-surface-secondary mb-1">نام *</label>
                            <input type="text" id="name" name="name" value={formState.name} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-on-surface-secondary mb-1">شماره تماس</label>
                            <input type="text" id="phone" name="phone" value={formState.phone} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-on-surface-secondary mb-1">آدرس</label>
                        <textarea id="address" name="address" value={formState.address} onChange={handleFormChange} rows={2} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2"></textarea>
                    </div>

                    {modal?.type.includes('CUSTOMER') && (
                        <div>
                            <label htmlFor="job" className="block text-sm font-medium text-on-surface-secondary mb-1">شغل</label>
                            <input type="text" id="job" name="job" value={formState.job} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                    )}

                    {modal?.type.includes('SUPPLIER') && (
                        <div>
                            <label htmlFor="activityType" className="block text-sm font-medium text-on-surface-secondary mb-1">نوع فعالیت</label>
                            <input type="text" id="activityType" name="activityType" value={formState.activityType} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="contactInfo" className="block text-sm font-medium text-on-surface-secondary mb-1">اطلاعات تکمیلی (ایمیل و...)</label>
                        <input type="text" id="contactInfo" name="contactInfo" value={formState.contactInfo} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={closeModal}>لغو</Button>
                        <Button type="submit">ذخیره</Button>
                    </div>
                </form>
            </Modal>
            
            {historyModalCustomer && (
                <CustomerHistoryModal 
                    customer={historyModalCustomer}
                    orders={orders}
                    partsMap={partsMap}
                    onClose={() => setHistoryModalCustomer(null)}
                />
            )}
        </div>
    );
};

export default SuppliersCustomers;