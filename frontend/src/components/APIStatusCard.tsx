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
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { Api as ApiIcon } from '@mui/icons-material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Error as ErrorIcon } from '@mui/icons-material';
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
  
  const toggleMethodsSection = () => {
    setExpandedMethods(!expandedMethods);
  };
  
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
  
  const renderMethodsList = () => {
    if (apiMethods.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
          No API methods available
        </Typography>
      );
    }
    
    return (
      <List dense>
        {apiMethods.map((method: APIMethod, index: number) => (
          <React.Fragment key={`method-${index}`}>
            {index > 0 && <Divider component="li" />}
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ApiIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
                      {method.method}
                    </Typography>
                    <Typography variant="body2" component="span">
                      {method.path}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="span"
                  >
                    {method.description || method.summary || 'No description'}
                  </Typography>
                }
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          API Server Status
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
                icon={apiStatus === 'operational' ? <CheckCircleIcon /> : <ErrorIcon />}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* API Methods Section */}
            <Box sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  pb: 0.5
                }}
                onClick={toggleMethodsSection}
              >
                <ApiIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                <Typography variant="subtitle1">
                  Available Methods ({apiMethods.length})
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {expandedMethods ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={expandedMethods}>
                {renderMethodsList()}
              </Collapse>
            </Box>
          </>
        )}
        
        {!isLoading && !apiStatus && !error && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 2 }}>
            <ErrorIcon color="warning" sx={{ mb: 1 }} />
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