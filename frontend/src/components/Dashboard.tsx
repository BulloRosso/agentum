import React, { useEffect } from 'react';
import { Box, Grid, Alert, CircularProgress } from '@mui/material';
import StatusCard from './StatusCard';
import A2AStatusCard from './A2AStatusCard';
import MCPStatusCard from './MCPStatusCard';
import { useApiStore } from '../store/apiStore';
import { useA2AStore } from '../store/a2aStore';
import { useMCPStore } from '../store/mcpStore';

const Dashboard: React.FC = () => {
  const { 
    apiStatus, 
    apiVersion, 
    apiUptime, 
    fetchApiHealth, 
    isLoading, 
    error 
  } = useApiStore();
  
  const { fetchStatus } = useA2AStore();
  const { fetchAll: fetchMCPStatus } = useMCPStore();

  useEffect(() => {
    // Initial fetch
    fetchApiHealth();
    fetchStatus();
    fetchMCPStatus();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchApiHealth();
      fetchStatus();
      fetchMCPStatus();
    }, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchApiHealth, fetchStatus, fetchMCPStatus]);

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
        
        {/* A2A Server Status */}
        <Grid item xs={12} md={6}>
          <A2AStatusCard />
        </Grid>
        
        {/* MCP Server Status */}
        <Grid item xs={12}>
          <MCPStatusCard />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
