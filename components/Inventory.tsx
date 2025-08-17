import React, { useState, useEffect } from 'react';
import type { Part, AssemblyComponent } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import Modal from './shared/Modal.tsx';
import { AddIcon, EditIcon, TrashIcon } from './icons/Icons.tsx';
import EmptyState from './shared/EmptyState.tsx';

interface InventoryProps {
    parts: Part[];
    onAddPart: (part: Omit<Part, 'id'>) => void;
    onEditPart: (part: Part) => void;
    onDeletePart: (partId: number) => void;
    calculatePartCost: (partId: number) => number;
}

const Inventory: React.FC<InventoryProps> = ({ parts, onAddPart, onEditPart, onDeletePart, calculatePartCost }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<Part | null>(null);

    const initialPartState: Omit<Part, 'id'> = {
        name: '',
        isAssembly: false,
        stock: 0,
        threshold: 10,
        cost: 0,
        components: [],
    };
    const [partForm, setPartForm] = useState(initialPartState);

    useEffect(() => {
        if (editingPart) {
            setPartForm({ ...initialPartState, ...editingPart });
        } else {
            setPartForm(initialPartState);
        }
    }, [editingPart, isModalOpen]);

    const getStockStatus = (part: Part) => {
        if (part.stock <= 0) return <span className="px-2 py-1 text-xs font-semibold text-red-100 bg-red-600 rounded-full">ناموجود</span>;
        if (part.stock < part.threshold) return <span className="px-2 py-1 text-xs font-semibold text-yellow-100 bg-yellow-600 rounded-full">رو به اتمام</span>;
        return <span className="px-2 py-1 text-xs font-semibold text-green-100 bg-green-600 rounded-full">موجود</span>;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const partData = {
            ...partForm,
            stock: Number(partForm.stock),
            threshold: Number(partForm.threshold),
            cost: Number(partForm.cost),
            components: partForm.isAssembly ? partForm.components : [],
        };

        if (editingPart) {
            onEditPart({ ...partData, id: editingPart.id });
        } else {
            onAddPart(partData);
        }
        
        setIsModalOpen(false);
    };
    
    const openAddModal = () => {
        setEditingPart(null);
        setIsModalOpen(true);
    };

    const openEditModal = (part: Part) => {
        setEditingPart(part);
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setPartForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleComponentChange = (index: number, field: keyof AssemblyComponent, value: string | number) => {
        const newComponents = [...(partForm.components || [])];
        newComponents[index] = { ...newComponents[index], [field]: Number(value) };
        setPartForm(prev => ({ ...prev, components: newComponents }));
    };

    const addComponent = () => {
        const rawMaterials = parts.filter(p => !p.isAssembly);
        if (rawMaterials.length === 0) return;
        const newComponent: AssemblyComponent = { partId: rawMaterials[0].id, quantity: 1 };
        setPartForm(prev => ({ ...prev, components: [...(prev.components || []), newComponent] }));
    };

    const removeComponent = (index: number) => {
        setPartForm(prev => ({ ...prev, components: prev.components?.filter((_, i) => i !== index) }));
    };

    const rawMaterials = parts.filter(p => !p.isAssembly);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">انبار</h1>
                <Button variant="secondary" icon={<AddIcon />} onClick={openAddModal}>
                    افزودن قطعه/محصول
                </Button>
            </div>
            
            <Card>
                {parts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="px-4 py-3">نام قطعه</th>
                                    <th className="px-4 py-3">نوع</th>
                                    <th className="px-4 py-3">موجودی</th>
                                    <th className="px-4 py-3">هزینه واحد (تومان)</th>
                                    <th className="px-4 py-3">وضعیت</th>
                                    <th className="px-4 py-3">اقدامات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parts.map(part => (
                                    <tr key={part.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="px-4 py-2 font-medium">{part.name}</td>
                                        <td className="px-4 py-2">{part.isAssembly ? 'مونتاژی/محصول' : 'ماده خام'}</td>
                                        <td className="px-4 py-2 font-mono">{part.stock.toLocaleString('fa-IR')}</td>
                                        <td className="px-4 py-2 font-mono">{Math.round(calculatePartCost(part.id)).toLocaleString('fa-IR')}</td>
                                        <td className="px-4 py-2">{getStockStatus(part)}</td>
                                        <td className="px-4 py-2 flex items-center space-x-2 space-x-reverse">
                                            <button onClick={() => openEditModal(part)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeletePart(part.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="انبار شما خالی است"
                        message="برای مدیریت موجودی، قطعات خام یا محصولات نهایی خود را اضافه کنید."
                        action={<Button variant="secondary" icon={<AddIcon />} onClick={openAddModal}>افزودن آیتم به انبار</Button>}
                    />
                )}
            </Card>

            <Modal title={editingPart ? "ویرایش قطعه/محصول" : "افزودن قطعه/محصول جدید"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-secondary mb-1">نام قطعه/محصول</label>
                        <input type="text" id="name" name="name" value={partForm.name} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required />
                    </div>
                    <div>
                        <label className="flex items-center">
                            <input type="checkbox" name="isAssembly" checked={partForm.isAssembly} onChange={handleFormChange} className="rounded bg-gray-800 border-gray-600 text-primary focus:ring-primary" />
                            <span className="mr-2 text-on-surface">این یک قطعه مونتاژی / محصول نهایی است</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-on-surface-secondary mb-1">موجودی اولیه</label>
                            <input type="number" id="stock" name="stock" value={partForm.stock} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0" />
                        </div>
                        <div>
                            <label htmlFor="threshold" className="block text-sm font-medium text-on-surface-secondary mb-1">نقطه سفارش</label>
                            <input type="number" id="threshold" name="threshold" value={partForm.threshold} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0" />
                        </div>
                    </div>

                    {!partForm.isAssembly && (
                        <div>
                            <label htmlFor="cost" className="block text-sm font-medium text-on-surface-secondary mb-1">هزینه واحد (تومان)</label>
                            <input type="number" id="cost" name="cost" value={partForm.cost} onChange={handleFormChange} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0" />
                        </div>
                    )}
                    
                    {partForm.isAssembly && (
                        <div className="space-y-2 pt-4 border-t border-gray-600">
                            <h3 className="text-lg font-medium">فرمول ساخت (مواد اولیه مورد نیاز)</h3>
                            {partForm.components?.map((component, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-800 rounded-md">
                                    <select value={component.partId} onChange={e => handleComponentChange(index, 'partId', e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded px-2 py-1">
                                        {rawMaterials.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="تعداد" value={component.quantity} onChange={e => handleComponentChange(index, 'quantity', e.target.value)} className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1" required min="1" />
                                    <button type="button" onClick={() => removeComponent(index)} className="text-red-500 hover:text-red-400 p-1">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            <Button type="button" size="sm" variant="secondary" onClick={addComponent} icon={<AddIcon />}>افزودن ماده اولیه</Button>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>لغو</Button>
                        <Button type="submit">ذخیره</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;