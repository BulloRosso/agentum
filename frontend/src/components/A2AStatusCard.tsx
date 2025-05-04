import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Collapse,
  Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AgentTestModal from './AgentTestModal';
import { useA2AStore } from '../store/a2aStore';
import { AgentCard } from '../api/a2aApi';

const A2AStatusCard: React.FC = () => {
  const { status, agents, isLoading, error, fetchStatus } = useA2AStore();
  const [selectedAgent, setSelectedAgent] = useState<AgentCard | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<boolean>(false);

  // Fetch A2A status when component mounts
  useEffect(() => {
    fetchStatus();
    
    // Set up polling for status updates
    const intervalId = setInterval(() => {
      fetchStatus();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  const toggleAgentsSection = () => {
    setExpandedAgents(!expandedAgents);
  };

  const renderAgentsList = () => {
    if (isLoading && agents.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (agents.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
          No agents available
        </Typography>
      );
    }

    return (
      <List dense>
        {agents.map((agent: AgentCard, index: number) => (
          <React.Fragment key={`agent-${index}`}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              secondaryAction={
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAgent(agent);
                    setTestModalOpen(true);
                  }}
                >
                  Test
                </Button>
              }
            >
              <ListItemIcon sx={{ minWidth: 36, alignSelf: 'flex-start', mt: 0.5 }}>
                <SmartToyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" component="span">
                      {agent.name}
                    </Typography>
                    {agent.version && (
                      <Chip 
                        label={`v${agent.version}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ height: 20 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      variant="caption"
                      color="text.primary"
                      component="span"
                    >
                      {agent.description}
                    </Typography>
                    
                    {agent.suggestedMessages && agent.suggestedMessages.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Suggested messages:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {agent.suggestedMessages.map((msg, i) => (
                            <Chip 
                              key={i} 
                              label={msg} 
                              size="small" 
                              sx={{ height: 24 }} 
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Capabilities:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {agent.capabilities.map((capability, i) => (
                            <Chip 
                              key={i} 
                              label={capability} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 24 }} 
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </React.Fragment>
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
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div">
              A2A Server Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <img 
                src="/img/a2a-logo.png" 
                alt="A2A Logo" 
                height="30px"
                style={{ objectFit: 'contain' }}
              />
            </Box>
          </Box>
          
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Server hosts {agents.length} agent{agents.length !== 1 ? 's' : ''}
                </Typography>
                <Chip 
                  label={status === 'operational' ? 'operational' : 'Offline'} 
                  color={status === 'operational' ? 'success' : 'error'} 
                  size="small"
                  icon={status === 'operational' ? <CheckCircleIcon /> : undefined}
                />
              </Box>
              
              {/* Agents Section */}
              <Box sx={{ mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    pb: 0.5
                  }}
                  onClick={toggleAgentsSection}
                >
                  <SmartToyIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main', mt: 0.5 }} />
                  <Typography variant="subtitle1">
                    Available Agents ({agents.length})
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  {expandedAgents ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
                
                <Collapse in={expandedAgents}>
                  {renderAgentsList()}
                </Collapse>
              </Box>
            </>
          )}
          
          {!isLoading && !status && !error && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 2 }}>
              <ErrorIcon color="warning" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Unable to connect to A2A server
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => fetchStatus()}
                startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
                disabled={isLoading}
              >
                Retry
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedAgent && (
        <AgentTestModal
          open={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          agent={selectedAgent}
        />
      )}
    </>
  );
};

export default A2AStatusCard;