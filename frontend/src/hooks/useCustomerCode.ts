/**
 * Customer Code Management Hook
 * Hook để quản lý mã khách hàng tự động
 */

import { useState, useCallback } from 'react';

interface CustomerCodeState {
  code: string;
  isValid: boolean;
  isGenerating: boolean;
  error: string | null;
}

interface UseCustomerCodeReturn {
  code: string;
  isValid: boolean;
  isGenerating: boolean;
  error: string | null;
  setCode: (code: string) => void;
  generateNextCode: () => Promise<void>;
  validateCode: (code: string) => boolean;
  clearError: () => void;
}

export const useCustomerCode = (initialCode: string = ''): UseCustomerCodeReturn => {
  const [state, setState] = useState<CustomerCodeState>({
    code: initialCode,
    isValid: validateCustomerCode(initialCode),
    isGenerating: false,
    error: null
  });

  // Validate customer code format
  const validateCustomerCode = (code: string): boolean => {
    if (!code) return false;
    
    // Check format: CUS + 3 digits
    const pattern = /^CUS\d{3}$/;
    return pattern.test(code);
  };

  // Set customer code
  const setCode = useCallback((code: string) => {
    const upperCode = code.toUpperCase();
    setState(prev => ({
      ...prev,
      code: upperCode,
      isValid: validateCustomerCode(upperCode),
      error: null
    }));
  }, []);

  // Generate next customer code
  const generateNextCode = useCallback(async () => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const token = localStorage.getItem('access_token');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/customers/next-customer-code', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const nextCode = data.next_customer_code;
        
        setState(prev => ({
          ...prev,
          code: nextCode,
          isValid: true,
          isGenerating: false,
          error: null
        }));
      } else {
        const errorData = await response.json();
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: errorData.detail || 'Failed to generate customer code'
        }));
      }
    } catch (err) {
      const errorMessage = err.name === 'AbortError' 
        ? 'Request timeout: Please try again'
        : 'Network error: Unable to generate customer code';
        
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));
    }
  }, []);

  // Validate code
  const validateCode = useCallback((code: string) => {
    return validateCustomerCode(code);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    code: state.code,
    isValid: state.isValid,
    isGenerating: state.isGenerating,
    error: state.error,
    setCode,
    generateNextCode,
    validateCode,
    clearError
  };
};
