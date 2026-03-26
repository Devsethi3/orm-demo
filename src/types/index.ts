// src/types/index.ts
import {
  UserRole,
  UserStatus,
  TransactionType,
  TransactionSource,
  BillingCycle,
  PaymentStatus,
  InviteStatus,
} from "@/lib/types/enums";

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueChange: number;
  expenseChange: number;
  revenueByBrand: BrandRevenue[];
  recentTransactions: TransactionWithRelations[];
  monthlyData: MonthlyData[];
}

export interface BrandRevenue {
  brandId: string;
  brandName: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface TransactionWithRelations {
  id: string;
  brandId: string;
  projectId: string | null;
  type: TransactionType;
  source: TransactionSource;
  description: string | null;
  originalAmount: number;
  originalCurrency: string;
  conversionRate: number;
  usdValue: number;
  transactionDate: Date;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  brand: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface UserWithRelations {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  _count?: {
    transactions: number;
  };
}

export interface InviteWithRelations {
  id: string;
  email: string;
  role: UserRole;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
  brand: {
    id: string;
    name: string;
  } | null;
}

export interface EmployeeWithRelations {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string | null;
  salaryAmount: number;
  salaryCurrency: string;
  paymentDay: number;
  joinDate: Date;
  isActive: boolean;
  brand: {
    id: string;
    name: string;
  };
  _count?: {
    salaryPayments: number;
  };
  lastPayment?: {
    paymentDate: Date;
    status: PaymentStatus;
  } | null;
}

export interface PartnerWithRelations {
  id: string;
  revenueShare: number;
  profitShare: number;
  isActive: boolean;
  joinDate: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  brand: {
    id: string;
    name: string;
  };
  earnings?: {
    totalRevenue: number;
    totalEarnings: number;
    pendingWithdrawals: number;
  };
}

export interface SubscriptionWithDue {
  id: string;
  name: string;
  provider: string | null;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextDueDate: Date;
  category: string | null;
  isActive: boolean;
  isDueSoon: boolean;
  isOverdue: boolean;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOptions {
  brandId?: string;
  type?: TransactionType;
  source?: TransactionSource;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}
