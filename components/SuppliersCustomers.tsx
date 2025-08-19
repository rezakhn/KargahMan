import React, { useState, useEffect, useMemo } from 'react';
import type { Contact, SalesOrder, Part } from '../types.ts';
import { OrderStatus, ContactRole } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import Modal from './shared/Modal.tsx';
import EmptyState from './shared/EmptyState.tsx';
import { AddIcon, EditIcon, TrashIcon, ClipboardDocumentListIcon } from './icons/Icons.tsx';

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
    customer: Contact;
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
    contacts: Contact[];
    orders: SalesOrder[];
    partsMap: Map<number, Part>;
    onAddContact: (contact: Omit<Contact, 'id'>) => void;
    onEditContact: (contact: Contact) => void;
    onDeleteContact: (id: number) => void;
}

type ModalType = 'ADD' | 'EDIT';

const SuppliersCustomers: React.FC<SuppliersCustomersProps> = (props) => {
    const { contacts, orders, partsMap, onAddContact, onEditContact, onDeleteContact } = props;
    
    const [modal, setModal] = useState<{ type: ModalType; data: Contact | null } | null>(null);
    const [historyModalCustomer, setHistoryModalCustomer] = useState<Contact | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState = {
        name: '',
        contactInfo: '',
        phone: '',
        address: '',
        job: '',
        activityType: '',
        roles: [] as ContactRole[]
    };
    const [formState, setFormState] = useState(initialFormState);

    useEffect(() => {
        if (modal?.data) {
            const data = modal.data;
            setFormState({
                name: data.name || '',
                contactInfo: data.contactInfo || '',
                phone: data.phone || '',
                address: data.address || '',
                job: data.job || '',
                activityType: data.activityType || '',
                roles: data.roles || [],
            });
        } else {
            setFormState(initialFormState);
        }
    }, [modal]);
    
    const openModal = (type: ModalType, data: Contact | null = null) => {
        setModal({ type, data });
    };

    const closeModal = () => {
        setModal(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
    };
    
    const handleRoleChange = (role: ContactRole) => {
        setFormState(prev => {
            const newRoles = prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role];
            return { ...prev, roles: newRoles };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modal || formState.roles.length === 0) {
            alert("لطفاً حداقل یک نقش برای مخاطب انتخاب کنید.");
            return;
        }
        
        const payload: Omit<Contact, 'id'> = {
            name: formState.name,
            contactInfo: formState.contactInfo,
            phone: formState.phone,
            address: formState.address,
            roles: formState.roles,
            job: formState.roles.includes(ContactRole.CUSTOMER) ? formState.job : '',
            activityType: formState.roles.includes(ContactRole.SUPPLIER) ? formState.activityType : '',
        };

        if (modal.type === 'EDIT') {
            onEditContact({ ...(modal.data as Contact), ...payload });
        } else {
            onAddContact(payload);
        }
        closeModal();
    };
    
    const getModalTitle = () => {
        if (!modal) return '';
        return modal.type === 'ADD' ? 'افزودن مخاطب' : 'ویرایش مخاطب';
    }

    const filteredContacts = useMemo(() => {
        if (!searchTerm) return contacts;
        const lowercasedFilter = searchTerm.toLowerCase();
        return contacts.filter(c =>
            Object.values(c).some(value => 
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [contacts, searchTerm]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">مخاطبین</h1>
                <Button icon={<AddIcon />} onClick={() => openModal('ADD')}>
                    افزودن مخاطب
                </Button>
            </div>
             <div className="mb-6">
                <input
                    type="text"
                    placeholder="جستجو در نام، شماره تماس، آدرس و سایر اطلاعات..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                />
            </div>
            
            <Card>
                {contacts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="px-4 py-3">نام</th>
                                    <th className="px-4 py-3">نقش</th>
                                    <th className="px-4 py-3">شماره تماس</th>
                                    <th className="px-4 py-3">اطلاعات دیگر</th>
                                    <th className="px-4 py-3">اقدامات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map(c => (
                                    <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="px-4 py-2 font-medium">{c.name}</td>
                                        <td className="px-4 py-2 text-sm">{c.roles.join('، ')}</td>
                                        <td className="px-4 py-2 font-mono">{c.phone || '-'}</td>
                                        <td className="px-4 py-2 text-sm text-on-surface-secondary">{c.job || c.activityType || '-'}</td>
                                        <td className="px-4 py-2 flex items-center space-x-2 space-x-reverse">
                                            {c.roles.includes(ContactRole.CUSTOMER) && (
                                                <button onClick={() => setHistoryModalCustomer(c)} className="p-1 text-on-surface-secondary hover:text-blue-400" title="تاریخچه سفارشات"><ClipboardDocumentListIcon className="w-5 h-5"/></button>
                                            )}
                                            <button onClick={() => openModal('EDIT', c)} className="p-1 text-on-surface-secondary hover:text-primary" title="ویرایش"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeleteContact(c.id)} className="p-1 text-on-surface-secondary hover:text-red-500" title="حذف"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredContacts.length === 0 && searchTerm && <p className="text-center p-4 text-on-surface-secondary">موردی با این مشخصات یافت نشد.</p>}
                    </div>
                ) : (
                     <EmptyState
                        title="هیچ مخاطبی یافت نشد"
                        message="برای شروع، اولین مشتری یا تأمین‌کننده خود را اضافه کنید."
                        action={<Button icon={<AddIcon />} onClick={() => openModal('ADD')}>افزودن مخاطب</Button>}
                    />
                )}
            </Card>
            
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
                        <label className="block text-sm font-medium text-on-surface-secondary mb-2">نقش مخاطب *</label>
                        <div className="flex gap-4 p-3 bg-gray-800 rounded-md">
                             <label className="flex items-center">
                                <input type="checkbox" checked={formState.roles.includes(ContactRole.CUSTOMER)} onChange={() => handleRoleChange(ContactRole.CUSTOMER)} className="rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary" />
                                <span className="mr-2 text-on-surface">مشتری</span>
                             </label>
                             <label className="flex items-center">
                                <input type="checkbox" checked={formState.roles.includes(ContactRole.SUPPLIER)} onChange={() => handleRoleChange(ContactRole.SUPPLIER)} className="rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary" />
                                <span className="mr-2 text-on-surface">تأمین‌کننده</span>
                             </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-on-surface-secondary mb-1">آدرس</label>
                        <textarea id="address" name="address" value={formState.address} onChange={handleFormChange} rows={2} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2"></textarea>
                    </div>

                    {formState.roles.includes(ContactRole.CUSTOMER) && (
                        <div>
                            <label htmlFor="job" className="block text-sm font-medium text-on-surface-secondary mb-1">شغل (مشتری)</label>
                            <input type="text" id="job" name="job" value={formState.job} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                    )}

                    {formState.roles.includes(ContactRole.SUPPLIER) && (
                        <div>
                            <label htmlFor="activityType" className="block text-sm font-medium text-on-surface-secondary mb-1">نوع فعالیت (تأمین‌کننده)</label>
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