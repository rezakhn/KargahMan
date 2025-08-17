
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ViewType, Employee, PurchaseInvoice, Part, SalesOrder, Customer, Supplier, AssemblyOrder, PurchaseItem, OrderItem, WorkLog, Payment, Toast, ProductProfitabilityReport, SalaryReport, ProductionLog, Expense, SalaryPayment } from './types';
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
import Expenses from './components/Expenses';
import ToastContainer from './components/shared/Toast';
import ConfirmationModal from './components/shared/ConfirmationModal';

declare global {
  interface FileSystemFileHandle {
    queryPermission(options?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
    requestPermission(options?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
  }
  interface Window {
    showOpenFilePicker: (options?: any) => Promise<[FileSystemFileHandle]>;
    showSaveFilePicker: (options?: any) => Promise<FileSystemFileHandle>;
  }
}

function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error writing to localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

// Helper functions for IndexedDB to persist the file handle
const idb = {
  get: <T,>(key: string): Promise<T | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('workshop-db', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('keyval');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const getRequest = store.get(key);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => resolve(null);
        tx.oncomplete = () => db.close();
      };
      request.onerror = () => resolve(null);
    });
  },
  set: (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('workshop-db', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('keyval');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(value, key);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }
};


const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'تایید و حذف',
    confirmButtonVariant: 'danger' as 'primary' | 'secondary' | 'danger',
  });
  
  const [reportDateRange, setReportDateRange] = useState<{start: string, end: string}>({
      start: '',
      end: '',
  });

  const [employeeIdToManage, setEmployeeIdToManage] = useState<number | null>(null);

  // --- Data Persistence State ---
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isFSApiSupported, setIsFSApiSupported] = useState(false);
  const [autoSave, setAutoSave] = useState(false);

  // --- PERSISTENT DATA ---
  const [employees, setEmployees] = usePersistentState<Employee[]>('employees', [
    { id: 1, name: 'علی رضایی', payType: PayType.HOURLY, hourlyRate: 150000, dailyRate: 0, overtimeRate: 200000 },
    { id: 2, name: 'زهرا احمدی', payType: PayType.DAILY, hourlyRate: 0, dailyRate: 1200000, overtimeRate: 250000 },
  ]);

  const [workLogs, setWorkLogs] = usePersistentState<WorkLog[]>('workLogs', [
      {id: 1, employeeId: 1, date: '2023-10-01', hoursWorked: 8, overtimeHours: 2, description: 'انجام پروژه اولیه'},
      {id: 2, employeeId: 2, date: '2023-10-01', workedDay: true, overtimeHours: 1},
      {id: 3, employeeId: 1, date: '2023-10-02', hoursWorked: 9, overtimeHours: 1},
      {id: 4, employeeId: 1, date: '2024-05-10', hoursWorked: 8, overtimeHours: 0},
      {id: 5, employeeId: 2, date: '2024-05-10', workedDay: true, overtimeHours: 2},
      {id: 6, employeeId: 2, date: '2024-05-11', workedDay: false, overtimeHours: 0, description: 'مرخصی استعلاجی'},
  ]);

  const [parts, setParts] = usePersistentState<Part[]>('parts', [
    { id: 1, name: 'میلگرد فولادی خام', isAssembly: false, stock: 10, threshold: 20, cost: 95000 },
    { id: 2, name: 'پیچ M8', isAssembly: false, stock: 500, threshold: 100, cost: 5000 },
    { id: 3, name: 'قطعه مونتاژی براکت', isAssembly: true, stock: 20, threshold: 5, components: [{ partId: 1, quantity: 2 }, { partId: 2, quantity: 8 }], cost: 230000 },
    { id: 4, name: 'محصول نهایی X', isAssembly: true, stock: 10, threshold: 2, components: [{ partId: 3, quantity: 1 }], cost: 230000 },
  ]);

  const [purchases, setPurchases] = usePersistentState<PurchaseInvoice[]>('purchases', [
    { id: 1, supplierId: 1, date: '2023-10-01', items: [{id: 1, itemName: 'میلگرد فولادی خام', quantity: 50, unitPrice: 100000}], totalAmount: 5000000 },
  ]);

  const [orders, setOrders] = usePersistentState<SalesOrder[]>('orders', [
    { id: 1, customerId: 1, date: '2024-05-15', items: [{productId: 4, quantity: 2, price: 5000000}], totalAmount: 10000000, payments: [{id: 1, amount: 10000000, date: '2024-05-15'}], status: OrderStatus.DELIVERED, deliveryDate: '2024-05-20', costOfGoodsSold: 460000 },
    { id: 2, customerId: 2, date: '2024-05-20', items: [{productId: 3, quantity: 10, price: 500000}], totalAmount: 5000000, payments: [{id:1, amount: 5000000, date: '2024-05-20'}], status: OrderStatus.PAID, deliveryDate: '2024-05-25' },
    { id: 3, customerId: 1, date: '2023-08-10', items: [{productId: 3, quantity: 5, price: 500000}], totalAmount: 2500000, payments: [], status: OrderStatus.PENDING, deliveryDate: '2023-08-20' },
  ]);

  const [assemblyOrders, setAssemblyOrders] = usePersistentState<AssemblyOrder[]>('assemblyOrders', [
    { id: 1, partId: 3, quantity: 10, date: '2023-10-10', status: AssemblyStatus.COMPLETED, materialCost: 2300000, laborCost: 300000 },
    { id: 2, partId: 4, quantity: 5, date: '2023-10-20', status: AssemblyStatus.PENDING },
  ]);

  const [productionLogs, setProductionLogs] = usePersistentState<ProductionLog[]>('productionLogs', [
      { id: 1, assemblyOrderId: 1, employeeId: 1, date: '2023-10-10', hoursSpent: 2 },
  ]);

  const [customers, setCustomers] = usePersistentState<Customer[]>('customers', [
    { id: 1, name: 'شرکت جهانی', contactInfo: 'contact@globalcorp.com', phone: '021-12345678', address: 'تهران، خیابان اصلی', job: 'تولیدی' },
    { id: 2, name: 'کسب‌وکار محلی', contactInfo: 'sales@localbiz.com', phone: '031-87654321', address: 'اصفهان، میدان نقش جهان', job: 'خدماتی' },
  ]);

  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('suppliers', [
      { id: 1, name: 'فولاد گستر', contactInfo: 'info@metalsupply.com', phone: '021-11112222', address: 'شهرک صنعتی', activityType: 'تامین مواد اولیه' },
      { id: 2, name: 'کارخانه قطعات', contactInfo: 'orders@componentfactory.com', phone: '021-33334444', address: 'جاده مخصوص', activityType: 'تولید قطعات' },
  ]);

  const [expenses, setExpenses] = usePersistentState<Expense[]>('expenses', [
    { id: 1, date: '2024-05-01', description: 'اجاره کارگاه برای ماه می', amount: 5000000, category: 'اجاره' },
    { id: 2, date: '2024-05-25', description: 'هزینه حمل سفارش #2', amount: 150000, category: 'حمل و نقل' },
  ]);

  const [salaryPayments, setSalaryPayments] = usePersistentState<SalaryPayment[]>('salaryPayments', []);

  const partsMap = useMemo(() => new Map(parts.map(p => [p.id, p])), [parts]);
  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const calculatePartCost = useCallback((partId: number): number => {
    return partsMap.get(partId)?.cost || 0;
  }, [partsMap]);


  // --- UTILITY FUNCTIONS ---
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: Toast = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  }, []);

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmButtonText: string = 'تایید و حذف',
    confirmButtonVariant: 'primary' | 'secondary' | 'danger' = 'danger'
  ) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirmation();
      },
      confirmButtonText,
      confirmButtonVariant,
    });
  };

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };
  
  // --- DATA PERSISTENCE LOGIC ---
  const allData = useMemo(() => ({ employees, workLogs, parts, purchases, orders, assemblyOrders, customers, suppliers, productionLogs, expenses, salaryPayments }), [employees, workLogs, parts, purchases, orders, assemblyOrders, customers, suppliers, productionLogs, expenses, salaryPayments]);
  
  const handleConnectFile = async () => {
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: 'workshop-data.json',
            types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        });
        await idb.set('fileHandle', handle);
        setFileHandle(handle);
        showToast(`فایل ${handle.name} برای ذخیره‌سازی متصل شد.`);
        // Save current data to the newly connected file immediately
        await saveDataToFile(handle);
    } catch (err) {
        const error = err as Error;
        if (error.name === 'SecurityError') {
            showToast('مرورگر اجازه دسترسی به فایل را به دلیل محدودیت‌های امنیتی (مانند اجرا در فریم) نمی‌دهد. لطفاً از روش پشتیبان‌گیری دستی استفاده کنید.', 'error');
            setIsFSApiSupported(false);
        } else if (error.name !== 'AbortError') {
            console.error('Error connecting file:', err);
            showToast('خطا در اتصال فایل.', 'error');
        }
    }
  };

  useEffect(() => {
    const checkApiSupport = async () => {
        if ('showSaveFilePicker' in window) {
            setIsFSApiSupported(true);
            const handle = await idb.get<FileSystemFileHandle>('fileHandle');
            if (handle) {
                if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') {
                    setFileHandle(handle);
                } else {
                    await idb.set('fileHandle', null); // Clear stale handle if permissions were revoked
                }
            } else {
                 showConfirmation(
                    'تنظیم فایل ذخیره‌سازی',
                    'برای جلوگیری از پاک شدن اطلاعات با پاک کردن حافظه مرورگر، بهتر است برنامه را به یک فایل روی کامپیوتر خود متصل کنید. آیا می‌خواهید الآن یک فایل برای ذخیره داده‌ها ایجاد کنید؟',
                    handleConnectFile,
                    'بله، فایل را ایجاد کن',
                    'primary'
                );
            }
            const autoSaveVal = await idb.get<boolean>('autoSave');
            setAutoSave(!!autoSaveVal);
        }
    };
    checkApiSupport();
  }, []);

  const saveDataToFile = useCallback(async (handle?: FileSystemFileHandle | null) => {
    const currentHandle = handle || fileHandle;
    if (!currentHandle) {
        showToast('فایل داده متصل نیست.', 'error');
        return;
    }
    try {
        const writable = await currentHandle.createWritable();
        await writable.write(JSON.stringify(allData, null, 2));
        await writable.close();
        showToast(`داده‌ها با موفقیت در فایل ${currentHandle.name} ذخیره شد.`);
    } catch (err) {
        console.error('Error saving data to file:', err);
        showToast('خطا در ذخیره داده‌ها.', 'error');
    }
  }, [fileHandle, allData, showToast]);

  useEffect(() => {
    if (autoSave && fileHandle) {
        const handler = setTimeout(() => {
            saveDataToFile();
        }, 2000);
        return () => clearTimeout(handler);
    }
  }, [autoSave, fileHandle, saveDataToFile, allData]);

  const loadDataIntoState = useCallback((data: any) => {
    setEmployees(data.employees || []);
    setWorkLogs(data.workLogs || []);
    setParts(data.parts || []);
    setPurchases(data.purchases || []);
    setOrders(data.orders || []);
    setAssemblyOrders(data.assemblyOrders || []);
    setCustomers(data.customers || []);
    setSuppliers(data.suppliers || []);
    setProductionLogs(data.productionLogs || []);
    setExpenses(data.expenses || []);
    setSalaryPayments(data.salaryPayments || []);
    showToast("اطلاعات با موفقیت بازیابی شد.");
  }, [setAssemblyOrders, setCustomers, setEmployees, setExpenses, setOrders, setParts, setProductionLogs, setPurchases, setSalaryPayments, setSuppliers, setWorkLogs, showToast]);
  
  const handleLoadDataFromFile = async () => {
    let handleToLoadFrom: FileSystemFileHandle | null = fileHandle;
    if (!handleToLoadFrom) {
        try {
            [handleToLoadFrom] = await window.showOpenFilePicker({
                types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
            });
        } catch (err) {
            const error = err as Error;
            if (error.name === 'SecurityError') {
                showToast('مرورگر اجازه دسترسی به فایل را به دلیل محدودیت‌های امنیتی (مانند اجرا در فریم) نمی‌دهد. لطفاً از روش پشتیبان‌گیری دستی استفاده کنید.', 'error');
                setIsFSApiSupported(false);
            } else if (error.name !== 'AbortError') {
                console.error('Error picking file', err);
                showToast('خطا در انتخاب فایل.', 'error');
            }
            return; // Exit function on any error in picker
        }
    }

    if (!handleToLoadFrom) return;

    showConfirmation(
        "بازیابی اطلاعات از فایل",
        `آیا مطمئن هستید؟ تمام داده‌های فعلی با اطلاعات فایل "${handleToLoadFrom.name}" جایگزین خواهند شد.`,
        async () => {
            try {
                const file = await handleToLoadFrom!.getFile();
                const contents = await file.text();
                const data = JSON.parse(contents);
                loadDataIntoState(data);
            } catch (err) {
                console.error('Error loading data from file:', err);
                showToast("فایل پشتیبان نامعتبر است یا خطایی رخ داده.", "error");
            }
        },
        "بله، بازیابی کن",
        "primary"
    );
  };
  
  const handleToggleAutoSave = async (enabled: boolean) => {
    setAutoSave(enabled);
    await idb.set('autoSave', enabled);
    showToast(enabled ? 'ذخیره خودکار فعال شد.' : 'ذخیره خودکار غیرفعال شد.', 'info');
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

    const handlePaySalary = (paymentData: Omit<SalaryPayment, 'id'>) => {
        const newPayment: SalaryPayment = {
            ...paymentData,
            id: Date.now(),
        };
        setSalaryPayments(prev => [...prev, newPayment]);
        showToast(`مبلغ ${paymentData.amount.toLocaleString('fa-IR')} تومان برای ${employeesMap.get(paymentData.employeeId)?.name} پرداخت شد.`);
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
        setProductionLogs(prev => prev.filter(log => log.assemblyOrderId !== orderId));
        showToast('سفارش مونتاژ با موفقیت حذف شد.', 'info');
    });
  };
  
   const handleAddProductionLog = (log: Omit<ProductionLog, 'id'>) => {
    setProductionLogs(prev => [...prev, {...log, id: Date.now()}]);
    showToast('کارکرد تولید ثبت شد.');
  };

  const handleDeleteProductionLog = (logId: number) => {
    setProductionLogs(prev => prev.filter(log => log.id !== logId));
    showToast('کارکرد تولید حذف شد.', 'info');
  };

  const handleCompleteAssemblyOrder = (orderId: number) => {
    const order = assemblyOrders.find(o => o.id === orderId);
    const assemblyPart = parts.find(p => p.id === order?.partId);
    if (!order || !assemblyPart || !assemblyPart.components) {
        showToast('محصول مونتاژی یا فرمول ساخت آن یافت نشد.', 'error');
        return;
    }

    for (const component of assemblyPart.components) {
      const componentPart = partsMap.get(component.partId);
      const requiredQuantity = component.quantity * order.quantity;
      if (!componentPart || componentPart.stock < requiredQuantity) {
        showToast(`موجودی "${componentPart?.name || 'قطعه نامشخص'}" کافی نیست.`, 'error');
        return;
      }
    }
    
    // Calculate costs for this specific order
    const orderProductionLogs = productionLogs.filter(log => log.assemblyOrderId === orderId);
    const totalLaborCost = orderProductionLogs.reduce((sum, log) => {
        const employee = employeesMap.get(log.employeeId);
        if (!employee) return sum;
        const effectiveHourlyRate = employee.payType === PayType.HOURLY ? employee.hourlyRate : (employee.dailyRate / 8); // Assume 8-hour day
        return sum + (log.hoursSpent * effectiveHourlyRate);
    }, 0);

    const totalMaterialCost = (assemblyPart.components || []).reduce((sum, component) => {
        const componentCost = calculatePartCost(component.partId);
        return sum + (componentCost * component.quantity * order.quantity);
    }, 0);

    const costPerUnitForThisOrder = (totalMaterialCost + totalLaborCost) / order.quantity;

    setParts(prevParts => {
      const newParts = JSON.parse(JSON.stringify(prevParts));
      
      // Deduct component stock
      assemblyPart.components?.forEach(component => {
        const partIndex = newParts.findIndex((p: Part) => p.id === component.partId);
        if (partIndex > -1) {
          newParts[partIndex].stock -= component.quantity * order.quantity;
        }
      });
      
      // Update final product stock and cost
      const finalPartIndex = newParts.findIndex((p: Part) => p.id === assemblyPart.id);
      if (finalPartIndex > -1) {
        const oldStock = newParts[finalPartIndex].stock;
        const oldCost = newParts[finalPartIndex].cost || 0;
        const newStock = oldStock + order.quantity;
        
        newParts[finalPartIndex].stock = newStock;
        // Weighted average cost calculation
        if (newStock > 0) {
            newParts[finalPartIndex].cost = ((oldStock * oldCost) + (order.quantity * costPerUnitForThisOrder)) / newStock;
        } else {
            newParts[finalPartIndex].cost = costPerUnitForThisOrder;
        }
      }
      return newParts;
    });

    setAssemblyOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: AssemblyStatus.COMPLETED, laborCost: totalLaborCost, materialCost: totalMaterialCost } : o))
    );
    showToast(`مونتاژ ${order.quantity} عدد "${assemblyPart.name}" تکمیل شد.`);
  };
  
  const handleBackupData = () => {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(allData, null, 2))}`;
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
                loadDataIntoState(data);
            } catch (error) {
                showToast("فایل پشتیبان نامعتبر است.", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
      }, "بله، بازیابی کن", "primary");
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
    
     const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
        setExpenses(prev => [...prev, { ...expense, id: Date.now() }]);
        showToast('هزینه جدید با موفقیت ثبت شد.');
    };
    const handleEditExpense = (updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
        showToast('هزینه با موفقیت ویرایش شد.');
    };
    const handleDeleteExpense = (id: number) => {
        showConfirmation('حذف هزینه', 'آیا از حذف این هزینه اطمینان دارید؟', () => {
            setExpenses(prev => prev.filter(e => e.id !== id));
            showToast('هزینه حذف شد.', 'info');
        });
    };
    
    const handleManageEmployeeLog = (employeeId: number) => {
        setEmployeeIdToManage(employeeId);
        setView('employees');
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
        const filteredExpenses = expenses.filter(filterByDate);
        
        const deliveredOrders = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED);

        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalCOGS = deliveredOrders.reduce((sum, o) => sum + (o.costOfGoodsSold || 0), 0);
        const totalPurchaseCosts = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

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
        const netProfit = totalRevenue - totalCOGS - totalSalaries - totalExpenses;

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
            allOrders: orders, // for monthly chart
            purchases: filteredPurchases,
            workLogs: filteredWorkLogs,
            totalRevenue,
            totalCOGS,
            totalPurchaseCosts,
            totalSalaries,
            totalExpenses,
            netProfit,
            salaryReports: salaryReports.filter(r => r.totalSalary > 0),
            productProfitabilityReport: productProfitability
        };
    }, [reportDateRange, orders, purchases, workLogs, employees, partsMap, calculatePartCost, expenses]);
    
  const overdueUnpaidOrders = useMemo(() => 
    orders.filter(order => order.status === OrderStatus.PENDING && new Date(order.deliveryDate) < new Date())
  , [orders]);

  const attendanceAlerts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const loggedTodayIds = new Set(workLogs.filter(log => log.date === today).map(log => log.employeeId));
    return employees.filter(emp => !loggedTodayIds.has(emp.id));
  }, [employees, workLogs]);

  const lowStockItems = useMemo(() => parts.filter(p => p.stock < p.threshold), [parts]);


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
                expenses: filteredAndCalculatedData.totalExpenses,
                netProfit: filteredAndCalculatedData.netProfit
            }}
            overdueUnpaidOrders={overdueUnpaidOrders}
            attendanceAlerts={attendanceAlerts}
            lowStockItems={lowStockItems}
            onManageEmployeeLog={handleManageEmployeeLog}
            customers={customers}
        />;
      case 'employees':
        return <Employees 
            employees={employees} 
            workLogs={workLogs}
            salaryPayments={salaryPayments}
            onAddEmployee={handleAddEmployee} 
            onEditEmployee={handleEditEmployee} 
            onDeleteEmployee={handleDeleteEmployee} 
            onAddWorkLog={handleAddWorkLog}
            onEditWorkLog={handleEditWorkLog}
            onDeleteWorkLog={handleDeleteWorkLog}
            onPaySalary={handlePaySalary}
            employeeIdToManage={employeeIdToManage}
            onClearManageEmployee={() => setEmployeeIdToManage(null)}
        />;
      case 'purchases':
        return <Purchases purchases={purchases} onAddPurchase={handleAddPurchase} onEditPurchase={handleEditPurchase} onDeletePurchase={handleDeletePurchase} suppliers={suppliers} />;
      case 'inventory':
        return <Inventory parts={parts} onAddPart={handleAddPart} onEditPart={handleEditPart} onDeletePart={handleDeletePart} calculatePartCost={calculatePartCost} />;
      case 'assembly':
        return <Assembly 
            assemblyOrders={assemblyOrders} 
            parts={parts} 
            employees={employees}
            productionLogs={productionLogs}
            onAddAssemblyOrder={handleAddAssemblyOrder} 
            onCompleteAssemblyOrder={handleCompleteAssemblyOrder} 
            onDeleteAssemblyOrder={handleDeleteAssemblyOrder}
            onAddProductionLog={handleAddProductionLog}
            onDeleteProductionLog={handleDeleteProductionLog}
            calculatePartCost={calculatePartCost}
         />;
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
        return <Settings 
                    onBackup={handleBackupData} 
                    onRestore={handleRestoreData} 
                    isFSApiSupported={isFSApiSupported}
                    fileHandle={fileHandle}
                    autoSave={autoSave}
                    onConnectFile={handleConnectFile}
                    onLoadFromFile={handleLoadDataFromFile}
                    onSaveToFile={() => saveDataToFile()}
                    onToggleAutoSave={handleToggleAutoSave}
                />;
      case 'suppliers_customers':
        return <SuppliersCustomers 
                    suppliers={suppliers} 
                    customers={customers}
                    orders={orders}
                    partsMap={partsMap}
                    onAddSupplier={handleAddSupplier}
                    onEditSupplier={handleEditSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                    onAddCustomer={handleAddCustomer}
                    onEditCustomer={handleEditCustomer}
                    onDeleteCustomer={handleDeleteCustomer}
                />;
       case 'expenses':
        return <Expenses
                    expenses={expenses}
                    onAddExpense={handleAddExpense}
                    onEditExpense={handleEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                />
      default:
        return <Dashboard 
            orders={orders} 
            parts={parts} 
            setView={setView} 
            financials={{
                revenue: filteredAndCalculatedData.totalRevenue,
                cogs: filteredAndCalculatedData.totalCOGS,
                salaries: filteredAndCalculatedData.totalSalaries,
                expenses: filteredAndCalculatedData.totalExpenses,
                netProfit: filteredAndCalculatedData.netProfit
            }}
            overdueUnpaidOrders={overdueUnpaidOrders}
            attendanceAlerts={attendanceAlerts}
            lowStockItems={lowStockItems}
            onManageEmployeeLog={handleManageEmployeeLog}
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
        confirmButtonText={confirmation.confirmButtonText}
        confirmButtonVariant={confirmation.confirmButtonVariant}
      />
    </div>
  );
};

export default App;
