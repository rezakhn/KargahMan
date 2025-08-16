import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Employee, ProductProfitabilityReport, SalaryReport, WorkLog } from '../types';
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
    data: {
        totalRevenue: number;
        totalCOGS: number;
        totalPurchaseCosts: number;
        totalSalaries: number;
        netProfit: number;
        salaryReports: SalaryReport[];
        productProfitabilityReport: ProductProfitabilityReport[];
        workLogs: WorkLog[];
    };
    employees: Employee[];
    dateRange: { start: string; end: string };
    onDateRangeChange: (range: { start: string; end: string }) => void;
}

const Reports: React.FC<ReportsProps> = ({ data, employees, dateRange, onDateRangeChange }) => {
    // --- Monthly Revenue Chart Data ---
    // Note: The data for this chart would need to be passed down if date filtering is required.
    // This example keeps it simple and shows all-time data.
    const monthlyRevenue: Record<string, number> = {}; // This would need data.orders to be passed in to be accurate
    const chartData = Object.keys(monthlyRevenue).map(month => ({
        name: new Date(month + '-01').toLocaleString('fa-IR', { month: 'short', year: 'numeric'}),
        'درآمد': monthlyRevenue[month],
        monthKey: month,
    })).sort((a, b) => a.monthKey.localeCompare(b.monthKey));


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

        data.salaryReports.forEach(report => {
            const employee = employees.find(e => e.id === report.employeeId);
            const workDuration = employee?.payType === PayType.HOURLY
                ? `${report.totalHours.toLocaleString('fa-IR')} ساعت`
                : `${data.workLogs.filter(l => l.employeeId === report.employeeId && l.workedDay).length.toLocaleString('fa-IR')} روز`;
            
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-lg text-on-surface-secondary">درآمد (تحویل شده)</p>
                        <p className="text-2xl font-bold text-green-400">{data.totalRevenue.toLocaleString('fa-IR')}</p>
                    </div>
                     <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-lg text-on-surface-secondary">هزینه کالا (COGS)</p>
                        <p className="text-2xl font-bold text-orange-400">{data.totalCOGS.toLocaleString('fa-IR')}</p>
                    </div>
                     <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-lg text-on-surface-secondary">هزینه حقوق</p>
                        <p className="text-2xl font-bold text-blue-400">{data.totalSalaries.toLocaleString('fa-IR')}</p>
                    </div>
                     <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-lg text-on-surface-secondary">سود خالص</p>
                        <p className="text-2xl font-bold text-teal-400">{data.netProfit.toLocaleString('fa-IR')}</p>
                    </div>
                </div>
            </Card>

            <Card className="mb-8">
                 <h2 className="text-xl font-bold mb-4 text-on-surface">سودآوری محصولات (تحویل شده)</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-gray-600"><th className="p-4">محصول</th><th className="p-4">تعداد فروش</th><th className="p-4">درآمد کل</th><th className="p-4">هزینه کل (COGS)</th><th className="p-4">سود کل</th></tr>
                        </thead>
                        <tbody>
                            {data.productProfitabilityReport.map(report => (
                                <tr key={report.productId} className="border-b border-gray-700 hover:bg-gray-600/50">
                                    <td className="p-4 font-medium">{report.productName}</td>
                                    <td className="p-4 font-mono">{report.quantitySold.toLocaleString('fa-IR')}</td>
                                    <td className="p-4 font-mono">{report.totalRevenue.toLocaleString('fa-IR')}</td>
                                    <td className="p-4 font-mono text-orange-400">{report.totalCOGS.toLocaleString('fa-IR')}</td>
                                    <td className="p-4 font-mono font-bold text-teal-400">{report.totalProfit.toLocaleString('fa-IR')}</td>
                                </tr>
                            ))}
                             {data.productProfitabilityReport.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-on-surface-secondary">
                                        هیچ محصولی در بازه زمانی انتخاب شده تحویل داده نشده است.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">گزارش عملکرد کارکنان</h2>
                    <Button size="sm" icon={<DownloadIcon />} onClick={generatePdf} disabled={data.salaryReports.length === 0}>دانلود PDF</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-gray-600"><th className="p-4">نام کارمند</th><th className="p-4">مجموع کارکرد</th><th className="p-4">مجموع اضافه‌کاری (ساعت)</th><th className="p-4">حقوق کل (تومان)</th></tr>
                        </thead>
                        <tbody>
                           {data.salaryReports.map(report => {
                               const employee = employees.find(e => e.id === report.employeeId);
                               return (
                                <tr key={report.employeeId} className="border-b border-gray-700 hover:bg-gray-600/50">
                                    <td className="p-4 font-medium">{report.employeeName}</td>
                                    <td className="p-4 font-mono">
                                        {employee?.payType === PayType.HOURLY
                                            ? `${report.totalHours.toLocaleString('fa-IR')} ساعت`
                                            : `${data.workLogs.filter(l => l.employeeId === report.employeeId && l.workedDay).length.toLocaleString('fa-IR')} روز`
                                        }
                                    </td>
                                    <td className="p-4 font-mono">{report.totalOvertime.toLocaleString('fa-IR')}</td>
                                    <td className="p-4 font-mono font-bold text-green-400">{report.totalSalary.toLocaleString('fa-IR')}</td>
                                </tr>
                               )
                            })}
                             {data.salaryReports.length === 0 && (
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