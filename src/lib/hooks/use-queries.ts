import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBrands,
  getEmployees,
  getPartners,
  getTransactions,
  getUsers,
  getSubscriptions,
  createBrand,
  updateBrand,
  deleteBrand,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  createPartner,
  updatePartner,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  createInvite,
  getDashboardStats,
} from "@/actions/index";

// Query keys for cache management
export const queryKeys = {
  all: ["data"] as const,
  brands: () => [...queryKeys.all, "brands"] as const,
  brand: (id: string) => [...queryKeys.brands(), id] as const,
  employees: () => [...queryKeys.all, "employees"] as const,
  employee: (id: string) => [...queryKeys.employees(), id] as const,
  partners: () => [...queryKeys.all, "partners"] as const,
  partner: (id: string) => [...queryKeys.partners(), id] as const,
  transactions: () => [...queryKeys.all, "transactions"] as const,
  transaction: (id: string) => [...queryKeys.transactions(), id] as const,
  users: () => [...queryKeys.all, "users"] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  subscriptions: () => [...queryKeys.all, "subscriptions"] as const,
  invites: () => [...queryKeys.all, "invites"] as const,
  dashboardStats: () => [...queryKeys.all, "dashboard-stats"] as const,
};

// Brands
export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands(),
    queryFn: () => getBrands(),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands() });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands() });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands() });
    },
  });
}

// Employees
export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees(),
    queryFn: () => getEmployees(),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees() });
    },
  });
}

export function useTerminateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => terminateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees() });
    },
  });
}

// Partners
export function usePartners() {
  return useQuery({
    queryKey: queryKeys.partners(),
    queryFn: () => getPartners(),
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners() });
    },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners() });
    },
  });
}

// Transactions
export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions(),
    queryFn: async () => {
      const response = await getTransactions();
      return response.data || [];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    },
  });
}

// Users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: () => getUsers(),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => updateUserRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => updateUserStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}

// Subscriptions
export function useSubscriptions() {
  return useQuery({
    queryKey: queryKeys.subscriptions(),
    queryFn: () => getSubscriptions(),
  });
}

// Invites
export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}

// Dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats(),
    queryFn: () => getDashboardStats(),
  });
}
