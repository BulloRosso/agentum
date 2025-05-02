import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Collapse,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useApiStore } from '../store/apiStore';
import { APIMethod } from '../api/healthApi';

const APIStatusCard = () => {
  const { 
    apiStatus, 
    apiVersion, 
    apiUptime,
    apiMethods, 
    fetchApiHealth,
    fetchApiMethods,
    isLoading, 
    error 
  } = useApiStore();
  
  const [expandedMethods, setExpandedMethods] = useState(false);
  
  useEffect(() => {
    // Fetch API methods when component mounts
    fetchApiMethods();
  }, [fetchApiMethods]);
  
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

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          API Status
        </Typography>
        
        {isLoading && !apiStatus && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {apiStatus && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                API version {apiVersion} • uptime {formatUptime(apiUptime || 0)}
              </Typography>
              <Chip 
                label={apiStatus === 'operational' ? 'operational' : 'Offline'} 
                color={apiStatus === 'operational' ? 'success' : 'error'} 
                size="small"
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* API Documentation Link */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <a href="/api/api/doc" target="_blank" rel="noopener noreferrer">
                  View API Documentation
                </a>
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* API Methods Section */}
            <Box sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  pb: 0.5
                }}
                onClick={() => setExpandedMethods(!expandedMethods)}
              >
                <Typography variant="subtitle1">
                  Available Methods ({apiMethods.length})
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" onClick={() => setExpandedMethods(!expandedMethods)}>
                  {expandedMethods ? 'Hide' : 'Show'}
                </Button>
              </Box>
              
              <Collapse in={expandedMethods}>
                {apiMethods.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No API methods available
                  </Typography>
                ) : (
                  <List dense>
                    {apiMethods.map((method: APIMethod, index: number) => (
                      <ListItem key={`method-${index}`} divider={index < apiMethods.length - 1}>
                        <ListItemText
                          primary={`${method.method} ${method.path}`}
                          secondary={method.description || method.summary || 'No description'}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Collapse>
            </Box>
          </>
        )}
        
        {!isLoading && !apiStatus && !error && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Unable to connect to API
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => fetchApiHealth()}
              disabled={isLoading}
            >
              Retry
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default APIStatusCard;