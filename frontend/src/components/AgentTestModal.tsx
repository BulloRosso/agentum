import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import { AgentCard, testAgent } from '../api/a2aApi';

interface AgentTestModalProps {
  open: boolean;
  onClose: () => void;
  agent: AgentCard;
}

const AgentTestModal: React.FC<AgentTestModalProps> = ({ open, onClose, agent }) => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Send the task to the agent using our testAgent function
      const task = await testAgent(message);
      
      // Extract the message from the agent's response
      if (task && task.status) {
        // Check the state of the task using an equality check
        const state = task.status.state as string;
        
        if (state === 'completed' || state === 'succeeded') {
          // If the task succeeded, show the response message
          if (task.status.message && task.status.message.parts) {
            const responseText = task.status.message.parts
              .map(part => (part as any).text || '')
              .join('\n');
            
            setResponse(responseText || 'No text response received');
          } else {
            setResponse('No response message received');
          }
        } else if (state === 'failed') {
          // If the task failed, show the error
          setError(`Task failed: ${task.status.error?.message || 'Unknown error'}`);
        } else {
          // If the task is still in progress or in an unknown state
          setError(`Task did not complete. Current state: ${state}`);
        }
      } else {
        setError('Invalid response from agent');
      }
    } catch (err) {
      console.error('Error testing agent:', err);
      setError(`Error testing agent: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <DialogTitle>
        Test Agent: {agent.name}
        {agent.version && <Typography variant="caption" sx={{ ml: 1 }}>v{agent.version}</Typography>}
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Send a message to test the agent's functionality
        </Typography>
        
        {agent.description && (
          <Typography variant="body2" paragraph>
            {agent.description}
          </Typography>
        )}
        
        {agent.suggestedMessages && agent.suggestedMessages.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Suggested Messages:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {agent.suggestedMessages.map((msg, idx) => (
                <Button 
                  key={idx}
                  variant="outlined" 
                  size="small" 
                  onClick={() => setMessage(msg)}
                  disabled={loading}
                >
                  {msg}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        
        <TextField
          label="Message"
          multiline
          rows={4}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          variant="outlined"
          placeholder="Enter your message here..."
          error={!!error && !message.trim()}
          helperText={error && !message.trim() ? error : ''}
          sx={{ mb: 3 }}
        />
        
        <Typography variant="subtitle2" gutterBottom>
          Response
        </Typography>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            minHeight: 150, 
            maxHeight: 300, 
            overflowY: 'auto',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: loading ? 'center' : 'flex-start',
            justifyContent: loading ? 'center' : 'flex-start'
          }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : response ? (
            <Typography 
              variant="body2" 
              component="pre" 
              sx={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                m: 0
              }}
            >
              {response}
            </Typography>
          ) : error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Response will appear here after testing
            </Typography>
          )}
        </Paper>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button 
          onClick={handleTest} 
          variant="contained" 
          color="primary" 
          disabled={loading || !message.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Testing...' : 'Test Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgentTestModal;