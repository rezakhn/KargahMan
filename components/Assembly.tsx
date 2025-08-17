import React, { useState, useMemo } from 'react';
import type { AssemblyOrder, Part, ProductionLog, Employee } from '../types';
import { AssemblyStatus, PayType } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { AddIcon, TrashIcon, EyeIcon, ClipboardDocumentListIcon } from './icons/Icons';
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
    employees: Employee[];
    productionLogs: ProductionLog[];
    onAddAssemblyOrder: (order: Omit<AssemblyOrder, 'id' | 'status'>) => void;
    onCompleteAssemblyOrder: (orderId: number) => void;
    onDeleteAssemblyOrder: (orderId: number) => void;
    onAddProductionLog: (log: Omit<ProductionLog, 'id'>) => void;
    onDeleteProductionLog: (logId: number) => void;
    calculatePartCost: (partId: number) => number;
}

const Assembly: React.FC<AssemblyProps> = (props) => {
    const { assemblyOrders, parts, employees, productionLogs, onAddAssemblyOrder, onCompleteAssemblyOrder, onDeleteAssemblyOrder, onAddProductionLog, onDeleteProductionLog, calculatePartCost } = props;
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [selectedOrder, setSelectedOrder] = useState<AssemblyOrder | null>(null);
    
    // Add Order Form
    const [partId, setPartId] = useState(0);
    const [quantity, setQuantity] = useState(1);
    
    // Production Log Form
    const [logEmployeeId, setLogEmployeeId] = useState(employees[0]?.id || 0);
    const [logHoursSpent, setLogHoursSpent] = useState(1);

    const assemblyProducts = useMemo(() => parts.filter(p => p.isAssembly), [parts]);
    const partsMap = useMemo(() => new Map(parts.map(p => [p.id, p])), [parts]);
    const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

    const getStatusChip = (status: AssemblyStatus) => {
        const styles = {
            [AssemblyStatus.PENDING]: "bg-yellow-600 text-yellow-100",
            [AssemblyStatus.COMPLETED]: "bg-green-600 text-green-100",
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    const handleAddSubmit = (e: React.FormEvent) => {
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
        setIsAddModalOpen(false);
        setPartId(assemblyProducts[0]?.id || 0);
        setQuantity(1);
    };
    
    const handleAddLogSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || !logEmployeeId || logHoursSpent <= 0) return;
        onAddProductionLog({
            assemblyOrderId: selectedOrder.id,
            employeeId: Number(logEmployeeId),
            hoursSpent: Number(logHoursSpent),
            date: new Date().toISOString().split('T')[0]
        });
        setLogHoursSpent(1);
    }
    
    const openDetailsModal = (order: AssemblyOrder) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const currentOrderLogs = useMemo(() => {
        if (!selectedOrder) return [];
        return productionLogs.filter(log => log.assemblyOrderId === selectedOrder.id);
    }, [selectedOrder, productionLogs]);

    const calculatedCosts = useMemo(() => {
        if (!selectedOrder) return { material: 0, labor: 0, total: 0, perUnit: 0 };
        const assemblyPart = partsMap.get(selectedOrder.partId);

        const material = (assemblyPart?.components || []).reduce((sum, comp) => {
            const compCost = calculatePartCost(comp.partId);
            return sum + (compCost * comp.quantity);
        }, 0) * selectedOrder.quantity;
        
        const labor = currentOrderLogs.reduce((sum, log) => {
            const employee = employeesMap.get(log.employeeId);
            if (!employee) return sum;
            const rate = employee.payType === PayType.HOURLY ? employee.hourlyRate : (employee.dailyRate / 8);
            return sum + (log.hoursSpent * rate);
        }, 0);
        
        const total = material + labor;
        const perUnit = selectedOrder.quantity > 0 ? total / selectedOrder.quantity : 0;

        return { material, labor, total, perUnit };
    }, [selectedOrder, currentOrderLogs, partsMap, employeesMap, calculatePartCost]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">سفارشات مونتاژ</h1>
                <Button icon={<AddIcon />} onClick={() => setIsAddModalOpen(true)}>
                    سفارش مونتاژ جدید
                </Button>
            </div>
            
            <Card>
                {assemblyOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600"><th className="p-4">شماره</th><th className="p-4">تاریخ</th><th className="p-4">محصول</th><th className="p-4">تعداد</th><th className="p-4">هزینه نهایی/واحد</th><th className="p-4">وضعیت</th><th className="p-4">اقدامات</th></tr>
                            </thead>
                            <tbody>
                                {assemblyOrders.map(order => {
                                    const totalCost = (order.materialCost || 0) + (order.laborCost || 0);
                                    const costPerUnit = order.quantity > 0 ? totalCost / order.quantity : 0;
                                    return (
                                        <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                            <td className="p-4 font-medium">#{order.id}</td>
                                            <td className="p-4">{formatDateShamsi(order.date)}</td>
                                            <td className="p-4">{partsMap.get(order.partId)?.name || '؟'}</td>
                                            <td className="p-4 font-mono">{order.quantity.toLocaleString('fa-IR')}</td>
                                            <td className="p-4 font-mono">{order.status === AssemblyStatus.COMPLETED ? Math.round(costPerUnit).toLocaleString('fa-IR') : '-'}</td>
                                            <td className="p-4">{getStatusChip(order.status)}</td>
                                            <td className="p-4 flex items-center space-x-2 space-x-reverse">
                                                <button onClick={() => openDetailsModal(order)} className="p-1 text-on-surface-secondary hover:text-primary" title="مشاهده جزئیات"><EyeIcon className="w-5 h-5"/></button>
                                                <button onClick={() => onDeleteAssemblyOrder(order.id)} className="p-1 text-on-surface-secondary hover:text-red-500" title="حذف"><TrashIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState title="هیچ سفارش مونتاژی در جریان نیست" message="برای شروع تولید، اولین سفارش مونتاژ خود را ثبت کنید." action={<Button icon={<AddIcon />} onClick={() => setIsAddModalOpen(true)}>ثبت سفارش مونتاژ</Button>} />
                )}
            </Card>

            <Modal title="سفارش مونتاژ جدید" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="partId" className="block text-sm font-medium text-on-surface-secondary mb-1">محصول مونتاژی</label>
                        <select id="partId" value={partId} onChange={e => setPartId(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required>
                             <option value="0" disabled>یک محصول را انتخاب کنید</option>
                             {assemblyProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-on-surface-secondary mb-1">تعداد</label>
                        <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="1" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                        <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>لغو</Button>
                        <Button type="submit">ایجاد سفارش</Button>
                    </div>
                </form>
            </Modal>
            
            {selectedOrder && partsMap.get(selectedOrder.partId) && (
                <Modal size="lg" title={`جزئیات سفارش مونتاژ #${selectedOrder.id} - ${partsMap.get(selectedOrder.partId)?.name}`} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-primary">خلاصه هزینه</h3>
                            <Card className="space-y-2">
                                <div className="flex justify-between"><span className="text-on-surface-secondary">هزینه مواد اولیه:</span> <span className="font-mono">{Math.round(calculatedCosts.material).toLocaleString('fa-IR')}</span></div>
                                <div className="flex justify-between"><span className="text-on-surface-secondary">هزینه نیروی کار:</span> <span className="font-mono">{Math.round(calculatedCosts.labor).toLocaleString('fa-IR')}</span></div>
                                <div className="flex justify-between font-bold border-t border-gray-600 pt-2 mt-2"><span className="text-on-surface">هزینه کل:</span> <span className="font-mono">{Math.round(calculatedCosts.total).toLocaleString('fa-IR')}</span></div>
                                <div className="flex justify-between font-bold"><span className="text-on-surface">هزینه هر واحد:</span> <span className="font-mono text-teal-400">{Math.round(calculatedCosts.perUnit).toLocaleString('fa-IR')}</span></div>
                            </Card>
                            
                             <h3 className="text-lg font-bold mt-6 mb-2 text-primary">مواد اولیه مورد نیاز</h3>
                             <Card>
                                <ul className="divide-y divide-gray-700 text-sm">
                                   {(partsMap.get(selectedOrder.partId)?.components || []).map(c => (
                                        <li key={c.partId} className="py-1 flex justify-between">
                                            <span>{partsMap.get(c.partId)?.name}</span>
                                            <span className="font-mono text-on-surface-secondary">{(c.quantity * selectedOrder.quantity).toLocaleString('fa-IR')} عدد</span>
                                        </li>
                                   ))}
                                </ul>
                            </Card>
                        </div>
                        <div>
                            <div className="flex items-center mb-2">
                                <ClipboardDocumentListIcon className="w-6 h-6 ml-2 text-primary" />
                                <h3 className="text-lg font-bold text-primary">کارکرد تولید</h3>
                            </div>
                           
                            {selectedOrder.status === AssemblyStatus.PENDING && (
                                <form onSubmit={handleAddLogSubmit} className="p-4 bg-gray-800 rounded-lg mb-4 flex gap-2 items-end">
                                    <div className="flex-grow">
                                        <label className="text-xs text-on-surface-secondary">کارمند</label>
                                        <select value={logEmployeeId} onChange={e => setLogEmployeeId(Number(e.target.value))} className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-sm">
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                         <label className="text-xs text-on-surface-secondary">ساعت</label>
                                         <input type="number" value={logHoursSpent} onChange={e => setLogHoursSpent(Number(e.target.value))} className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-sm" min="0.1" step="0.1" />
                                    </div>
                                    <Button type="submit" size="sm" className="h-[34px]">افزودن</Button>
                                </form>
                            )}
                            
                             <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {currentOrderLogs.length > 0 ? currentOrderLogs.map(log => (
                                    <div key={log.id} className="flex justify-between items-center p-2 bg-gray-800 rounded text-sm">
                                        <span>{employeesMap.get(log.employeeId)?.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-on-surface-secondary">{log.hoursSpent.toLocaleString('fa-IR')} ساعت</span>
                                             {selectedOrder.status === AssemblyStatus.PENDING && (
                                                <button onClick={() => onDeleteProductionLog(log.id)} className="text-red-500 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4" /></button>
                                             )}
                                        </div>
                                    </div>
                                )) : <p className="text-center text-sm text-on-surface-secondary py-4">هنوز کارکردی ثبت نشده.</p>}
                            </div>
                        </div>
                    </div>
                     <div className="mt-6 flex justify-end">
                        {selectedOrder.status === AssemblyStatus.PENDING ? (
                            <Button onClick={() => { onCompleteAssemblyOrder(selectedOrder.id); setIsDetailsModalOpen(false); }}>تکمیل و ثبت نهایی هزینه‌ها</Button>
                        ) : (
                             <Button variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>بستن</Button>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Assembly;