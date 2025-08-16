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
}

export interface Supplier {
  id: number;
  name: string;
  contactInfo: string;
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
}

export interface Customer {
  id: number;
  name: string;
  contactInfo: string;
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
}

export interface SalaryReport {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  totalOvertime: number;
  totalSalary: number;
}

export type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

export type ViewType = 'dashboard' | 'employees' | 'purchases' | 'inventory' | 'assembly' | 'orders' | 'reports' | 'settings' | 'suppliers_customers';