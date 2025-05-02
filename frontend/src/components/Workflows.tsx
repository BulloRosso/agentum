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
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useWorkflowStore } from '../store/workflowStore';

const Workflows: React.FC = () => {
  const { workflows, isLoading, error, fetchWorkflows } = useWorkflowStore();
  const [expandedWorkflows, setExpandedWorkflows] = useState<boolean>(true);

  // Fetch workflows when component mounts - no auto-refresh
  useEffect(() => {
    fetchWorkflows();
    // Auto-refresh has been disabled as requested
  }, [fetchWorkflows]);

  const toggleWorkflowsSection = () => {
    setExpandedWorkflows(!expandedWorkflows);
  };

  const renderWorkflowsList = () => {
    if (isLoading && workflows.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (workflows.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
          No workflows available
        </Typography>
      );
    }

    return (
      <List dense>
        {workflows.map((workflow, index) => (
          <React.Fragment key={`workflow-${workflow.id || index}`}>
            {index > 0 && <Divider component="li" />}
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <AccountTreeIcon 
                  fontSize="small" 
                  color={workflow.active ? "success" : "disabled"}
                />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" component="span">
                      {workflow.name}
                    </Typography>
                    <Chip 
                      label={workflow.active ? "active" : "inactive"} 
                      size="small" 
                      color={workflow.active ? "success" : "default"}
                      icon={workflow.active ? <PlayArrowIcon sx={{ fontSize: '0.8rem' }} /> : <PauseIcon sx={{ fontSize: '0.8rem' }} />}
                      variant="outlined" 
                      sx={{ height: 20 }}
                    />
                  </Box>
                }
                secondary={
                  workflow.tags && workflow.tags.length > 0 ? (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tags:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {workflow.tags.map((tag, i) => (
                          <Chip 
                            key={i} 
                            label={tag.name} 
                            size="small" 
                            variant="outlined"
                            sx={{ height: 24 }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : null
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
          Workflows (n8n)
        </Typography>
        
        {isLoading && workflows.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!isLoading || workflows.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} available
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => fetchWorkflows()}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
              >
                Refresh
              </Button>
            </Box>
            
            {/* Workflows Section */}
            <Box sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  pb: 0.5
                }}
                onClick={toggleWorkflowsSection}
              >
                <AccountTreeIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                <Typography variant="subtitle1">
                  Workflow List ({workflows.length})
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {expandedWorkflows ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={expandedWorkflows}>
                {renderWorkflowsList()}
              </Collapse>
            </Box>
          </>
        ) : null}
        
        {!isLoading && workflows.length === 0 && !error && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No workflows found
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => fetchWorkflows()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default Workflows;