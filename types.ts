export enum PayType {
  DAILY = 'روزمزد',
  HOURLY = 'ساعتی',
}

export interface Employee {
  id: number;
  name: string;
  payType: PayType;
  dailyRate: number;
  hourlyRate: number;
  overtimeRate: number;
}

export interface WorkLog {
  id: number;
  employeeId: number;
  date: string;
  hoursWorked?: number;
  workedDay?: boolean;
  overtimeHours: number;
  description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactInfo: string;
  phone?: string;
  address?: string;
  activityType?: string;
}

export interface PurchaseItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseInvoice {
  id: number;
  supplierId: number;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
}

export interface AssemblyComponent {
  partId: number;
  quantity: number;
}

export interface Part {
  id: number;
  name: string;
  isAssembly: boolean;
  stock: number;
  threshold: number;
  cost?: number; // Added for COGS tracking
  components?: AssemblyComponent[];
}

export enum AssemblyStatus {
  PENDING = 'در انتظار',
  COMPLETED = 'تکمیل شده',
}

export interface AssemblyOrder {
  id: number;
  partId: number; // Assembly part ID
  quantity: number;
  date: string;
  status: AssemblyStatus;
  materialCost?: number;
  laborCost?: number;
}

export interface ProductionLog {
    id: number;
    assemblyOrderId: number;
    employeeId: number;
    date: string;
    hoursSpent: number;
}

export interface Customer {
  id: number;
  name: string;
  contactInfo: string;
  phone?: string;
  address?: string;
  job?: string;
}

export interface OrderItem {
  productId: number; // Corresponds to a Part ID
  quantity: number;
  price: number;
}

export enum OrderStatus {
  PENDING = 'در انتظار پرداخت',
  PAID = 'پرداخت شده',
  DELIVERED = 'تحویل شده',
  CANCELLED = 'لغو شده'
}

export interface Payment {
    id: number;
    amount: number;
    date: string;
}

export interface SalesOrder {
  id: number;
  customerId: number;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  payments: Payment[];
  status: OrderStatus;
  deliveryDate: string;
  costOfGoodsSold?: number; // Added for profit calculation
}

export interface SalaryReport {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  totalOvertime: number;
  totalSalary: number;
}

export interface ProductProfitabilityReport {
    productId: number;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
    totalCOGS: number;
    totalProfit: number;
}

export type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

export type ViewType = 'dashboard' | 'employees' | 'purchases' | 'inventory' | 'assembly' | 'orders' | 'reports' | 'settings' | 'suppliers_customers' | 'expenses';

export interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface SalaryPayment {
  id: number;
  employeeId: number;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  overtimeSalary: number;
  totalSalary: number;
  paymentDate: string;
}
