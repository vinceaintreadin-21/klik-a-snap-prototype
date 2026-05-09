import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Operator {
  id: number;
  user__id: number;
  user__username: string;
  user__email: string;
  user__date_joined: string;
  is_active: boolean;
  last_password_reset: string | null;
  deactivated_at: string | null;
  deactivated_by__username: string | null;
}

export interface OperatorDetail {
  id: number;
  user_id: number;
  username: string;
  email: string;
  is_active: boolean;
  date_joined: string;
  last_password_reset: string | null;
  deactivated_at: string | null;
  deactivated_by: string | null;
}

export interface CreateOperatorData {
  username: string;
  email: string;
}

export interface CreateOperatorResponse {
  message: string;
  operator_id: number;
  username: string;
  email: string;
  temp_password: string;
}

export interface UpdateOperatorData {
  username?: string;
  email?: string;
  is_active?: boolean;
}

export interface ResetPasswordResponse {
  message: string;
  temp_password: string;
}

// ─── Hook 1: useOperators ────────────────────────────────────────────────────

export function useOperators() {
  const [operators, setOperators] = useState<Operator[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/operators/');
      setOperators(res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error;

      if (status === 403) {
        setError(message || 'Admin access required');
      } else if (status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(message || 'Failed to fetch operators. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  return {
    operators,
    loading,
    error,
    refetch: fetchOperators,
  };
}

// ─── Hook 2: useOperatorDetail ───────────────────────────────────────────────

export function useOperatorDetail(operatorId: number | null) {
  const [operator, setOperator] = useState<OperatorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperator = useCallback(async () => {
    if (!operatorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/operators/${operatorId}/`);
      setOperator(res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error;

      if (status === 404) {
        setError('Operator not found.');
      } else if (status === 403) {
        setError(message || 'Admin access required.');
      } else {
        setError(message || 'Failed to fetch operator details.');
      }
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => {
    fetchOperator();
  }, [fetchOperator]);

  return {
    operator,
    loading,
    error,
    refetch: fetchOperator,
  };
}

// ─── Hook 3: useCreateOperator ───────────────────────────────────────────────

export function useCreateOperator(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const createOperator = async (data: CreateOperatorData): Promise<CreateOperatorResponse | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setTempPassword(null);

    try {
      const res = await api.post<CreateOperatorResponse>('/admin/create-operator/', data);
      setSuccess(true);
      setTempPassword(res.data.temp_password);
      onSuccess?.();
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.error;
      setError(message || 'Failed to create operator.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
    setTempPassword(null);
  };

  return {
    createOperator,
    loading,
    error,
    success,
    tempPassword,
    reset,
  };
}

// ─── Hook 4: useUpdateOperator ───────────────────────────────────────────────

export function useUpdateOperator(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateOperator = async (id: number, data: UpdateOperatorData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.patch(`/admin/operators/${id}/update/`, data);
      setSuccess(true);
      onSuccess?.();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error;
      setError(message || 'Failed to update operator.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    updateOperator,
    loading,
    error,
    success,
    reset,
  };
}

// ─── Hook 5: useResetPassword ────────────────────────────────────────────────

export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const resetPassword = async (id: number): Promise<ResetPasswordResponse | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setTempPassword(null);

    try {
      const res = await api.patch<ResetPasswordResponse>(
        `/admin/operators/${id}/reset-password/`
      );
      setSuccess(true);
      setTempPassword(res.data.temp_password);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.error;
      setError(message || 'Failed to reset password.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
    setTempPassword(null);
  };

  return {
    resetPassword,
    loading,
    error,
    success,
    tempPassword,
    reset,
  };
}

// ─── Hook 6: useDeleteOperator ───────────────────────────────────────────────

export function useDeleteOperator(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const deleteOperator = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.delete(`/admin/operators/${id}/delete/`);
      setSuccess(true);
      onSuccess?.();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error;
      // Pass through backend message — includes order count and deactivation suggestion
      setError(message || 'Failed to delete operator.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    deleteOperator,
    loading,
    error,
    success,
    reset,
  };
}
