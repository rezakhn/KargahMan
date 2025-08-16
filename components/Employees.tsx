import React, { useState, useEffect } from 'react';
import type { Employee, WorkLog } from '../types';
import { PayType } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { AddIcon, EditIcon, TrashIcon, CalendarIcon } from './icons/Icons';
import EmptyState from './shared/EmptyState';

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

interface EmployeesProps {
    employees: Employee[];
    workLogs: WorkLog[];
    onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
    onEditEmployee: (employee: Employee) => void;
    onDeleteEmployee: (employeeId: number) => void;
    onAddWorkLog: (workLog: Omit<WorkLog, 'id'>) => void;
    onEditWorkLog: (workLog: WorkLog) => void;
    onDeleteWorkLog: (workLogId: number) => void;
}

const Employees: React.FC<EmployeesProps> = (props) => {
    const { employees, workLogs, onAddEmployee, onEditEmployee, onDeleteEmployee, onAddWorkLog, onEditWorkLog, onDeleteWorkLog } = props;
    
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isWorkLogManagerOpen, setIsWorkLogManagerOpen] = useState(false);
    
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);

    const initialNewEmployeeState: Omit<Employee, 'id'> = { name: '', payType: PayType.HOURLY, dailyRate: 0, hourlyRate: 0, overtimeRate: 0 };
    const [employeeForm, setEmployeeForm] = useState(initialNewEmployeeState);
    
    const initialWorkLogState = { date: new Date().toISOString().split('T')[0], overtimeHours: 0, hoursWorked: 8, workedDay: true };
    const [workLogForm, setWorkLogForm] = useState(initialWorkLogState);

    useEffect(() => {
        if (editingEmployee) {
            setEmployeeForm(editingEmployee);
        } else {
            setEmployeeForm(initialNewEmployeeState);
        }
    }, [editingEmployee]);
    
    useEffect(() => {
        if (editingWorkLog) {
            setWorkLogForm({
                date: editingWorkLog.date,
                overtimeHours: editingWorkLog.overtimeHours,
                hoursWorked: editingWorkLog.hoursWorked ?? initialWorkLogState.hoursWorked,
                workedDay: editingWorkLog.workedDay ?? initialWorkLogState.workedDay,
            });
        } else {
            setWorkLogForm(initialWorkLogState);
        }
    }, [editingWorkLog]);

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsEmployeeModalOpen(true);
    };

    const openAddModal = () => {
        setEditingEmployee(null);
        setIsEmployeeModalOpen(true);
    }

    const handleEmployeeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const employeeData = { ...employeeForm, dailyRate: +employeeForm.dailyRate, hourlyRate: +employeeForm.hourlyRate, overtimeRate: +employeeForm.overtimeRate };
        if (editingEmployee) {
            onEditEmployee({ ...employeeData, id: editingEmployee.id });
        } else {
            onAddEmployee(employeeData);
        }
        setIsEmployeeModalOpen(false);
    };

    const handleWorkLogSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        const logData: Omit<WorkLog, 'id' | 'employeeId'> = { date: workLogForm.date, overtimeHours: +workLogForm.overtimeHours };
        if (selectedEmployee.payType === PayType.HOURLY) {
            logData.hoursWorked = +workLogForm.hoursWorked!;
        } else {
            logData.workedDay = workLogForm.workedDay;
        }

        if (editingWorkLog) {
            onEditWorkLog({ ...logData, id: editingWorkLog.id, employeeId: selectedEmployee.id });
        } else {
            onAddWorkLog({ ...logData, employeeId: selectedEmployee.id });
        }
        setEditingWorkLog(null);
        setWorkLogForm(initialWorkLogState);
    };

    const openWorkLogManager = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsWorkLogManagerOpen(true);
    };
    
    const startEditWorkLog = (log: WorkLog) => {
        setEditingWorkLog(log);
    }
    
    const cancelEditWorkLog = () => {
        setEditingWorkLog(null);
        setWorkLogForm(initialWorkLogState);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">کارکنان</h1>
                <Button icon={<AddIcon />} onClick={openAddModal}>افزودن کارمند</Button>
            </div>
            
            <Card>
                {employees.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600"><th className="p-4">نام</th><th className="p-4">نوع پرداخت</th><th className="p-4">نرخ</th><th className="p-4">نرخ اضافه‌کاری</th><th className="p-4">اقدامات</th></tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="p-4 font-medium">{emp.name}</td>
                                        <td className="p-4 capitalize">{emp.payType}</td>
                                        <td className="p-4">{emp.payType === PayType.DAILY ? `${emp.dailyRate.toLocaleString('fa-IR')} / روز` : `${emp.hourlyRate.toLocaleString('fa-IR')} / ساعت`}</td>
                                        <td className="p-4">{emp.overtimeRate.toLocaleString('fa-IR')} / ساعت</td>
                                        <td className="p-4 flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                                            <button onClick={() => openEditModal(emp)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeleteEmployee(emp.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                            <Button size="sm" icon={<CalendarIcon />} onClick={() => openWorkLogManager(emp)}>مدیریت کارکرد</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState title="هیچ کارمندی ثبت نشده است" message="برای شروع، اولین کارمند خود را اضافه کنید." action={<Button icon={<AddIcon />} onClick={openAddModal}>افزودن کارمند</Button>} />
                )}
            </Card>

            <Modal title={editingEmployee ? "ویرایش کارمند" : "افزودن کارمند جدید"} isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)}>
                <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                    <div><label htmlFor="name" className="block text-sm font-medium text-on-surface-secondary mb-1">نام کامل</label><input type="text" name="name" id="name" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required /></div>
                    <div><label htmlFor="payType" className="block text-sm font-medium text-on-surface-secondary mb-1">نوع پرداخت</label><select name="payType" id="payType" value={employeeForm.payType} onChange={e => setEmployeeForm({...employeeForm, payType: e.target.value as PayType})} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2"><option value={PayType.HOURLY}>ساعتی</option><option value={PayType.DAILY}>روزمزد</option></select></div>
                    {employeeForm.payType === PayType.HOURLY ? (
                        <div><label htmlFor="hourlyRate" className="block text-sm font-medium text-on-surface-secondary mb-1">نرخ ساعتی (تومان)</label><input type="number" name="hourlyRate" id="hourlyRate" value={employeeForm.hourlyRate} onChange={e => setEmployeeForm({...employeeForm, hourlyRate: +e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0" /></div>
                    ) : (
                        <div><label htmlFor="dailyRate" className="block text-sm font-medium text-on-surface-secondary mb-1">نرخ روزمزد (تومان)</label><input type="number" name="dailyRate" id="dailyRate" value={employeeForm.dailyRate} onChange={e => setEmployeeForm({...employeeForm, dailyRate: +e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0" /></div>
                    )}
                    <div><label htmlFor="overtimeRate" className="block text-sm font-medium text-on-surface-secondary mb-1">نرخ اضافه‌کاری (تومان/ساعت)</label><input type="number" name="overtimeRate" id="overtimeRate" value={employeeForm.overtimeRate} onChange={e => setEmployeeForm({...employeeForm, overtimeRate: +e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2" required min="0" /></div>
                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse"><Button type="button" variant="secondary" onClick={() => setIsEmployeeModalOpen(false)}>لغو</Button><Button type="submit">ذخیره</Button></div>
                </form>
            </Modal>

            {selectedEmployee && (
                 <Modal title={`مدیریت کارکرد برای ${selectedEmployee.name}`} isOpen={isWorkLogManagerOpen} onClose={() => setIsWorkLogManagerOpen(false)}>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold mb-2">{editingWorkLog ? "ویرایش کارکرد" : "ثبت کارکرد جدید"}</h3>
                            <form onSubmit={handleWorkLogSubmit} className="p-4 bg-gray-800 rounded-lg space-y-4">
                                <div><label htmlFor="date" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ</label><input type="date" name="date" id="date" value={workLogForm.date} onChange={e => setWorkLogForm({...workLogForm, date: e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" required /></div>
                                {selectedEmployee.payType === PayType.HOURLY && (<div><label htmlFor="hoursWorked" className="block text-sm font-medium text-on-surface-secondary mb-1">ساعات کاری</label><input type="number" name="hoursWorked" id="hoursWorked" value={workLogForm.hoursWorked} onChange={e => setWorkLogForm({...workLogForm, hoursWorked: +e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" required min="0" /></div>)}
                                {selectedEmployee.payType === PayType.DAILY && (<div><label className="flex items-center"><input type="checkbox" checked={workLogForm.workedDay} onChange={e => setWorkLogForm({...workLogForm, workedDay: e.target.checked})} className="rounded bg-gray-800 border-gray-600 text-primary" /><span className="mr-2 text-on-surface">روز کاری کامل</span></label></div>)}
                                <div><label htmlFor="overtimeHours" className="block text-sm font-medium text-on-surface-secondary mb-1">ساعات اضافه‌کاری</label><input type="number" name="overtimeHours" id="overtimeHours" value={workLogForm.overtimeHours} onChange={e => setWorkLogForm({...workLogForm, overtimeHours: +e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" required min="0" /></div>
                                <div className="flex justify-end space-x-2 space-x-reverse">
                                    {editingWorkLog && <Button type="button" variant="secondary" onClick={cancelEditWorkLog}>لغو ویرایش</Button>}
                                    <Button type="submit">{editingWorkLog ? 'ذخیره تغییرات' : 'ثبت کارکرد'}</Button>
                                </div>
                            </form>
                        </div>
                        <div>
                             <h3 className="text-lg font-bold mb-2">کارکردهای ثبت شده</h3>
                             <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg">
                                <table className="w-full text-right">
                                    <thead className="sticky top-0 bg-surface"><tr className="border-b border-gray-600"><th className="p-2">تاریخ</th><th className="p-2">کارکرد</th><th className="p-2">اضافه‌کاری</th><th className="p-2">اقدامات</th></tr></thead>
                                    <tbody>
                                        {workLogs.filter(l => l.employeeId === selectedEmployee.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                                            <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                                <td className="p-2">{formatDateShamsi(log.date)}</td>
                                                <td className="p-2">{selectedEmployee.payType === PayType.HOURLY ? `${(log.hoursWorked || 0).toLocaleString('fa-IR')} ساعت` : (log.workedDay ? '✓' : '✗')}</td>
                                                <td className="p-2">{`${log.overtimeHours.toLocaleString('fa-IR')} ساعت`}</td>
                                                <td className="p-2 flex items-center space-x-1 space-x-reverse"><button onClick={() => startEditWorkLog(log)} className="p-1 text-on-surface-secondary hover:text-primary"><EditIcon className="w-4 h-4"/></button><button onClick={() => onDeleteWorkLog(log.id)} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                        <div className="mt-6 flex justify-end"><Button type="button" variant="secondary" onClick={() => setIsWorkLogManagerOpen(false)}>بستن</Button></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Employees;