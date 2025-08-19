import React, { useState, useEffect, useMemo } from 'react';
import type { Employee, WorkLog, SalaryPayment } from '../types.ts';
import { PayType } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import Modal from './shared/Modal.tsx';
import { AddIcon, EditIcon, TrashIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CalculatorIcon } from './icons/Icons.tsx';
import EmptyState from './shared/EmptyState.tsx';
import { VazirmatnFont } from './VazirFont.ts';
import PersianDatePicker from './shared/PersianDatePicker.tsx';
import { getShamsiMonthStartEnd, getTodayGregorian } from './shared/dateConverter.ts';
import jalaali from 'jalaali-js';

declare global {
  interface Window {
    jspdf: any;
  }
}

const formatDateShamsi = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
    } catch (e) {
        return isoDate;
    }
};

interface SalaryModalProps {
    employee: Employee;
    workLogs: WorkLog[];
    salaryPayments: SalaryPayment[];
    onClose: () => void;
    onPaySalary: (paymentData: Omit<SalaryPayment, 'id'>) => void;
}

const SalaryCalculationModal: React.FC<SalaryModalProps> = ({ employee, workLogs, salaryPayments, onClose, onPaySalary }) => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentNotes, setPaymentNotes] = useState('');


    useEffect(() => {
        const today = new Date();
        const { start, end } = getShamsiMonthStartEnd(today);
        if(start && end) {
            setDateRange({ start, end });
        }
    }, []);

    const salaryData = useMemo(() => {
        const { start, end } = dateRange;
        if (!start || !end) return null;

        const startDate = new Date(start);
        const endDate = new Date(end);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const filteredLogs = workLogs.filter(log => {
            if (log.employeeId !== employee.id) return false;
            const itemDate = new Date(log.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        let totalHours = 0, totalOvertime = 0, totalDays = 0;
        filteredLogs.forEach(log => {
            totalHours += log.hoursWorked || 0;
            totalOvertime += log.overtimeHours || 0;
            if (log.workedDay) totalDays++;
        });

        const baseSalary = employee.payType === PayType.HOURLY
            ? totalHours * employee.hourlyRate
            : totalDays * employee.dailyRate;
        const overtimeSalary = totalOvertime * employee.overtimeRate;
        const totalSalary = baseSalary + overtimeSalary;
        
        return { filteredLogs, baseSalary, overtimeSalary, totalSalary, totalHours, totalDays };
    }, [employee, workLogs, dateRange]);

    const periodPaymentData = useMemo(() => {
        const { start, end } = dateRange;
        if (!start || !end) return { totalPaid: 0, payments: [] };

        const periodPayments = salaryPayments.filter(p =>
            p.employeeId === employee.id &&
            p.periodStart === start &&
            p.periodEnd === end
        ).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

        const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0);

        return { totalPaid, payments: periodPayments };
    }, [employee, salaryPayments, dateRange]);
    
    const remainingAmount = useMemo(() => {
        return salaryData ? salaryData.totalSalary - periodPaymentData.totalPaid : 0;
    }, [salaryData, periodPaymentData.totalPaid]);
    
    useEffect(() => {
        setPaymentAmount(remainingAmount > 0 ? remainingAmount : 0);
    }, [remainingAmount]);
    
    const employeePaymentHistory = useMemo(() => {
        return salaryPayments
            .filter(p => p.employeeId === employee.id)
            .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [salaryPayments, employee]);

    const handlePrintPayslip = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.addFileToVFS("Vazirmatn-Regular.ttf", VazirmatnFont);
        doc.addFont("Vazirmatn-Regular.ttf", "Vazirmatn", "normal");
        doc.setFont("Vazirmatn");

        const formatDate = (date: string) => new Intl.DateTimeFormat('fa-IR').format(new Date(date));
        
        doc.text("فیش حقوقی", 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`نام کارمند: ${employee.name}`, 190, 35, { align: 'right' });
        doc.text(`بازه زمانی: از ${formatDate(dateRange.start)} تا ${formatDate(dateRange.end)}`, 190, 42, { align: 'right' });
        
        doc.line(20, 50, 190, 50);

        doc.text(`حقوق پایه: ${salaryData!.baseSalary.toLocaleString('fa-IR')} تومان`, 190, 60, { align: 'right' });
        doc.text(`اضافه کاری: ${salaryData!.overtimeSalary.toLocaleString('fa-IR')} تومان`, 190, 67, { align: 'right' });
        doc.setFontSize(14);
        doc.text(`جمع کل حقوق دوره: ${salaryData!.totalSalary.toLocaleString('fa-IR')} تومان`, 190, 76, { align: 'right' });
        
        doc.line(20, 85, 190, 85);
        
        doc.setFontSize(12);
        doc.text("جزئیات کارکرد", 105, 95, { align: 'center' });

        const tableColumn = ["توضیحات", "اضافه‌کاری (ساعت)", "کارکرد", "تاریخ"];
        const tableRows: any[][] = [];

        salaryData!.filteredLogs.forEach(log => {
            const workValue = employee.payType === PayType.HOURLY
                ? `${log.hoursWorked || 0} ساعت`
                : (log.workedDay ? '1 روز' : '0');
            
            const logData = [
                log.description || '-',
                log.overtimeHours.toLocaleString('fa-IR'),
                workValue,
                formatDate(log.date)
            ];
            tableRows.push(logData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 100,
            theme: 'grid',
            styles: { font: 'Vazirmatn', halign: 'center', cellPadding: 2 },
            headStyles: { fillColor: [31, 41, 55] }, // gray-800
            columnStyles: { 0: { halign: 'right' }, 3: { halign: 'right' } }
        });
        
        doc.save(`payslip_${employee.name.replace(' ', '_')}_${dateRange.start}_${dateRange.end}.pdf`);
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!salaryData || paymentAmount <= 0 || paymentAmount > remainingAmount) {
            // TODO: show a toast for invalid amount
            return;
        }
        onPaySalary({
            employeeId: employee.id,
            paymentDate: getTodayGregorian(),
            amount: paymentAmount,
            periodStart: dateRange.start,
            periodEnd: dateRange.end,
            notes: paymentNotes,
        });
        setPaymentNotes('');
    }

    return (
        <Modal size="xl" title={`محاسبه حقوق برای ${employee.name}`} isOpen={true} onClose={onClose}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold mb-2 text-primary">بازه زمانی</h3>
                        <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-800 rounded-lg">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ شروع</label>
                                <PersianDatePicker value={dateRange.start} onChange={date => setDateRange({...dateRange, start: date})} inputId="startDate" />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ پایان</label>
                                <PersianDatePicker value={dateRange.end} onChange={date => setDateRange({...dateRange, end: date})} inputId="endDate" />
                            </div>
                        </div>
                    </div>

                    {salaryData && (
                        <>
                            <div>
                                <h3 className="text-lg font-bold mb-2 text-primary">خلاصه مالی</h3>
                                <Card className="space-y-2">
                                    <div className="flex justify-between"><span className="text-on-surface-secondary">حقوق محاسبه شده:</span> <span className="font-mono">{salaryData.totalSalary.toLocaleString('fa-IR')} تومان</span></div>
                                    <div className="flex justify-between"><span className="text-on-surface-secondary">پرداخت شده:</span> <span className="font-mono text-green-400">{periodPaymentData.totalPaid.toLocaleString('fa-IR')} تومان</span></div>
                                    <div className="flex justify-between font-bold border-t border-gray-600 pt-2 mt-2"><span className="text-on-surface">مانده قابل پرداخت:</span> <span className="font-mono text-yellow-400">{remainingAmount.toLocaleString('fa-IR')} تومان</span></div>
                                </Card>
                            </div>
                             {remainingAmount > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold mb-2 text-primary">ثبت پرداخت جدید</h3>
                                    <form onSubmit={handlePay} className="p-4 bg-gray-800 rounded-lg space-y-4">
                                        <div>
                                            <label htmlFor="paymentAmount" className="block text-sm font-medium text-on-surface-secondary mb-1">مبلغ پرداخت (تومان)</label>
                                            <input 
                                                type="number" 
                                                id="paymentAmount" 
                                                value={paymentAmount} 
                                                onChange={e => setPaymentAmount(Number(e.target.value))} 
                                                className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" 
                                                required 
                                                min="1"
                                                max={remainingAmount}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="paymentNotes" className="block text-sm font-medium text-on-surface-secondary mb-1">یادداشت (اختیاری)</label>
                                            <input 
                                                type="text" 
                                                id="paymentNotes" 
                                                value={paymentNotes} 
                                                onChange={e => setPaymentNotes(e.target.value)} 
                                                className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2"
                                                placeholder="مثلا: مساعده، قسط اول حقوق"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button type="submit">ثبت پرداخت</Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-bold mb-2 text-primary">جزئیات دوره</h3>
                                <div className="mt-4">
                                    <h4 className="font-semibold mb-2">پرداخت‌های این دوره</h4>
                                    <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg">
                                        <table className="w-full text-right text-sm">
                                            <thead className="sticky top-0 bg-surface">
                                                <tr className="border-b border-gray-600"><th className="p-2">تاریخ</th><th className="p-2">مبلغ</th><th className="p-2">یادداشت</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {periodPaymentData.payments.length > 0 ? periodPaymentData.payments.map(p => (
                                                    <tr key={p.id} className="hover:bg-gray-800">
                                                        <td className="p-2">{formatDateShamsi(p.paymentDate)}</td>
                                                        <td className="p-2 font-mono">{p.amount.toLocaleString('fa-IR')}</td>
                                                        <td className="p-2 text-xs text-on-surface-secondary">{p.notes || '-'}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={3} className="text-center p-4 text-on-surface-secondary">پرداختی برای این دوره ثبت نشده.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-semibold mb-2">کارکرد این دوره</h4>
                                    <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg">
                                        <table className="w-full text-right">
                                            <thead className="sticky top-0 bg-surface">
                                                <tr className="border-b border-gray-600"><th className="p-3">تاریخ</th><th className="p-3">کارکرد</th><th className="p-3">اضافه‌کاری (ساعت)</th><th className="p-3">توضیحات</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {salaryData.filteredLogs.length > 0 ? salaryData.filteredLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-gray-800">
                                                        <td className="p-3">{formatDateShamsi(log.date)}</td>
                                                        <td className="p-3 font-mono">{employee.payType === PayType.HOURLY ? `${log.hoursWorked || 0} ساعت` : (log.workedDay ? '✓ روز کاری' : '✗')}</td>
                                                        <td className="p-3 font-mono">{log.overtimeHours.toLocaleString('fa-IR')}</td>
                                                        <td className="p-3 text-sm text-on-surface-secondary">{log.description || '-'}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={4} className="text-center p-8 text-on-surface-secondary">هیچ کارکردی در این بازه زمانی ثبت نشده است.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-4">
                     <h3 className="text-lg font-bold text-primary">کل سابقه پرداخت‌ها</h3>
                     <div className="max-h-[500px] overflow-y-auto border border-gray-700 rounded-lg p-2 space-y-2">
                        {employeePaymentHistory.length > 0 ? employeePaymentHistory.map(p => (
                            <div key={p.id} className="p-3 bg-gray-800 rounded-md text-sm">
                                <p className="font-bold">{p.amount.toLocaleString('fa-IR')} تومان</p>
                                <p className="text-xs text-on-surface-secondary">بابت دوره: {formatDateShamsi(p.periodStart)} تا {formatDateShamsi(p.periodEnd)}</p>
                                <p className="text-xs text-on-surface-secondary">تاریخ پرداخت: {formatDateShamsi(p.paymentDate)}</p>
                                {p.notes && <p className="text-xs text-on-surface-secondary mt-1">یادداشت: {p.notes}</p>}
                            </div>
                        )) : (
                            <p className="text-center p-8 text-on-surface-secondary text-sm">سابقه پرداختی وجود ندارد.</p>
                        )}
                     </div>
                </div>
            </div>
             <div className="mt-6 flex justify-end items-center space-x-3 space-x-reverse">
                <Button variant="secondary" onClick={onClose}>بستن</Button>
                <Button onClick={handlePrintPayslip} disabled={!salaryData || salaryData.filteredLogs.length === 0}>چاپ فیش</Button>
            </div>
        </Modal>
    );
};


interface EmployeesProps {
    employees: Employee[];
    workLogs: WorkLog[];
    salaryPayments: SalaryPayment[];
    onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
    onEditEmployee: (employee: Employee) => void;
    onDeleteEmployee: (employeeId: number) => void;
    onAddWorkLog: (workLog: Omit<WorkLog, 'id'>) => void;
    onEditWorkLog: (workLog: WorkLog) => void;
    onDeleteWorkLog: (workLogId: number) => void;
    onPaySalary: (paymentData: Omit<SalaryPayment, 'id'>) => void;
    employeeIdToManage: number | null;
    onClearManageEmployee: () => void;
}

const Employees: React.FC<EmployeesProps> = (props) => {
    const { employees, workLogs, salaryPayments, onAddEmployee, onEditEmployee, onDeleteEmployee, onAddWorkLog, onEditWorkLog, onDeleteWorkLog, onPaySalary, employeeIdToManage, onClearManageEmployee } = props;
    
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isWorkLogManagerOpen, setIsWorkLogManagerOpen] = useState(false);
    const [salaryModalEmployee, setSalaryModalEmployee] = useState<Employee | null>(null);
    
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
    
    const [currentShamsiMonth, setCurrentShamsiMonth] = useState(() => {
        const today = new Date();
        const { jy, jm } = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
        return { year: jy, month: jm };
    });
    const [selectedDate, setSelectedDate] = useState(getTodayGregorian());

    const initialNewEmployeeState: Omit<Employee, 'id'> = { name: '', payType: PayType.HOURLY, dailyRate: 0, hourlyRate: 0, overtimeRate: 0 };
    const [employeeForm, setEmployeeForm] = useState(initialNewEmployeeState);
    
    const initialWorkLogState = { date: getTodayGregorian(), overtimeHours: 0, hoursWorked: 8, workedDay: true, description: '' };
    const [workLogForm, setWorkLogForm] = useState(initialWorkLogState);
    
    const openWorkLogManager = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsWorkLogManagerOpen(true);
    };

    useEffect(() => {
        if (employeeIdToManage) {
            const employee = employees.find(e => e.id === employeeIdToManage);
            if (employee) {
                openWorkLogManager(employee);
            }
            onClearManageEmployee();
        }
    }, [employeeIdToManage, employees, onClearManageEmployee]);

    useEffect(() => {
        if (editingEmployee) {
            setEmployeeForm(editingEmployee);
        } else {
            setEmployeeForm(initialNewEmployeeState);
        }
    }, [editingEmployee]);
    
    useEffect(() => {
        if (isWorkLogManagerOpen && selectedEmployee) {
            setSelectedDate(getTodayGregorian());
            const today = new Date();
            const { jy, jm } = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
            setCurrentShamsiMonth({ year: jy, month: jm });
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
                    description: existingLog.description || '',
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

        const baseLogData = {
            date: selectedDate,
            overtimeHours: +workLogForm.overtimeHours || 0,
            description: workLogForm.description?.trim() || '',
        };

        const fullLogData = selectedEmployee.payType === PayType.HOURLY
            ? { ...baseLogData, hoursWorked: +workLogForm.hoursWorked || 0 }
            : { ...baseLogData, workedDay: workLogForm.workedDay };
        
        if (editingWorkLog) {
            onEditWorkLog({ ...fullLogData, id: editingWorkLog.id, employeeId: selectedEmployee.id });
        } else {
            onAddWorkLog({ ...fullLogData, employeeId: selectedEmployee.id });
        }
    };
    
    const handleDeleteSelectedLog = () => {
        if (editingWorkLog) {
            onDeleteWorkLog(editingWorkLog.id);
        }
    }

    const employeeLogsByDate = useMemo(() => {
        if (!selectedEmployee) return new Map();
        const logs = workLogs.filter(l => l.employeeId === selectedEmployee.id);
        return new Map(logs.map(l => [l.date, l]));
    }, [workLogs, selectedEmployee]);
    
    const changeMonth = (amount: number) => {
        setCurrentShamsiMonth(prev => {
            let newMonth = prev.month + amount;
            let newYear = prev.year;
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }
            if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
            return { year: newYear, month: newMonth };
        });
    };

    const renderCalendar = () => {
        const { year, month } = currentShamsiMonth;
        
        const gDateForMonth = jalaali.toGregorian(year, month, 15);
        const monthName = new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(new Date(gDateForMonth.gy, gDateForMonth.gm - 1, gDateForMonth.gd));

        const daysInMonth = jalaali.jalaaliMonthLength(year, month);
        const firstDayGregorian = jalaali.toGregorian(year, month, 1);
        const firstDayOfMonth = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
        const startDayOfWeek = firstDayOfMonth.getDay(); // Sunday: 0, Saturday: 6
        
        const offset = (startDayOfWeek + 1) % 7; // Adjust for Saturday start

        const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
        
        const days = Array.from({ length: offset }, (_, i) => <div key={`empty-${i}`}></div>);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const gDate = jalaali.toGregorian(year, month, day);
            const isoDate = `${gDate.gy}-${String(gDate.gm).padStart(2, '0')}-${String(gDate.gd).padStart(2, '0')}`;
            const logForDay = employeeLogsByDate.get(isoDate);
            const hasLog = !!logForDay;
            const isSelected = isoDate === selectedDate;
            const isToday = isoDate === getTodayGregorian();
            
            let isAbsent = false;
            if (logForDay && selectedEmployee) {
                if (selectedEmployee.payType === PayType.DAILY && logForDay.workedDay === false) {
                    isAbsent = true;
                } else if (selectedEmployee.payType === PayType.HOURLY && (logForDay.hoursWorked === 0)) {
                    isAbsent = true;
                }
            }

            let classes = "p-2 rounded-lg cursor-pointer flex flex-col justify-center items-center h-16 transition-colors duration-200 ";
            
            if (isSelected) {
                classes += "bg-primary text-white";
            } else {
                if (isAbsent) {
                    classes += "bg-yellow-600/30 hover:bg-yellow-600/50";
                } else if (hasLog) {
                    classes += "bg-primary/20 hover:bg-primary/40";
                } else if (isToday) {
                    classes += "bg-gray-600/50 hover:bg-gray-600";
                } else {
                    classes += "hover:bg-gray-700";
                }
            }
            
            days.push(
                <div key={day} onClick={() => setSelectedDate(isoDate)} className={classes}>
                    <span className="font-bold">{day.toLocaleString('fa-IR')}</span>
                </div>
            );
        }

        return (
            <div className="flex-grow">
                <div className="flex justify-between items-center mb-4">
                    <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)} icon={<ChevronRightIcon className="w-4 h-4" />}></Button>
                    <h3 className="text-lg font-bold">{monthName}</h3>
                    <Button variant="secondary" size="sm" onClick={() => changeMonth(1)} icon={<ChevronLeftIcon className="w-4 h-4" />}></Button>
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
                                <tr className="border-b border-gray-600"><th className="px-4 py-3">نام</th><th className="px-4 py-3">نوع پرداخت</th><th className="px-4 py-3">نرخ</th><th className="px-4 py-3">نرخ اضافه‌کاری</th><th className="px-4 py-3">اقدامات</th></tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} className="border-b border-gray-700 hover:bg-gray-600/50">
                                        <td className="px-4 py-2 font-medium">{emp.name}</td>
                                        <td className="px-4 py-2 capitalize">{emp.payType}</td>
                                        <td className="px-4 py-2">{emp.payType === PayType.DAILY ? `${emp.dailyRate.toLocaleString('fa-IR')} / روز` : `${emp.hourlyRate.toLocaleString('fa-IR')} / ساعت`}</td>
                                        <td className="px-4 py-2">{emp.overtimeRate.toLocaleString('fa-IR')} / ساعت</td>
                                        <td className="px-4 py-2 flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                                            <button onClick={() => openEditModal(emp)} className="p-1 text-on-surface-secondary hover:text-primary" title="ویرایش"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeleteEmployee(emp.id)} className="p-1 text-on-surface-secondary hover:text-red-500" title="حذف"><TrashIcon className="w-5 h-5"/></button>
                                            <Button size="sm" variant="secondary" icon={<CalculatorIcon />} onClick={() => setSalaryModalEmployee(emp)}>محاسبه حقوق</Button>
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
                                {selectedEmployee.payType === PayType.HOURLY && (<div><label htmlFor="hoursWorked" className="block text-sm font-medium text-on-surface-secondary mb-1">ساعات کاری</label><input type="number" name="hoursWorked" id="hoursWorked" value={workLogForm.hoursWorked} onChange={e => setWorkLogForm({...workLogForm, hoursWorked: +e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" min="0" /></div>)}
                                {selectedEmployee.payType === PayType.DAILY && (<div><label className="flex items-center"><input type="checkbox" checked={workLogForm.workedDay} onChange={e => setWorkLogForm({...workLogForm, workedDay: e.target.checked})} className="rounded bg-gray-800 border-gray-600 text-primary" /><span className="mr-2 text-on-surface">روز کاری کامل</span></label></div>)}
                                <div><label htmlFor="overtimeHours" className="block text-sm font-medium text-on-surface-secondary mb-1">ساعات اضافه‌کاری</label><input type="number" name="overtimeHours" id="overtimeHours" value={workLogForm.overtimeHours} onChange={e => setWorkLogForm({...workLogForm, overtimeHours: +e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2" min="0" /></div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-secondary mb-1">توضیحات (اختیاری)</label>
                                    <textarea 
                                        name="description" 
                                        id="description" 
                                        rows={3}
                                        value={workLogForm.description} 
                                        onChange={e => setWorkLogForm({...workLogForm, description: e.target.value})} 
                                        className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2"
                                        placeholder="مثال: مرخصی استعلاجی"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Button type="submit">{editingWorkLog ? 'ذخیره تغییرات' : 'ثبت کارکرد'}</Button>
                                    {editingWorkLog && <button type="button" onClick={handleDeleteSelectedLog} className="p-1 text-on-surface-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </Modal>
            )}

            {salaryModalEmployee && (
                <SalaryCalculationModal 
                    employee={salaryModalEmployee} 
                    workLogs={workLogs}
                    salaryPayments={salaryPayments} 
                    onPaySalary={onPaySalary}
                    onClose={() => setSalaryModalEmployee(null)} 
                />
            )}
        </div>
    );
}

export default Employees;