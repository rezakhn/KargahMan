import React, { useState, useEffect, useMemo } from 'react';
import type { Employee, WorkLog } from '../types';
import { PayType } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { AddIcon, EditIcon, TrashIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
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
    
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
        if (isWorkLogManagerOpen && selectedEmployee) {
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setCurrentMonth(new Date());
        }
    }, [isWorkLogManagerOpen, selectedEmployee]);

    useEffect(() => {
        if (selectedDate && selectedEmployee) {
            const existingLog = workLogs.find(log => log.employeeId === selectedEmployee.id && log.date === selectedDate);
            if (existingLog) {
                setEditingWorkLog(existingLog);
                setWorkLogForm({
                    date: existingLog.date,
                    overtimeHours: existingLog.overtimeHours,
                    hoursWorked: existingLog.hoursWorked ?? initialWorkLogState.hoursWorked,
                    workedDay: existingLog.workedDay ?? initialWorkLogState.workedDay,
                });
            } else {
                setEditingWorkLog(null);
                setWorkLogForm({ ...initialWorkLogState, date: selectedDate });
            }
        }
    }, [selectedDate, selectedEmployee, workLogs]);


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
        if (!selectedEmployee || !selectedDate) return;

        const logData: Omit<WorkLog, 'id' | 'employeeId'> = { date: selectedDate, overtimeHours: +workLogForm.overtimeHours };
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
    };
    
    const handleDeleteSelectedLog = () => {
        if (editingWorkLog) {
            onDeleteWorkLog(editingWorkLog.id);
        }
    }

    const openWorkLogManager = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsWorkLogManagerOpen(true);
    };
    
    const employeeLogsByDate = useMemo(() => {
        if (!selectedEmployee) return new Map();
        const logs = workLogs.filter(l => l.employeeId === selectedEmployee.id);
        return new Map(logs.map(l => [l.date, l]));
    }, [workLogs, selectedEmployee]);

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const monthName = new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(currentMonth);

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // Sunday: 0, Saturday: 6
        
        const offset = (startDayOfWeek + 1) % 7; // Adjust for Saturday start

        const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
        
        const days = Array.from({ length: offset }, (_, i) => <div key={`empty-${i}`}></div>);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isoDate = date.toISOString().split('T')[0];
            const hasLog = employeeLogsByDate.has(isoDate);
            const isSelected = isoDate === selectedDate;
            const isToday = isoDate === new Date().toISOString().split('T')[0];
            
            let classes = "p-2 rounded-lg cursor-pointer flex flex-col justify-center items-center h-16 transition-colors duration-200 ";
            if (isSelected) {
                classes += "bg-primary text-white";
            } else if (isToday) {
                classes += "bg-gray-600/50";
            } else {
                classes += "hover:bg-gray-700";
            }
            
            days.push(
                <div key={day} onClick={() => setSelectedDate(isoDate)} className={classes}>
                    <span className="font-bold">{day.toLocaleString('fa-IR')}</span>
                    {hasLog && <div className={`w-2 h-2 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-primary'}`}></div>}
                </div>
            );
        }

        return (
            <div className="flex-grow">
                <div className="flex justify-between items-center mb-4">
                    <Button variant="secondary" size="sm" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} icon={<ChevronRightIcon className="w-4 h-4" />}></Button>
                    <h3 className="text-lg font-bold">{monthName}</h3>
                    <Button variant="secondary" size="sm" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} icon={<ChevronLeftIcon className="w-4 h-4" />}></Button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-on-surface-secondary mb-2">
                    {weekDays.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {days}
                </div>
            </div>
        );
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
                 <Modal size="lg" title={`مدیریت کارکرد برای ${selectedEmployee.name}`} isOpen={isWorkLogManagerOpen} onClose={() => setIsWorkLogManagerOpen(false)}>
                    <div className="flex flex-col md:flex-row gap-8">
                        {renderCalendar()}
                        <div className="w-full md:w-80 flex-shrink-0">
                             <h3 className="text-lg font-bold mb-2">کارکرد روز: {formatDateShamsi(selectedDate)}</h3>
                             <form onSubmit={handleWorkLogSubmit} className="p-4 bg-gray-800 rounded-lg space-y-4">
                                {selectedEmployee.payType === PayType.HOURLY && (<div><label htmlFor="hoursWorked" className="block text-sm font-medium text-on-surface-secondary mb-1">ساعات کاری</label><input type="number" name="hoursWorked" id="hoursWorked" value={workLogForm.hoursWorked} onChange={e => setWorkLogForm({...workLogForm, hoursWorked: +e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" required min="0" /></div>)}
                                {selectedEmployee.payType === PayType.DAILY && (<div><label className="flex items-center"><input type="checkbox" checked={workLogForm.workedDay} onChange={e => setWorkLogForm({...workLogForm, workedDay: e.target.checked})} className="rounded bg-gray-800 border-gray-600 text-primary" /><span className="mr-2 text-on-surface">روز کاری کامل</span></label></div>)}
                                <div><label htmlFor="overtimeHours" className="block text-sm font-medium text-on-surface-secondary mb-1">ساعات اضافه‌کاری</label><input type="number" name="overtimeHours" id="overtimeHours" value={workLogForm.overtimeHours} onChange={e => setWorkLogForm({...workLogForm, overtimeHours: +e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" required min="0" /></div>
                                <div className="flex justify-between items-center pt-2">
                                    <Button type="submit">{editingWorkLog ? 'ذخیره تغییرات' : 'ثبت کارکرد'}</Button>
                                    {editingWorkLog && <button type="button" onClick={handleDeleteSelectedLog} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Employees;
