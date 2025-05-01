import React, { useEffect } from 'react';
import { Box, Grid, Typography, Alert, CircularProgress } from '@mui/material';
import StatusCard from './StatusCard';
import { useApiStore } from '../store/apiStore';

const Dashboard: React.FC = () => {
  const { 
    apiStatus, 
    apiVersion, 
    apiUptime, 
    fetchApiHealth, 
    isLoading, 
    error 
  } = useApiStore();

  useEffect(() => {
    // Initial fetch
    fetchApiHealth();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchApiHealth();
    }, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchApiHealth]);

  const formatUptime = (seconds: number): string => {
    if (!seconds) return 'Unknown';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      days > 0 ? `${days}d` : '',
      hours > 0 ? `${hours}h` : '',
      minutes > 0 ? `${minutes}m` : '',
      `${secs}s`
    ].filter(Boolean).join(' ');
  };

  if (isLoading && !apiStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading API status: {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StatusCard 
            title="API Status"
            status={apiStatus || 'Unknown'}
            isOperational={apiStatus === 'operational'}
            details={[
              { label: 'Version', value: apiVersion || 'Unknown' },
              { label: 'Uptime', value: formatUptime(apiUptime || 0) },
              { label: 'Last Checked', value: new Date().toLocaleTimeString() }
            ]}
          />
        </Grid>
        
        {/* Placeholder for future status cards */}
        <Grid item xs={12} md={6}>
          <Box 
            sx={{
              height: '100%',
              minHeight: 200,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Additional Services
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Future services status will appear here
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
