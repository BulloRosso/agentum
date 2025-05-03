import * as React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Button
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import ChatIcon from '@mui/icons-material/Chat';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorIcon from '@mui/icons-material/Error';
import { useMCPStore } from '../store/mcpStore';

const MCPStatusCard: React.FC = () => {
  const { status, tools, resources, prompts, isLoading, error, fetchAll } = useMCPStore();
  
  // Local state for expand/collapse sections
  const [expandedSections, setExpandedSections] = React.useState({
    tools: false,
    resources: false,
    prompts: false
  });
  
  React.useEffect(() => {
    // Fetch data on component mount
    fetchAll();
    
    // Set up a refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchAll();
    }, 30000);
    
    // Clean up on unmount
    return () => clearInterval(refreshInterval);
  }, [fetchAll]);
  
  // Toggle expanded sections
  const toggleSection = (section: 'tools' | 'resources' | 'prompts') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          MCP Server Status
        </Typography>
        
        {isLoading && !status && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {status && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label={status.status === 'operational' ? 'Online' : 'Offline'} 
                color={status.status === 'operational' ? 'success' : 'error'} 
                size="small"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Server provides {status.tools} tools, {status.resources} resources, and {status.prompts} prompts
              </Typography>
            </Box>
            
            {/* Tools Section */}
            <Box sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  pb: 0.5
                }}
                onClick={() => toggleSection('tools')}
              >
                <BuildIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main', mt: 0.5 }} />
                <Typography variant="subtitle1">
                  Available Tools ({tools.length})
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {expandedSections.tools ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={expandedSections.tools}>
                {tools.length > 0 ? (
                  <List dense>
                    {tools.map(tool => (
                      <ListItem key={tool.name}>
                        <ListItemIcon sx={{ minWidth: 36, alignSelf: 'flex-start', mt: 0.5 }}>
                          <BuildIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={tool.name} 
                          secondary={tool.description} 
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                    No tools available
                  </Typography>
                )}
              </Collapse>
            </Box>
            
            {/* Resources Section */}
            <Box sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  pb: 0.5
                }}
                onClick={() => toggleSection('resources')}
              >
                <DescriptionIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main', mt: 0.5 }} />
                <Typography variant="subtitle1">
                  Available Resources ({resources.length})
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {expandedSections.resources ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={expandedSections.resources}>
                {resources.length > 0 ? (
                  <List dense>
                    {resources.map(resource => (
                      <ListItem key={resource.name}>
                        <ListItemIcon sx={{ minWidth: 36, alignSelf: 'flex-start', mt: 0.5 }}>
                          <DescriptionIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={resource.name} 
                          secondary={resource.description} 
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                    No resources available
                  </Typography>
                )}
              </Collapse>
            </Box>
            
            {/* Prompts Section */}
            <Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  pb: 0.5
                }}
                onClick={() => toggleSection('prompts')}
              >
                <ChatIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main', mt: 0.5 }} />
                <Typography variant="subtitle1">
                  Available Prompts ({prompts.length})
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {expandedSections.prompts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={expandedSections.prompts}>
                {prompts.length > 0 ? (
                  <List dense>
                    {prompts.map(prompt => (
                      <ListItem key={prompt.name}>
                        <ListItemIcon sx={{ minWidth: 36, alignSelf: 'flex-start', mt: 0.5 }}>
                          <ChatIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={prompt.name} 
                          secondary={prompt.description} 
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                    No prompts available
                  </Typography>
                )}
              </Collapse>
            </Box>
          </>
        )}
        
        {!isLoading && !status && !error && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 2 }}>
            <ErrorIcon color="warning" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Unable to connect to MCP server
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => fetchAll()}
              startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
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

export default MCPStatusCard;