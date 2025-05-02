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
import { AgentCard } from '../api/a2aApi';
import { A2AClient } from '../utils/A2AClient';
import { MessagePart, MessageTextPart, TaskState } from '../utils/A2ASchema';

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
      // Create a new A2A client
      const client = new A2AClient('/.well-known');

      // Generate a random task ID
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Send the task to the agent
      const task = await client.sendTask({
        id: taskId,
        message: {
          role: 'user',
          parts: [
            {
              type: 'text',
              text: message
            }
          ]
        }
      });

      if (task && task.status && task.status.state === 'succeeded' as TaskState) {
        // If the task succeeded, show the response
        const responseText = task.status.output?.parts
          ?.filter((part: MessagePart) => part.type === 'text')
          .map((part: MessageTextPart) => part.text)
          .join('\n');
          
        setResponse(responseText || 'No text response received');
      } else if (task && task.status && task.status.state === 'failed' as TaskState) {
        // If the task failed, show the error
        setError(`Task failed: ${task.status.error?.message || 'Unknown error'}`);
      } else {
        // If the task is still in progress or in an unknown state
        setError('Task did not complete or returned in an unexpected state');
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