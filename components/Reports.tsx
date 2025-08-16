import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SalesOrder, Employee, WorkLog, SalaryReport } from '../types';
import { PayType } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';
import { DownloadIcon } from './icons/Icons';
import { VazirmatnFont } from './VazirFont';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface ReportsProps {
    orders: SalesOrder[];
    employees: Employee[];
    workLogs: WorkLog[];
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    dateRange: { start: string; end: string };
    onDateRangeChange: (range: { start: string; end: string }) => void;
}

const Reports: React.FC<ReportsProps> = ({ orders, employees, workLogs, totalRevenue, totalCosts, grossProfit, dateRange, onDateRangeChange }) => {
    // --- Monthly Revenue Chart Data ---
    const monthlyRevenue = orders
        .reduce((acc, order) => {
            const month = new Date(order.date).toLocaleString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit' });
            const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
            acc[month] = (acc[month] || 0) + totalPaid;
            return acc;
        }, {} as Record<string, number>);

    const chartData = Object.keys(monthlyRevenue).map(month => ({
        name: new Date(month + '-01').toLocaleString('fa-IR', { month: 'short', year: 'numeric'}),
        'درآمد': monthlyRevenue[month],
        monthKey: month,
    })).sort((a, b) => a.monthKey.localeCompare(b.monthKey));


    // --- Employee Salary Report Data ---
    const salaryReports: SalaryReport[] = employees.map(employee => {
        const employeeLogs = workLogs.filter(log => log.employeeId === employee.id);
        
        let totalHours = 0;
        let totalOvertime = 0;
        let totalDays = 0;

        employeeLogs.forEach(log => {
            totalHours += log.hoursWorked || 0;
            totalOvertime += log.overtimeHours || 0;
            if (log.workedDay) {
                totalDays++;
            }
        });
        
        let baseSalary = 0;
        if (employee.payType === PayType.HOURLY) {
            baseSalary = totalHours * employee.hourlyRate;
        } else {
            baseSalary = totalDays * employee.dailyRate;
        }
        
        const overtimeSalary = totalOvertime * employee.overtimeRate;
        const totalSalary = baseSalary + overtimeSalary;

        return {
            employeeId: employee.id,
            employeeName: employee.name,
            totalHours,
            totalOvertime,
            totalSalary,
        };
    }).filter(report => report.totalSalary > 0);

    const generatePdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.addFileToVFS("Vazirmatn-Regular.ttf", VazirmatnFont);
        doc.addFont("Vazirmatn-Regular.ttf", "Vazirmatn", "normal");
        doc.setFont("Vazirmatn");
        
        const dateFilterText = dateRange.start && dateRange.end 
            ? `از ${new Intl.DateTimeFormat('fa-IR').format(new Date(dateRange.start))} تا ${new Intl.DateTimeFormat('fa-IR').format(new Date(dateRange.end))}`
            : 'برای تمام دوران';

        doc.text("گزارش عملکرد کارکنان", 105, 15, { align: 'center' });
        doc.text(dateFilterText, 105, 22, { align: 'center' });
        
        const tableColumn = ["حقوق کل (تومان)", "اضافه‌کاری (ساعت)", "کارکرد", "نام کارمند"];
        const tableRows: any[][] = [];

        salaryReports.forEach(report => {
            const employee = employees.find(e => e.id === report.employeeId);
            const workDuration = employee?.payType === PayType.HOURLY
                ? `${report.totalHours.toLocaleString('fa-IR')} ساعت`
                : `${workLogs.filter(l => l.employeeId === report.employeeId && l.workedDay).length.toLocaleString('fa-IR')} روز`;
            
            const reportData = [
                report.totalSalary.toLocaleString('fa-IR'),
                report.totalOvertime.toLocaleString('fa-IR'),
                workDuration,
                report.employeeName,
            ];
            tableRows.push(reportData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            styles: { font: 'Vazirmatn', halign: 'center', cellPadding: 2 },
            headStyles: { fillColor: [20, 184, 166] },
            columnStyles: { 3: { halign: 'right' } }
        });
        
        doc.save(`salary-report_${new Date().toISOString().split('T')[0]}.pdf`);
    };


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-on-surface">گزارش‌ها</h1>

            <Card className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-on-surface">فیلتر زمانی</h2>
                <div className="flex flex-wrap gap-4 items-center">
                     <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ شروع</label>
                        <input type="date" id="startDate" value={dateRange.start} onChange={e => onDateRangeChange({...dateRange, start: e.target.value})} className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                     <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ پایان</label>
                        <input type="date" id="endDate" value={dateRange.end} onChange={e => onDateRangeChange({...dateRange, end: e.target.value})} className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div className="pt-6">
                        <Button variant="secondary" size="sm" onClick={() => onDateRangeChange({start: '', end: ''})}>پاک کردن فیلتر</Button>
                    </div>
                </div>
            </Card>
            
            <Card className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-on-surface">خلاصه مالی</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-lg text-on-surface-secondary">درآمد کل</p>
                        <p className="text-2xl font-bold text-green-400">{totalRevenue.toLocaleString('fa-IR')}</p>
                    </div>
                     <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-lg text-on-surface-secondary">مجموع هزینه‌ها</p>
                        <p className="text-2xl font-bold text-red-400">{totalCosts.toLocaleString('fa-IR')}</p>
                    </div>
                     <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-lg text-on-surface-secondary">سود ناخالص</p>
                        <p className="text-2xl font-bold text-teal-400">{grossProfit.toLocaleString('fa-IR')}</p>
                    </div>
                </div>
            </Card>

            <Card className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-on-surface">درآمد ماهانه</h2>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                            <XAxis dataKey="name" stroke="#9ca3af" angle={-30} textAnchor="end" height={70} />
                            <YAxis stroke="#9ca3af" orientation="right" tickFormatter={(value) => new Intl.NumberFormat('fa-IR').format(value as number)} />
                            <Tooltip contentStyle={{ backgroundColor: '#374151', borderColor: '#4b5563', direction: 'rtl' }} formatter={(value) => [new Intl.NumberFormat('fa-IR').format(value as number), 'درآمد']} />
                            <Legend wrapperStyle={{ direction: 'rtl' }} />
                            <Bar dataKey="درآمد" fill="#14b8a6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">گزارش عملکرد کارکنان</h2>
                    <Button size="sm" icon={<DownloadIcon />} onClick={generatePdf} disabled={salaryReports.length === 0}>دانلود PDF</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-gray-600"><th className="p-4">نام کارمند</th><th className="p-4">مجموع کارکرد</th><th className="p-4">مجموع اضافه‌کاری (ساعت)</th><th className="p-4">حقوق کل (تومان)</th></tr>
                        </thead>
                        <tbody>
                           {salaryReports.map(report => {
                               const employee = employees.find(e => e.id === report.employeeId);
                               return (
                                <tr key={report.employeeId} className="border-b border-gray-700 hover:bg-gray-600/50">
                                    <td className="p-4 font-medium">{report.employeeName}</td>
                                    <td className="p-4 font-mono">
                                        {employee?.payType === PayType.HOURLY
                                            ? `${report.totalHours.toLocaleString('fa-IR')} ساعت`
                                            : `${workLogs.filter(l => l.employeeId === report.employeeId && l.workedDay).length.toLocaleString('fa-IR')} روز`
                                        }
                                    </td>
                                    <td className="p-4 font-mono">{report.totalOvertime.toLocaleString('fa-IR')}</td>
                                    <td className="p-4 font-mono font-bold text-green-400">{report.totalSalary.toLocaleString('fa-IR')}</td>
                                </tr>
                               )
                            })}
                             {salaryReports.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-on-surface-secondary">
                                        هیچ کارکردی در بازه زمانی انتخاب شده برای نمایش وجود ندارد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Reports;