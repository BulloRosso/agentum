import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';
import AgentCardModal from './AgentCardModal';

// Using the same interface structure from AgentCard.tsx
interface AgentData {
  name: string;
  description: string;
  url: string;
  provider?: {
    organization: string;
    url: string;
  };
  version: string;
  documentationUrl?: string;
  capabilities: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  authentication: {
    schemes: string[];
    credentials?: string;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples?: string[];
    inputModes?: string[];
    outputModes?: string[];
  }[];
}

interface RemoteHost {
  url: string;
  agents: AgentData[];
}

const A2ARemoteAgentsCard: React.FC = () => {
  const [remoteHosts, setRemoteHosts] = useState<RemoteHost[]>([]);
  const [remoteHostInput, setRemoteHostInput] = useState<string>('');
  const [expandedHosts, setExpandedHosts] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Load saved remote hosts from localStorage on component mount
  useEffect(() => {
    const savedHostsJSON = localStorage.getItem('a2a_remote_hosts');
    if (savedHostsJSON) {
      try {
        const savedHosts = JSON.parse(savedHostsJSON);
        setRemoteHosts(savedHosts);
        
        // Initialize expanded state for all hosts
        const expandedState: {[key: string]: boolean} = {};
        savedHosts.forEach((host: RemoteHost) => {
          expandedState[host.url] = true; // Default to expanded
        });
        setExpandedHosts(expandedState);
      } catch (e) {
        console.error('Error parsing saved hosts:', e);
        setError('Failed to load saved remote hosts');
      }
    }
  }, []);

  // Save to localStorage whenever remoteHosts change
  useEffect(() => {
    if (remoteHosts.length > 0) {
      localStorage.setItem('a2a_remote_hosts', JSON.stringify(remoteHosts));
    }
  }, [remoteHosts]);

  const validateUrl = (url: string): string => {
    // Make sure URL has http:// or https:// prefix
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const connectToRemoteHost = async () => {
    if (!remoteHostInput.trim()) return;
    
    const validatedUrl = validateUrl(remoteHostInput.trim());
    
    // Check if already added
    if (remoteHosts.some(host => host.url === validatedUrl)) {
      setError(`Host ${validatedUrl} is already added`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add trailing slash if not present to ensure path is properly joined
      const baseUrl = validatedUrl.endsWith('/') ? validatedUrl : `${validatedUrl}/`;
      const response = await axios.get(`${baseUrl}.well-known/agent.json`);
      
      if (response.data) {
        const newHost: RemoteHost = {
          url: validatedUrl,
          agents: Array.isArray(response.data) ? response.data : [response.data]
        };
        
        // Sort agents alphabetically by name
        newHost.agents.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add to hosts array
        setRemoteHosts(prev => [...prev, newHost]);
        
        // Set this host as expanded by default
        setExpandedHosts(prev => ({...prev, [validatedUrl]: true}));
        
        // Clear input
        setRemoteHostInput('');
      } else {
        setError('Invalid response from remote host');
      }
    } catch (error) {
      console.error('Error connecting to remote host:', error);
      setError('Failed to connect to remote host. Ensure the URL is correct and the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHostSection = (url: string) => {
    setExpandedHosts(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  const openAgentCardModal = (agent: AgentData) => {
    setSelectedAgent(agent);
    setModalOpen(true);
  };

  const closeAgentCardModal = () => {
    setModalOpen(false);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          A2A Remote Agents
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 3, gap: 1 }}>
          <TextField
            label="Remote Host"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="https://agenthost.abc.com"
            value={remoteHostInput}
            onChange={(e) => setRemoteHostInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                connectToRemoteHost();
              }
            }}
          />
          <Button 
            variant="contained" 
            onClick={connectToRemoteHost}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Connect'}
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {remoteHosts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No remote hosts connected. Add a remote host to view available agents.
          </Typography>
        ) : (
          <>
            <Divider sx={{ my: 2 }} />
            {remoteHosts.map((host) => (
              <Box key={host.url} sx={{ mb: 2 }}>
                <Box
                  onClick={() => toggleHostSection(host.url)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    py: 1
                  }}
                >
                  <Typography variant="subtitle1">
                    Remote Agents ({host.agents.length})
                  </Typography>
                  {expandedHosts[host.url] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
                
                <Collapse in={expandedHosts[host.url]} timeout="auto">
                  <List dense>
                    {host.agents.map((agent, index) => (
                      <React.Fragment key={`${host.url}-${agent.name}-${index}`}>
                        <ListItem
                          secondaryAction={
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openAgentCardModal(agent)}
                            >
                              Agent Card
                            </Button>
                          }
                        >
                          <ListItemText
                            primary={agent.name}
                            secondary={agent.description}
                          />
                        </ListItem>
                        {index < host.agents.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ))}
          </>
        )}
      </CardContent>
      
      <AgentCardModal
        open={modalOpen}
        onClose={closeAgentCardModal}
        agent={selectedAgent}
      />
    </Card>
  );
};

export default A2ARemoteAgentsCard;