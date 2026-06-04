import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Clients ───────────────────────────────────────────

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
  });
}

export function useClient(id) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData) => {
      const { data } = await api.post('/clients', clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/clients/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

// ─── Feedback ──────────────────────────────────────────

export function useFeedback() {
  return useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const { data } = await api.get('/feedback');
      return data;
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedbackData) => {
      const { data } = await api.post('/feedback', feedbackData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

// ─── Emails ────────────────────────────────────────────

export function useSentEmails() {
  return useQuery({
    queryKey: ['emails'],
    queryFn: async () => {
      const { data } = await api.get('/emails/sent');
      return data;
    },
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailData) => {
      const { data } = await api.post('/emails/send', emailData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}

// ─── Invoices ──────────────────────────────────────────

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await api.get('/invoices');
      return data;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData) => {
      const { data } = await api.post('/invoices', invoiceData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, amount, due_date, notes }) => {
      const { data } = await api.put(`/invoices/${id}`, { status, amount, due_date, notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/invoices/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// ─── Receipts ──────────────────────────────────────────

export function useReceipts() {
  return useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data } = await api.get('/receipts');
      return data;
    },
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptData) => {
      const { data } = await api.post('/receipts', receiptData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/receipts/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}
