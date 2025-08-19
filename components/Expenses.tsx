import React, { useState, useEffect } from 'react';
import type { Expense } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import Modal from './shared/Modal.tsx';
import { AddIcon, EditIcon, TrashIcon } from './icons/Icons.tsx';
import EmptyState from './shared/EmptyState.tsx';
import PersianDatePicker from './shared/PersianDatePicker.tsx';

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

const expenseCategories = ['اجاره', 'قبوض', 'حمل و نقل', 'تعمیرات', 'تبلیغات', 'متفرقه'];

interface ExpensesProps {
    expenses: Expense[];
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onEditExpense: (expense: Expense) => void;
    onDeleteExpense: (expenseId: number) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onEditExpense, onDeleteExpense }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: expenseCategories[0],
    };
    const [formState, setFormState] = useState(initialFormState);

    useEffect(() => {
        if (editingExpense) {
            setFormState(editingExpense);
        } else {
            setFormState(initialFormState);
        }
    }, [editingExpense, isModalOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const expenseData = {
            ...formState,
            amount: Number(formState.amount),
        };

        if (editingExpense) {
            onEditExpense({ ...expenseData, id: editingExpense.id });
        } else {
            onAddExpense(expenseData);
        }
        setIsModalOpen(false);
    };
    
    const openAddModal = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">مدیریت هزینه‌ها</h1>
                <Button icon={<AddIcon />} onClick={openAddModal}>
                    ثبت هزینه جدید
                </Button>
            </div>

            <Card>
                {expenses.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="px-4 py-3">تاریخ</th>
                                    <th className="px-4 py-3">شرح هزینه</th>
                                    <th className="px-4 py-3">دسته‌بندی</th>
                                    <th className="px-4 py-3">مبلغ (تومان)</th>
                                    <th className="px-4 py-3">اقدامات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(expense => (
                                    <tr key={expense.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="px-4 py-2">{formatDateShamsi(expense.date)}</td>
                                        <td className="px-4 py-2 font-medium">{expense.description}</td>
                                        <td className="px-4 py-2">{expense.category}</td>
                                        <td className="px-4 py-2 font-mono">{expense.amount.toLocaleString('fa-IR')}</td>
                                        <td className="px-4 py-2 flex items-center space-x-2 space-x-reverse">
                                            <button onClick={() => openEditModal(expense)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeleteExpense(expense.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="هیچ هزینه‌ای ثبت نشده است"
                        message="برای محاسبه دقیق سود، هزینه‌های کارگاه را ثبت کنید."
                        action={<Button icon={<AddIcon />} onClick={openAddModal}>ثبت هزینه</Button>}
                    />
                )}
            </Card>

            <Modal title={editingExpense ? "ویرایش هزینه" : "ثبت هزینه جدید"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-on-surface-secondary mb-1">شرح هزینه</label>
                        <input type="text" id="description" name="description" value={formState.description} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-on-surface-secondary mb-1">مبلغ (تومان)</label>
                            <input type="number" id="amount" name="amount" value={formState.amount} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0"/>
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ</label>
                             <PersianDatePicker
                                value={formState.date}
                                onChange={date => setFormState(prev => ({...prev, date: date}))}
                                inputId="date"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-on-surface-secondary mb-1">دسته‌بندی</label>
                        <select id="category" name="category" value={formState.category} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2">
                           {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>لغو</Button>
                        <Button type="submit">ذخیره هزینه</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;