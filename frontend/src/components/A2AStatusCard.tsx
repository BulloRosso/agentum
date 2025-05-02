import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import StatusCard from './StatusCard';
import AgentTestModal from './AgentTestModal';
import { useA2AStore } from '../store/a2aStore';
import { AgentCard } from '../api/a2aApi';

const A2AStatusCard: React.FC = () => {
  const { status, agents, isLoading, error, fetchStatus } = useA2AStore();
  const [selectedAgent, setSelectedAgent] = useState<AgentCard | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Fetch A2A status when component mounts
  useEffect(() => {
    fetchStatus();
    
    // Set up polling for status updates
    const intervalId = setInterval(() => {
      fetchStatus();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  const getStatusDetails = () => {
    const details = [
      { label: 'Number of Agents', value: agents.length.toString() },
      { label: 'Last Checked', value: new Date().toLocaleTimeString() }
    ];
    
    return details;
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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No agents available
        </Typography>
      );
    }

    return (
      <List sx={{ width: '100%', mt: 1 }}>
        {agents.map((agent: AgentCard, index: number) => (
          <React.Fragment key={`agent-${index}`}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              alignItems="flex-start" 
              sx={{ px: 0 }}
              secondaryAction={
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={() => {
                    setSelectedAgent(agent);
                    setTestModalOpen(true);
                  }}
                  sx={{ mt: 1 }}
                >
                  Test Agent
                </Button>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" component="span">
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
                      variant="body2"
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
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <>
      <StatusCard
        title="A2A Server Status"
        status={status}
        isOperational={status === 'operational'}
        details={getStatusDetails()}
        error={error}
      >
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Agents
          </Typography>
          {renderAgentsList()}
        </Box>
      </StatusCard>

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