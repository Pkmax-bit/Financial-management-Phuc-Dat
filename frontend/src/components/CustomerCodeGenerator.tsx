/**
 * Customer Code Generator Component
 * Component để hiển thị và quản lý mã khách hàng tự động
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AutoAwesome as AutoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface CustomerCodeGeneratorProps {
  value?: string;
  onChange: (code: string) => void;
  onGenerate?: (code: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

const CustomerCodeGenerator: React.FC<CustomerCodeGeneratorProps> = ({
  value = '',
  onChange,
  onGenerate,
  disabled = false,
  showPreview = true
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Validate customer code format
  const validateCustomerCode = (code: string): boolean => {
    if (!code) return false;
    
    // Check format: CUS + 3 digits
    const pattern = /^CUS\d{3}$/;
    return pattern.test(code);
  };

  // Generate next customer code
  const generateNextCode = async () => {
    setIsGenerating(true);
    setError(null);

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
        setGeneratedCode(nextCode);
        onChange(nextCode);
        onGenerate?.(nextCode);
        setIsValid(true);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to generate customer code');
      }
    } catch (err) {
      const errorMessage = err.name === 'AbortError' 
        ? 'Request timeout: Please try again'
        : 'Network error: Unable to generate customer code';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle manual input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.toUpperCase();
    onChange(newValue);
    setIsValid(validateCustomerCode(newValue));
    setError(null);
  };

  // Validate current value
  useEffect(() => {
    if (value) {
      setIsValid(validateCustomerCode(value));
    }
  }, [value]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
        <TextField
          fullWidth
          label="Customer Code"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="CUS001"
          helperText="Format: CUS + 3 digits (e.g., CUS001, CUS002, etc.)"
          error={!!error}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {isValid && <CheckIcon color="success" sx={{ mr: 0.5 }} />}
                {error && <ErrorIcon color="error" sx={{ mr: 0.5 }} />}
              </Box>
            ),
            endAdornment: (
              <Tooltip title="Generate next customer code">
                <IconButton
                  onClick={generateNextCode}
                  disabled={disabled || isGenerating}
                  size="small"
                >
                  {isGenerating ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
              </Tooltip>
            )
          }}
        />
        
        <Button
          variant="outlined"
          startIcon={<AutoIcon />}
          onClick={generateNextCode}
          disabled={disabled || isGenerating}
          sx={{ minWidth: 120 }}
        >
          {isGenerating ? 'Generating...' : 'Auto Generate'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {showPreview && generatedCode && (
        <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon />
            <Typography variant="body2">
              Generated Code: <strong>{generatedCode}</strong>
            </Typography>
            <Chip 
              label="Auto-generated" 
              size="small" 
              color="success" 
              variant="outlined"
            />
          </Box>
        </Paper>
      )}

      {value && !isValid && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Customer code must be in format CUS000 (e.g., CUS001, CUS002, etc.)
        </Alert>
      )}
    </Box>
  );
};

export default CustomerCodeGenerator;
