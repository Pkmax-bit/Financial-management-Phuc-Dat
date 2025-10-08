/**
 * Auto-Fill Customer Code Component
 * Component đơn giản để demo auto-fill customer code
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
  Paper,
  Divider
} from '@mui/material';
import {
  AutoAwesome as AutoIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useCustomerCode } from '@/hooks/useCustomerCode';

const AutoFillCustomerCode: React.FC = () => {
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  const {
    code: customerCode,
    isValid: isCodeValid,
    isGenerating: isGeneratingCode,
    error: codeError,
    setCode: setCustomerCode,
    generateNextCode,
    clearError
  } = useCustomerCode('');

  // Auto-fill khi component mount
  useEffect(() => {
    if (isDemoMode) {
      // Simulate auto-fill after 1 second
      const timer = setTimeout(() => {
        generateNextCode();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isDemoMode, generateNextCode]);

  const handleManualInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase();
    setCustomerCode(value);
  };

  const handleAutoGenerate = () => {
    generateNextCode();
  };

  const handleDemoToggle = () => {
    setIsDemoMode(!isDemoMode);
    if (!isDemoMode) {
      generateNextCode();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AutoIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5" component="h1">
          Auto-Fill Customer Code Demo
        </Typography>
        <Chip 
          label={isDemoMode ? "Demo Mode" : "Manual Mode"} 
          color={isDemoMode ? "success" : "default"}
          size="small"
          sx={{ ml: 2 }}
        />
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {isDemoMode 
          ? "Mã khách hàng sẽ được tự động điền vào ô nhập khi tải trang"
          : "Nhập mã khách hàng thủ công hoặc sử dụng nút tự động tạo"
        }
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Mã Khách Hàng"
          value={customerCode}
          onChange={handleManualInput}
          placeholder="CUS001"
          helperText="Định dạng: CUS + 3 chữ số (ví dụ: CUS001, CUS002, CUS003...)"
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {isCodeValid && <CheckIcon color="success" sx={{ mr: 0.5 }} />}
              </Box>
            )
          }}
        />
      </Box>

      {codeError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {codeError}
        </Alert>
      )}

      {isCodeValid && customerCode && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Mã khách hàng hợp lệ: <strong>{customerCode}</strong>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={isGeneratingCode ? <CircularProgress size={20} /> : <AutoIcon />}
          onClick={handleAutoGenerate}
          disabled={isGeneratingCode}
          sx={{ flex: 1 }}
        >
          {isGeneratingCode ? 'Đang tạo...' : 'Tự động tạo mã'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleDemoToggle}
          sx={{ flex: 1 }}
        >
          {isDemoMode ? 'Chế độ thủ công' : 'Chế độ demo'}
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Hướng dẫn sử dụng:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Chế độ Demo:</strong> Mã khách hàng tự động điền khi tải trang
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Chế độ Thủ công:</strong> Nhập mã khách hàng hoặc sử dụng nút "Tự động tạo mã"
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Định dạng:</strong> CUS + 3 chữ số (CUS001, CUS002, CUS003...)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Validation:</strong> Hệ thống kiểm tra định dạng và tránh trùng lặp
        </Typography>
      </Box>
    </Paper>
  );
};

export default AutoFillCustomerCode;
