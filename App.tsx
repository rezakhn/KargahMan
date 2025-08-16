import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ViewType, Employee, PurchaseInvoice, Part, SalesOrder, Customer, Supplier, AssemblyOrder, PurchaseItem, OrderItem, WorkLog, Payment, Toast, ProductProfitabilityReport, SalaryReport } from './types';
import { PayType, OrderStatus, AssemblyStatus } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Purchases from './components/Purchases';
import Inventory from './components/Inventory';
import Orders from './components/Orders';
import Reports from './components/Reports';
import Assembly from './components/Assembly';
import Settings from './components/Settings';
import SuppliersCustomers from './components/SuppliersCustomers';
import ToastContainer from './components/shared/Toast';
import ConfirmationModal from './components/shared/ConfirmationModal';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [reportDateRange, setReportDateRange] = useState<{start: string, end: string}>({
      start: '',
      end: '',
  });

  // --- MOCK DATA ---
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: 'علی رضایی', payType: PayType.HOURLY, hourlyRate: 150000, dailyRate: 0, overtimeRate: 200000 },
    { id: 2, name: 'زهرا احمدی', payType: PayType.DAILY, hourlyRate: 0, dailyRate: 1200000, overtimeRate: 250000 },
  ]);

  const [workLogs, setWorkLogs] = useState<WorkLog[]>([
      {id: 1, employeeId: 1, date: '2023-10-01', hoursWorked: 8, overtimeHours: 2},
      {id: 2, employeeId: 2, date: '2023-10-01', workedDay: true, overtimeHours: 1},
      {id: 3, employeeId: 1, date: '2023-10-02', hoursWorked: 9, overtimeHours: 1},
      {id: 4, employeeId: 1, date: '2024-05-10', hoursWorked: 8, overtimeHours: 0},
      {id: 5, employeeId: 2, date: '2024-05-10', workedDay: true, overtimeHours: 2},
  ]);

  const [parts, setParts] = useState<Part[]>([
    { id: 1, name: 'میلگرد فولادی خام', isAssembly: false, stock: 100, threshold: 20, cost: 95000 },
    { id: 2, name: 'پیچ M8', isAssembly: false, stock: 500, threshold: 100, cost: 5000 },
    { id: 3, name: 'قطعه مونتاژی براکت', isAssembly: true, stock: 20, threshold: 5, components: [{ partId: 1, quantity: 2 }, { partId: 2, quantity: 8 }] },
    { id: 4, name: 'محصول نهایی X', isAssembly: true, stock: 10, threshold: 2, components: [{ partId: 3, quantity: 1 }] },
  ]);

  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([
    { id: 1, supplierId: 1, date: '2023-10-01', items: [{id: 1, itemName: 'میلگرد فولادی خام', quantity: 50, unitPrice: 100000}], totalAmount: 5000000 },
  ]);

  const [orders, setOrders] = useState<SalesOrder[]>([
    { id: 1, customerId: 1, date: '2024-05-15', items: [{productId: 4, quantity: 2, price: 5000000}], totalAmount: 10000000, payments: [{id: 1, amount: 10000000, date: '2024-05-15'}], status: OrderStatus.DELIVERED, deliveryDate: '2024-05-20', costOfGoodsSold: 460000 },
    { id: 2, customerId: 2, date: '2024-05-20', items: [{productId: 3, quantity: 10, price: 500000}], totalAmount: 5000000, payments: [{id:1, amount: 5000000, date: '2024-05-20'}], status: OrderStatus.PAID, deliveryDate: '2024-05-25' },
    { id: 3, customerId: 1, date: '2023-08-10', items: [{productId: 3, quantity: 5, price: 500000}], totalAmount: 2500000, payments: [], status: OrderStatus.PENDING, deliveryDate: '2023-08-20' },
  ]);

  const [assemblyOrders, setAssemblyOrders] = useState<AssemblyOrder[]>([
    { id: 1, partId: 3, quantity: 10, date: '2023-10-10', status: AssemblyStatus.COMPLETED },
    { id: 2, partId: 4, quantity: 5, date: '2023-10-20', status: AssemblyStatus.PENDING },
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
      { id: 1, name: 'شرکت جهانی', contactInfo: 'contact@globalcorp.com' },
      { id: 2, name: 'کسب‌وکار محلی', contactInfo: 'sales@localbiz.com' },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
      { id: 1, name: 'فولاد گستر', contactInfo: 'info@metalsupply.com' },
      { id: 2, name: 'کارخانه قطعات', contactInfo: 'orders@componentfactory.com' },
  ]);

  const partsMap = useMemo(() => new Map(parts.map(p => [p.id, p])), [parts]);

  const calculatePartCost = useCallback((partId: number, visited = new Set<number>()): number => {
    if (visited.has(partId)) return 0; // Circular dependency check
    
    const part = partsMap.get(partId);
    if (!part) return 0;

    if (!part.isAssembly) {
      return part.cost || 0;
    }

    visited.add(partId);
    const componentsCost = (part.components || []).reduce((sum, component) => {
      const componentCost = calculatePartCost(component.partId, new Set(visited));
      return sum + (componentCost * component.quantity);
    }, 0);
    visited.delete(partId);

    return componentsCost;
  }, [partsMap]);


  // --- UTILITY FUNCTIONS ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: Toast = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  const closeConfirmation = () => {
    setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  // --- HANDLER FUNCTIONS ---
  const handleAddEmployee = (employee: Omit<Employee, 'id'>) => {
    setEmployees(prev => [...prev, { ...employee, id: Date.now() }]);
    showToast('کارمند جدید با موفقیت اضافه شد.');
  };
  
  const handleEditEmployee = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
    showToast('اطلاعات کارمند با موفقیت ویرایش شد.');
  };

  const handleDeleteEmployee = (employeeId: number) => {
    showConfirmation('حذف کارمند', 'آیا از حذف این کارمند اطمینان دارید؟', () => {
        setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        setWorkLogs(prev => prev.filter(log => log.employeeId !== employeeId));
        showToast('کارمند با موفقیت حذف شد.', 'info');
    });
  };

  const handleAddWorkLog = (workLog: Omit<WorkLog, 'id'>) => {
    setWorkLogs(prev => [...prev, { ...workLog, id: Date.now() }]);
    showToast(`کارکرد برای تاریخ ${new Intl.DateTimeFormat('fa-IR').format(new Date(workLog.date))} ثبت شد.`);
  };
  
  const handleEditWorkLog = (updatedLog: WorkLog) => {
    setWorkLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
    showToast(`کارکرد تاریخ ${new Intl.DateTimeFormat('fa-IR').format(new Date(updatedLog.date))} ویرایش شد.`);
  };

  const handleDeleteWorkLog = (logId: number) => {
     showConfirmation('حذف کارکرد', 'آیا از حذف این رکورد کارکرد اطمینان دارید؟', () => {
        setWorkLogs(prev => prev.filter(log => log.id !== logId));
        showToast('رکورد کارکرد حذف شد.', 'info');
    });
  };

  const handleAddPurchase = (purchase: Omit<PurchaseInvoice, 'id' | 'totalAmount'>) => {
    const totalAmount = purchase.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const newPurchase = { ...purchase, id: Date.now(), totalAmount };
    setPurchases(prev => [...prev, newPurchase]);

    setParts(prevParts => {
      const newParts = JSON.parse(JSON.stringify(prevParts));
      newPurchase.items.forEach(item => {
        let part = newParts.find((p: Part) => p.name.toLowerCase() === item.itemName.toLowerCase());
        if (part) {
           if (!part.isAssembly) {
                const oldStock = part.stock;
                const oldCost = part.cost || 0;
                const newStock = oldStock + item.quantity;
                part.cost = newStock > 0 ? ((oldStock * oldCost) + (item.quantity * item.unitPrice)) / newStock : item.unitPrice;
            }
            part.stock += item.quantity;
        } else {
          newParts.push({ id: Date.now(), name: item.itemName, isAssembly: false, stock: item.quantity, threshold: 10, cost: item.unitPrice });
        }
      });
      return newParts;
    });
    showToast('فاکتور خرید جدید با موفقیت ثبت شد.');
  };
  
  const handleEditPurchase = (updatedPurchase: PurchaseInvoice) => {
    // This function is complex due to inventory and cost reversion. For this app, we simplify by not reverting cost.
    // A full implementation would require transaction logs.
    const originalPurchase = purchases.find(p => p.id === updatedPurchase.id);
    if (!originalPurchase) return;

    setParts(prevParts => {
      const newParts = JSON.parse(JSON.stringify(prevParts));
      const inventoryChanges = new Map<string, number>();

      originalPurchase.items.forEach(item => {
        inventoryChanges.set(item.itemName.toLowerCase(), (inventoryChanges.get(item.itemName.toLowerCase()) || 0) - item.quantity);
      });

      updatedPurchase.items.forEach(item => {
        inventoryChanges.set(item.itemName.toLowerCase(), (inventoryChanges.get(item.itemName.toLowerCase()) || 0) + item.quantity);
      });

      inventoryChanges.forEach((quantityChange, itemName) => {
        const partIndex = newParts.findIndex((p: Part) => p.name.toLowerCase() === itemName);
        if (partIndex > -1) {
          newParts[partIndex].stock += quantityChange;
        }
      });
      return newParts;
    });

    setPurchases(prev => prev.map(p => p.id === updatedPurchase.id ? updatedPurchase : p));
    showToast(`فاکتور #${updatedPurchase.id} با موفقیت ویرایش شد.`);
  };


  const handleDeletePurchase = (purchaseId: number) => {
      showConfirmation('حذف فاکتور خرید', 'آیا از حذف این فاکتور اطمینان دارید؟ (موجودی انبار بازگردانی نخواهد شد)', () => {
        setPurchases(prev => prev.filter(p => p.id !== purchaseId));
        showToast('فاکتور خرید با موفقیت حذف شد.', 'info');
      });
  };

  const handleAddOrder = (order: Omit<SalesOrder, 'id' | 'totalAmount' | 'payments' | 'status'>) => {
    const totalAmount = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const newOrder = { ...order, id: Date.now(), totalAmount, payments: [], status: OrderStatus.PENDING };
    setOrders(prev => [...prev, newOrder]);
    showToast('سفارش جدید با موفقیت ایجاد شد.');
  };
  
  const handleDeliverOrder = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      showToast('سفارش یافت نشد.', 'error');
      return;
    }
    if (order.status !== OrderStatus.PAID) {
      showToast('این سفارش هنوز تسویه نشده و قابل تحویل نیست.', 'error');
      return;
    }
    
    // Check stock before delivery
    for (const item of order.items) {
        const part = partsMap.get(item.productId);
        if (!part || part.stock < item.quantity) {
            showToast(`موجودی "${part?.name || 'محصول'}" برای تحویل این سفارش کافی نیست.`, 'error');
            return;
        }
    }
    
    const costOfGoodsSold = order.items.reduce((sum, item) => {
        const itemCost = calculatePartCost(item.productId);
        return sum + (itemCost * item.quantity);
    }, 0);

    setParts(prevParts => {
      const newParts = JSON.parse(JSON.stringify(prevParts));
      order.items.forEach(item => {
        const partIndex = newParts.findIndex((p: Part) => p.id === item.productId);
        if (partIndex > -1) {
          newParts[partIndex].stock -= item.quantity;
        }
      });
      return newParts;
    });
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.DELIVERED, costOfGoodsSold } : o));
    showToast(`سفارش #${orderId} با موفقیت تحویل داده شد.`);
  };

  const handleDeleteOrder = (orderId: number) => {
      showConfirmation('حذف سفارش', 'آیا از حذف این سفارش اطمینان دارید؟', () => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        showToast('سفارش با موفقیت حذف شد.', 'info');
      });
  };

  const handleAddPayment = (orderId: number, payment: Omit<Payment, 'id'>) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const newPayments = [...order.payments, { ...payment, id: Date.now() }];
          const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
          let newStatus = order.status;
          if (totalPaid >= order.totalAmount && order.status === OrderStatus.PENDING) {
              newStatus = OrderStatus.PAID;
          }
          return { ...order, payments: newPayments, status: newStatus };
        }
        return order;
      })
    );
    showToast('پرداخت با موفقیت ثبت شد.');
  };

  const handleAddPart = (part: Omit<Part, 'id'>) => {
    setParts(prev => [...prev, { ...part, id: Date.now() }]);
    showToast('قطعه/محصول جدید با موفقیت به انبار اضافه شد.');
  };

  const handleEditPart = (updatedPart: Part) => {
    setParts(prev => prev.map(p => p.id === updatedPart.id ? updatedPart : p));
    showToast('اطلاعات قطعه/محصول با موفقیت ویرایش شد.');
  };

  const handleDeletePart = (partId: number) => {
    showConfirmation('حذف از انبار', 'آیا از حذف این آیتم اطمینان دارید؟', () => {
        setParts(prev => prev.filter(p => p.id !== partId));
        showToast('آیتم از انبار حذف شد.', 'info');
    });
  };
  
  const handleAddAssemblyOrder = (order: Omit<AssemblyOrder, 'id' | 'status'>) => {
    setAssemblyOrders(prev => [...prev, { ...order, id: Date.now(), status: AssemblyStatus.PENDING }]);
    showToast('سفارش مونتاژ جدید با موفقیت ثبت شد.');
  };

  const handleDeleteAssemblyOrder = (orderId: number) => {
    showConfirmation('حذف سفارش مونتاژ', 'آیا از حذف این سفارش مونتاژ اطمینان دارید؟', () => {
        setAssemblyOrders(prev => prev.filter(o => o.id !== orderId));
        showToast('سفارش مونتاژ با موفقیت حذف شد.', 'info');
    });
  };

  const handleCompleteAssemblyOrder = (orderId: number) => {
    const order = assemblyOrders.find(o => o.id === orderId);
    const assemblyPart = parts.find(p => p.id === order?.partId) as Part | undefined;
    if (!order || !assemblyPart || !assemblyPart.components) {
        showToast('محصول مونتاژی یا فرمول ساخت آن یافت نشد.', 'error');
        return;
    }

    for (const component of assemblyPart.components) {
      const componentPart = parts.find(p => p.id === component.partId);
      const requiredQuantity = component.quantity * order.quantity;
      if (!componentPart || componentPart.stock < requiredQuantity) {
        showToast(`موجودی "${componentPart?.name || 'قطعه نامشخص'}" کافی نیست.`, 'error');
        return;
      }
    }

    setParts(prevParts => {
      const newParts = JSON.parse(JSON.stringify(prevParts));
      assemblyPart.components?.forEach(component => {
        const partIndex = newParts.findIndex((p: Part) => p.id === component.partId);
        if (partIndex > -1) {
          newParts[partIndex].stock -= component.quantity * order.quantity;
        }
      });
      const finalPartIndex = newParts.findIndex((p: Part) => p.id === assemblyPart.id);
      if (finalPartIndex > -1) {
        newParts[finalPartIndex].stock += order.quantity;
      }
      return newParts;
    });

    setAssemblyOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: AssemblyStatus.COMPLETED } : o))
    );
    showToast(`مونتاژ ${order.quantity} عدد "${assemblyPart.name}" تکمیل شد.`);
  };
  
  const handleBackupData = () => {
      const appData = { employees, workLogs, parts, purchases, orders, assemblyOrders, customers, suppliers };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(appData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `workshop_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showToast("پشتیبان‌گیری با موفقیت انجام شد.");
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      showConfirmation("بازیابی اطلاعات", "آیا مطمئن هستید؟ تمام داده‌های فعلی با اطلاعات فایل پشتیبان جایگزین خواهند شد.", () => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                setEmployees(data.employees || []);
                setWorkLogs(data.workLogs || []);
                setParts(data.parts || []);
                setPurchases(data.purchases || []);
                setOrders(data.orders || []);
                setAssemblyOrders(data.assemblyOrders || []);
                setCustomers(data.customers || []);
                setSuppliers(data.suppliers || []);
                showToast("اطلاعات با موفقیت بازیابی شد.");
            } catch (error) {
                showToast("فایل پشتیبان نامعتبر است.", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
      });
  };
  
    const handleAddSupplier = (supplier: Omit<Supplier, 'id'>) => {
        setSuppliers(prev => [...prev, { ...supplier, id: Date.now() }]);
        showToast('تأمین‌کننده جدید اضافه شد.');
    };
    const handleEditSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
        showToast('اطلاعات تأمین‌کننده ویرایش شد.');
    };
    const handleDeleteSupplier = (id: number) => {
        showConfirmation('حذف تأمین‌کننده', 'آیا از حذف این تأمین‌کننده اطمینان دارید؟', () => {
            setSuppliers(prev => prev.filter(s => s.id !== id));
            showToast('تأمین‌کننده حذف شد.', 'info');
        });
    };
    const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
        setCustomers(prev => [...prev, { ...customer, id: Date.now() }]);
        showToast('مشتری جدید اضافه شد.');
    };
    const handleEditCustomer = (updatedCustomer: Customer) => {
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        showToast('اطلاعات مشتری ویرایش شد.');
    };
    const handleDeleteCustomer = (id: number) => {
        showConfirmation('حذف مشتری', 'آیا از حذف این مشتری اطمینان دارید؟', () => {
            setCustomers(prev => prev.filter(c => c.id !== id));
            showToast('مشتری حذف شد.', 'info');
        });
    };

    // --- Memoized Data for Reports and Dashboard ---
    const filteredAndCalculatedData = useMemo(() => {
        const { start, end } = reportDateRange;
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        const filterByDate = (item: { date: string }) => {
            if (!startDate && !endDate) return true;
            const itemDate = new Date(item.date);
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            return true;
        };

        const filteredOrders = orders.filter(filterByDate);
        const filteredPurchases = purchases.filter(filterByDate);
        const filteredWorkLogs = workLogs.filter(filterByDate);
        
        const deliveredOrders = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED);

        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalCOGS = deliveredOrders.reduce((sum, o) => sum + (o.costOfGoodsSold || 0), 0);
        const totalPurchaseCosts = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

        const salaryReports: SalaryReport[] = employees.map(employee => {
            const employeeLogs = filteredWorkLogs.filter(log => log.employeeId === employee.id);
            let totalHours = 0, totalOvertime = 0, totalDays = 0;
            employeeLogs.forEach(log => {
                totalHours += log.hoursWorked || 0;
                totalOvertime += log.overtimeHours || 0;
                if (log.workedDay) totalDays++;
            });
            let baseSalary = employee.payType === PayType.HOURLY ? totalHours * employee.hourlyRate : totalDays * employee.dailyRate;
            const overtimeSalary = totalOvertime * employee.overtimeRate;
            return {
                employeeId: employee.id, employeeName: employee.name, totalHours, totalOvertime,
                totalSalary: baseSalary + overtimeSalary,
            };
        });
        
        const totalSalaries = salaryReports.reduce((sum, r) => sum + r.totalSalary, 0);
        const netProfit = totalRevenue - totalCOGS - totalSalaries;

        const productProfitability: ProductProfitabilityReport[] = [];
        deliveredOrders.forEach(order => {
            order.items.forEach(item => {
                const product = partsMap.get(item.productId);
                if (!product) return;
                
                const itemRevenue = item.price * item.quantity;
                const itemCOGS = calculatePartCost(item.productId) * item.quantity;

                let report = productProfitability.find(p => p.productId === item.productId);
                if (report) {
                    report.quantitySold += item.quantity;
                    report.totalRevenue += itemRevenue;
                    report.totalCOGS += itemCOGS;
                    report.totalProfit += (itemRevenue - itemCOGS);
                } else {
                    productProfitability.push({
                        productId: item.productId,
                        productName: product.name,
                        quantitySold: item.quantity,
                        totalRevenue: itemRevenue,
                        totalCOGS: itemCOGS,
                        totalProfit: itemRevenue - itemCOGS,
                    });
                }
            });
        });

        return {
            orders: filteredOrders,
            purchases: filteredPurchases,
            workLogs: filteredWorkLogs,
            totalRevenue,
            totalCOGS,
            totalPurchaseCosts,
            totalSalaries,
            netProfit,
            salaryReports: salaryReports.filter(r => r.totalSalary > 0),
            productProfitabilityReport: productProfitability
        };
    }, [reportDateRange, orders, purchases, workLogs, employees, partsMap, calculatePartCost]);
    
  const overdueUnpaidOrders = useMemo(() => 
    orders.filter(order => order.status === OrderStatus.PENDING && new Date(order.deliveryDate) < new Date())
  , [orders]);

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard 
            orders={orders} 
            parts={parts} 
            setView={setView} 
            financials={{
                revenue: filteredAndCalculatedData.totalRevenue,
                cogs: filteredAndCalculatedData.totalCOGS,
                salaries: filteredAndCalculatedData.totalSalaries,
                netProfit: filteredAndCalculatedData.netProfit
            }}
            overdueUnpaidOrders={overdueUnpaidOrders}
            customers={customers}
        />;
      case 'employees':
        return <Employees 
            employees={employees} 
            workLogs={workLogs}
            onAddEmployee={handleAddEmployee} 
            onEditEmployee={handleEditEmployee} 
            onDeleteEmployee={handleDeleteEmployee} 
            onAddWorkLog={handleAddWorkLog}
            onEditWorkLog={handleEditWorkLog}
            onDeleteWorkLog={handleDeleteWorkLog}
        />;
      case 'purchases':
        return <Purchases purchases={purchases} onAddPurchase={handleAddPurchase} onEditPurchase={handleEditPurchase} onDeletePurchase={handleDeletePurchase} suppliers={suppliers} />;
      case 'inventory':
        return <Inventory parts={parts} onAddPart={handleAddPart} onEditPart={handleEditPart} onDeletePart={handleDeletePart} calculatePartCost={calculatePartCost} />;
      case 'assembly':
        return <Assembly assemblyOrders={assemblyOrders} parts={parts} onAddAssemblyOrder={handleAddAssemblyOrder} onCompleteAssemblyOrder={handleCompleteAssemblyOrder} onDeleteAssemblyOrder={handleDeleteAssemblyOrder} />;
      case 'orders':
        return <Orders orders={orders} onAddOrder={handleAddOrder} onAddPayment={handleAddPayment} onDeleteOrder={handleDeleteOrder} onDeliverOrder={handleDeliverOrder} parts={parts} customers={customers} />;
      case 'reports':
        return <Reports 
            data={filteredAndCalculatedData}
            employees={employees} 
            dateRange={reportDateRange}
            onDateRangeChange={setReportDateRange}
        />;
      case 'settings':
        return <Settings onBackup={handleBackupData} onRestore={handleRestoreData} />;
      case 'suppliers_customers':
        return <SuppliersCustomers 
                    suppliers={suppliers} 
                    customers={customers}
                    onAddSupplier={handleAddSupplier}
                    onEditSupplier={handleEditSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                    onAddCustomer={handleAddCustomer}
                    onEditCustomer={handleEditCustomer}
                    onDeleteCustomer={handleDeleteCustomer}
                />;
      default:
        return <Dashboard 
            orders={orders} 
            parts={parts} 
            setView={setView} 
            financials={{
                revenue: filteredAndCalculatedData.totalRevenue,
                cogs: filteredAndCalculatedData.totalCOGS,
                salaries: filteredAndCalculatedData.totalSalaries,
                netProfit: filteredAndCalculatedData.netProfit
            }}
            overdueUnpaidOrders={overdueUnpaidOrders}
            customers={customers}
        />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-on-surface">
      <Sidebar view={view} setView={setView} />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {renderView()}
      </main>
      <ToastContainer toasts={toasts} />
      <ConfirmationModal 
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={closeConfirmation}
      />
    </div>
  );
};

export default App;