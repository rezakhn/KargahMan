import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Employee, ProductProfitabilityReport, SalaryReport, WorkLog, SalesOrder } from '../types.ts';
import { OrderStatus, PayType } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import { DownloadIcon } from './icons/Icons.tsx';
import { VazirmatnFont } from './VazirFont.ts';

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
        totalExpenses: number;
        netProfit: number;
        salaryReports: SalaryReport[];
        productProfitabilityReport: ProductProfitabilityReport[];
        workLogs: WorkLog[];
        allOrders: SalesOrder[];
    };
    employees: Employee[];
    dateRange: { start: string; end: string };
    onDateRangeChange: (range: { start: string; end: string }) => void;
}

const Reports: React.FC<ReportsProps> = ({ data, employees, dateRange, onDateRangeChange }) => {

    const monthlySalesData = useMemo(() => {
        const salesByMonth: { [key: string]: number } = {};
        
        data.allOrders
            .filter(o => o.status === OrderStatus.DELIVERED)
            .forEach(order => {
                const orderDate = new Date(order.date);
                const year = orderDate.getFullYear();
                const month = orderDate.getMonth();
                const monthKey = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(orderDate);

                if (!salesByMonth[monthKey]) {
                    salesByMonth[monthKey] = 0;
                }
                salesByMonth[monthKey] += order.totalAmount;
            });
        
        const sortedKeys = Object.keys(salesByMonth).sort((a,b) => {
            // A bit of a hack to sort Shamsi months correctly.
            const monthOrder = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
            const [monthA, yearA] = a.split(" ");
            const [monthB, yearB] = b.split(" ");
            if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
            return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
        });

        return sortedKeys.map(key => ({
            name: key.replace(" ", "\n"), // Add newline for better label display
            "فروش": salesByMonth[key],
        }));

    }, [data.allOrders]);

    const exportToCsv = (filename: string, rows: (string|number)[][]) => {
        const processRow = (row: (string|number)[]) => {
            const processedRow = row.map(val => {
                const str = (val === null || val === undefined) ? '' : String(val);
                if (str.search(/("|,|\n)/g) >= 0) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            return processedRow.join(',') + '\n';
        };

        let csvFile = '\uFEFF'; // BOM for UTF-8
        rows.forEach(row => {
            csvFile += processRow(row);
        });

        const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
     const handleExportSummaryCsv = () => {
        const rows: (string|number)[][] = [
            ["عنوان", "مبلغ (تومان)"],
            ["درآمد (فروش تحویل شده)", data.totalRevenue],
            ["هزینه کالاهای فروخته شده (COGS)", data.totalCOGS],
            ["هزینه حقوق و دستمزد", data.totalSalaries],
            ["سایر هزینه‌ها", data.totalExpenses],
            ["سود خالص", data.netProfit],
            ["جمع خریدها در بازه", data.totalPurchaseCosts]
        ];
        exportToCsv(`financial-summary_${dateRange.start}_${dateRange.end}.csv`, rows);
    };

    const handleExportSalariesCsv = () => {
        const rows: (string|number)[][] = [
            ["نام کارمند", "مجموع کارکرد", "واحد", "مجموع اضافه‌کاری (ساعت)", "حقوق کل (تومان)"]
        ];
        data.salaryReports.forEach(report => {
            const employee = employees.find(e => e.id === report.employeeId);
            const workDuration = employee?.payType === PayType.HOURLY
                ? report.totalHours
                : data.workLogs.filter(l => l.employeeId === report.employeeId && l.workedDay).length;
            const workUnit = employee?.payType === PayType.HOURLY ? 'ساعت' : 'روز';
            
            rows.push([
                report.employeeName,
                workDuration,
                workUnit,
                report.totalOvertime,
                report.totalSalary,
            ]);
        });
        exportToCsv(`salary-report_${dateRange.start}_${dateRange.end}.csv`, rows);
    };
    
    const handleExportProfitabilityCsv = () => {
        const rows: (string|number)[][] = [
            ["محصول", "تعداد فروش", "درآمد کل", "هزینه کل (COGS)", "سود کل"]
        ];
        data.productProfitabilityReport.forEach(report => {
            rows.push([
                report.productName,
                report.quantitySold,
                report.totalRevenue,
                report.totalCOGS,
                report.totalProfit,
            ]);
        });
        exportToCsv(`profitability-report_${dateRange.start}_${dateRange.end}.csv`, rows);
    };
    
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
        
        doc.save(`salary-report_${dateRange.start}_${dateRange.end}.pdf`);
    };


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-on-surface">گزارش‌ها</h1>

            <Card className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-on-surface">فیلتر زمانی</h2>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center">
                     <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ شروع</label>
                        <input type="date" id="startDate" value={dateRange.start} onChange={e => onDateRangeChange({...dateRange, start: e.target.value})} className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                     <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-on-surface-secondary mb-1">تاریخ پایان</label>
                        <input type="date" id="endDate" value={dateRange.end} onChange={e => onDateRangeChange({...dateRange, end: e.target.value})} className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div className="pt-0 sm:pt-6">
                        <Button variant="secondary" size="sm" onClick={() => onDateRangeChange({start: '', end: ''})}>پاک کردن فیلتر</Button>
                    </div>
                </div>
            </Card>
            
            <Card className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">خلاصه مالی</h2>
                    <Button size="sm" icon={<DownloadIcon />} onClick={handleExportSummaryCsv}>دانلود CSV</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                    <div className="p-4 bg-gray-800 rounded-lg"><p className="text-lg text-on-surface-secondary">درآمد (تحویل شده)</p><p className="text-2xl font-bold text-green-400">{data.totalRevenue.toLocaleString('fa-IR')}</p></div>
                     <div className="p-4 bg-gray-800 rounded-lg"><p className="text-lg text-on-surface-secondary">هزینه کالا (COGS)</p><p className="text-2xl font-bold text-orange-400">{data.totalCOGS.toLocaleString('fa-IR')}</p></div>
                     <div className="p-4 bg-gray-800 rounded-lg"><p className="text-lg text-on-surface-secondary">هزینه حقوق</p><p className="text-2xl font-bold text-blue-400">{data.totalSalaries.toLocaleString('fa-IR')}</p></div>
                     <div className="p-4 bg-gray-800 rounded-lg"><p className="text-lg text-on-surface-secondary">سایر هزینه‌ها</p><p className="text-2xl font-bold text-red-400">{data.totalExpenses.toLocaleString('fa-IR')}</p></div>
                     <div className="p-4 bg-gray-800 rounded-lg"><p className="text-lg text-on-surface-secondary">سود خالص</p><p className="text-2xl font-bold text-teal-400">{data.netProfit.toLocaleString('fa-IR')}</p></div>
                </div>
            </Card>

             <Card className="mb-8">
                <h2 className="text-xl font-bold text-on-surface mb-4">روند فروش ماهانه (سفارشات تحویل شده)</h2>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlySalesData} margin={{ top: 5, right: 20, left: 10, bottom: 5, }} >
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                            <YAxis tickFormatter={(value) => new Intl.NumberFormat('fa-IR').format(value as number)} tick={{ fill: '#9ca3af' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#374151', direction: 'rtl', border: 'none' }}
                                labelStyle={{ color: '#f3f4f6' }}
                                formatter={(value) => [`${Number(value).toLocaleString('fa-IR')} تومان`, "فروش"]}
                            />
                            <Legend wrapperStyle={{ direction: 'rtl' }}/>
                            <Bar dataKey="فروش" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="mb-8">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">سودآوری محصولات (تحویل شده)</h2>
                    <Button size="sm" icon={<DownloadIcon />} onClick={handleExportProfitabilityCsv} disabled={data.productProfitabilityReport.length === 0}>دانلود CSV</Button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-gray-600"><th className="px-4 py-3">محصول</th><th className="px-4 py-3">تعداد فروش</th><th className="px-4 py-3">درآمد کل</th><th className="px-4 py-3">هزینه کل (COGS)</th><th className="px-4 py-3">سود کل</th></tr>
                        </thead>
                        <tbody>
                            {data.productProfitabilityReport.map(report => (
                                <tr key={report.productId} className="border-b border-gray-700 hover:bg-gray-600/50">
                                    <td className="px-4 py-2 font-medium">{report.productName}</td>
                                    <td className="px-4 py-2 font-mono">{report.quantitySold.toLocaleString('fa-IR')}</td>
                                    <td className="px-4 py-2 font-mono">{report.totalRevenue.toLocaleString('fa-IR')}</td>
                                    <td className="px-4 py-2 font-mono text-orange-400">{report.totalCOGS.toLocaleString('fa-IR')}</td>
                                    <td className="px-4 py-2 font-mono font-bold text-teal-400">{report.totalProfit.toLocaleString('fa-IR')}</td>
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
                    <div className="flex gap-2">
                        <Button size="sm" icon={<DownloadIcon />} onClick={generatePdf} disabled={data.salaryReports.length === 0}>دانلود PDF</Button>
                        <Button size="sm" icon={<DownloadIcon />} onClick={handleExportSalariesCsv} disabled={data.salaryReports.length === 0}>دانلود CSV</Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-gray-600"><th className="px-4 py-3">نام کارمند</th><th className="px-4 py-3">مجموع کارکرد</th><th className="px-4 py-3">مجموع اضافه‌کاری (ساعت)</th><th className="px-4 py-3">حقوق کل (تومان)</th></tr>
                        </thead>
                        <tbody>
                           {data.salaryReports.map(report => {
                               const employee = employees.find(e => e.id === report.employeeId);
                               return (
                                <tr key={report.employeeId} className="border-b border-gray-700 hover:bg-gray-600/50">
                                    <td className="px-4 py-2 font-medium">{report.employeeName}</td>
                                    <td className="px-4 py-2 font-mono">
                                        {employee?.payType === PayType.HOURLY
                                            ? `${report.totalHours.toLocaleString('fa-IR')} ساعت`
                                            : `${data.workLogs.filter(l => l.employeeId === report.employeeId && l.workedDay).length.toLocaleString('fa-IR')} روز`
                                        }
                                    </td>
                                    <td className="px-4 py-2 font-mono">{report.totalOvertime.toLocaleString('fa-IR')}</td>
                                    <td className="px-4 py-2 font-mono font-bold text-green-400">{report.totalSalary.toLocaleString('fa-IR')}</td>
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