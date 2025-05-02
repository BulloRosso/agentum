import React, { useEffect } from 'react';
import { Box, Grid, Alert, CircularProgress } from '@mui/material';
import A2AStatusCard from './A2AStatusCard';
import MCPStatusCard from './MCPStatusCardFixed';
import APIStatusCard from './APIStatusCard';
import { useApiStore } from '../store/apiStore';
import { useA2AStore } from '../store/a2aStore';
import { useMCPStore } from '../store/mcpStore';

const Dashboard: React.FC = () => {
  const { 
    apiStatus, 
    fetchApiHealth, 
    fetchApiMethods,
    isLoading, 
    error 
  } = useApiStore();
  
  const { fetchStatus } = useA2AStore();
  const { fetchAll: fetchMCPStatus } = useMCPStore();

  useEffect(() => {
    // Initial fetch
    fetchApiHealth();
    fetchApiMethods();
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
  }, [fetchApiHealth, fetchApiMethods, fetchStatus, fetchMCPStatus]);

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
          <APIStatusCard />
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
