import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Using the interface from the attached assets
interface AgentCardProps {
  agent: {
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
  };
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const [expandedSkills, setExpandedSkills] = React.useState<boolean>(false);

  const toggleSkillsSection = () => {
    setExpandedSkills(!expandedSkills);
  };

  const renderCapabilityIcon = (capability: boolean | undefined) => {
    // Handle case where capability might be undefined or not a boolean
    if (capability === undefined || capability === null || typeof capability !== 'boolean') {
      return '⚪';
    }
    return capability ? '🟢' : '⚪';
  };

  return (
    <Card sx={{ width: '100%', mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          {agent.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {agent.description}
        </Typography>
        
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" component="div">
            Version: {agent.version}
          </Typography>
          
          {agent.provider && (
            <Typography variant="body2" component="div">
              Provider: {agent.provider.organization} 
              {agent.provider.url && (
                <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                  <a href={agent.provider.url} target="_blank" rel="noopener noreferrer">
                    ({agent.provider.url})
                  </a>
                </Typography>
              )}
            </Typography>
          )}
          
          {agent.documentationUrl && (
            <Typography variant="body2" component="div">
              <a href={agent.documentationUrl} target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" component="div" gutterBottom>
          Capabilities
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            icon={<span>{renderCapabilityIcon(agent.capabilities?.streaming)}</span>}
            label="Streaming" 
            variant="outlined"
          />
          <Chip 
            icon={<span>{renderCapabilityIcon(agent.capabilities?.pushNotifications)}</span>}
            label="Push Notifications" 
            variant="outlined"
          />
          <Chip 
            icon={<span>{renderCapabilityIcon(agent.capabilities?.stateTransitionHistory)}</span>}
            label="State Transition History" 
            variant="outlined"
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" component="div" gutterBottom>
          Authentication
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" component="div">
            Schemes: {agent.authentication?.schemes && Array.isArray(agent.authentication.schemes) 
              ? agent.authentication.schemes.join(', ') 
              : 'None specified'}
          </Typography>
          {agent.authentication?.credentials && (
            <Typography variant="body2" component="div">
              Credentials: {agent.authentication.credentials}
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" component="div" gutterBottom>
          Supported Formats
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" component="div">
            Input: {agent.defaultInputModes && Array.isArray(agent.defaultInputModes) 
              ? agent.defaultInputModes.join(', ') 
              : 'None specified'}
          </Typography>
          <Typography variant="body2" component="div">
            Output: {agent.defaultOutputModes && Array.isArray(agent.defaultOutputModes) 
              ? agent.defaultOutputModes.join(', ') 
              : 'None specified'}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box
          onClick={toggleSkillsSection}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            py: 1
          }}
        >
          <Typography variant="subtitle1" component="div">
            Skills ({agent.skills && Array.isArray(agent.skills) ? agent.skills.length : 0})
          </Typography>
          {expandedSkills ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        
        <Collapse in={expandedSkills} timeout="auto">
          {agent.skills && Array.isArray(agent.skills) && agent.skills.length > 0 ? (
            <List dense>
              {agent.skills.map((skill) => (
                <React.Fragment key={skill.id || `skill-${Math.random()}`}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={skill.name || 'Unnamed Skill'}
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span" color="text.primary">
                            {skill.description || 'No description provided'}
                          </Typography>
                          
                          {skill.tags && Array.isArray(skill.tags) && skill.tags.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {skill.tags.map((tag) => (
                                <Chip key={tag} label={tag} size="small" />
                              ))}
                            </Box>
                          )}
                          
                          {skill.examples && Array.isArray(skill.examples) && skill.examples.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" component="div">
                                Examples:
                              </Typography>
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {skill.examples.map((example, idx) => (
                                  <li key={idx}>
                                    <Typography variant="body2">{example}</Typography>
                                  </li>
                                ))}
                              </ul>
                            </Box>
                          )}
                          
                          {(skill.inputModes || skill.outputModes) && (
                            <Box sx={{ mt: 1 }}>
                              {skill.inputModes && Array.isArray(skill.inputModes) && (
                                <Typography variant="body2" component="div">
                                  Input: {skill.inputModes.join(', ')}
                                </Typography>
                              )}
                              {skill.outputModes && Array.isArray(skill.outputModes) && (
                                <Typography variant="body2" component="div">
                                  Output: {skill.outputModes.join(', ')}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No skills available
            </Typography>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AgentCard;