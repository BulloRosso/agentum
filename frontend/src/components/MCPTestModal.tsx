import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import mcpClient, {
  MCPTool,
  MCPToolArguments,
  MCPResource,
  MCPPrompt,
  MCPPromptArguments,
  MCPToolResult,
  MCPPromptResult,
} from '../utils/mcp-client';

enum TestType {
  TOOL = 'tool',
  RESOURCE = 'resource',
  PROMPT = 'prompt'
}

interface MCPTestModalProps {
  open: boolean;
  onClose: () => void;
  testType: TestType;
  tool?: MCPTool;
  resource?: MCPResource;
  prompt?: MCPPrompt;
}

const MCPTestModal: React.FC<MCPTestModalProps> = ({
  open,
  onClose,
  testType,
  tool,
  resource,
  prompt,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (testType === TestType.TOOL && tool) {
      // Check if all required fields are filled
      for (const field of tool.inputSchema.required) {
        if (!formValues[field] || formValues[field].trim() === '') {
          setError(`Field '${field}' is required`);
          return false;
        }
      }
    } else if (testType === TestType.PROMPT && prompt) {
      // Check if all required arguments are filled
      for (const arg of prompt.arguments) {
        if (arg.required && (!formValues[arg.name] || formValues[arg.name].trim() === '')) {
          setError(`Argument '${arg.name}' is required`);
          return false;
        }
      }
    }
    return true;
  };

  // This function used to download content as a file
  // Now using downloadBlob instead

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (testType === TestType.TOOL && tool) {
        const args: MCPToolArguments = {};
        for (const key in tool.inputSchema.properties) {
          if (formValues[key]) {
            args[key] = formValues[key];
          }
        }
        const toolResult = await mcpClient.callTool(tool.name, args);
        setResult(toolResult);
      } else if (testType === TestType.RESOURCE && resource) {
        const resourceResult = await mcpClient.getResource(resource.name);
        setResult(resourceResult);
      } else if (testType === TestType.PROMPT && prompt) {
        const args: MCPPromptArguments = {};
        for (const arg of prompt.arguments) {
          if (formValues[arg.name]) {
            args[arg.name] = formValues[arg.name];
          }
        }
        const promptResult = await mcpClient.getPrompt(prompt.name, args);
        setResult(promptResult);
      }
    } catch (err) {
      console.error('Error during MCP test:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResourceDownload = async () => {
    if (!resource) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await mcpClient.downloadResource(resource.name);
      downloadBlob(blob, resource.name + getExtensionFromMimeType(resource.mimeType));
    } catch (err) {
      console.error('Error downloading resource:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getExtensionFromMimeType = (mimeType: string): string => {
    switch (mimeType) {
      case 'text/plain':
        return '.txt';
      case 'application/json':
        return '.json';
      case 'text/html':
        return '.html';
      case 'image/png':
        return '.png';
      case 'image/jpeg':
        return '.jpg';
      default:
        return '';
    }
  };

  const renderFormFields = () => {
    if (testType === TestType.TOOL && tool) {
      return Object.entries(tool.inputSchema.properties).map(([key, prop]) => (
        <TextField
          key={key}
          label={`${key}${tool.inputSchema.required.includes(key) ? ' *' : ''}`}
          fullWidth
          margin="dense"
          value={formValues[key] || ''}
          onChange={(e) => handleInputChange(key, e.target.value)}
          helperText={prop.description}
          required={tool.inputSchema.required.includes(key)}
        />
      ));
    } else if (testType === TestType.PROMPT && prompt) {
      return prompt.arguments.map((arg) => (
        <TextField
          key={arg.name}
          label={`${arg.name}${arg.required ? ' *' : ''}`}
          fullWidth
          margin="dense"
          value={formValues[arg.name] || ''}
          onChange={(e) => handleInputChange(arg.name, e.target.value)}
          helperText={arg.description}
          required={arg.required}
        />
      ));
    }
    return null;
  };

  const renderResult = () => {
    if (!result) return null;

    if (testType === TestType.TOOL) {
      return (
        <Box>
          <Typography variant="h6">Tool Result:</Typography>
          {(result as MCPToolResult).map((item, index) => (
            <Paper key={index} elevation={1} sx={{ p: 2, my: 1 }}>
              {item.type === 'text' && (
                <Typography whiteSpace="pre-wrap">
                  {item.text}
                </Typography>
              )}
              {item.type === 'image' && item.url && (
                <Box>
                  <img
                    src={item.url}
                    alt={item.alt || 'Tool result image'}
                    style={{ maxWidth: '100%' }}
                  />
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      );
    } else if (testType === TestType.RESOURCE) {
      return (
        <Box>
          <Typography variant="h6">Resource Content:</Typography>
          <Paper elevation={1} sx={{ p: 2, my: 1, maxHeight: '400px', overflow: 'auto' }}>
            {typeof result === 'string' ? (
              <Typography whiteSpace="pre-wrap">{result}</Typography>
            ) : (
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result, null, 2)}
              </Typography>
            )}
          </Paper>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={handleResourceDownload}
            sx={{ mt: 1 }}
          >
            Download Resource
          </Button>
        </Box>
      );
    } else if (testType === TestType.PROMPT) {
      return (
        <Box>
          <Typography variant="h6">Prompt Result:</Typography>
          <List>
            {(result as MCPPromptResult).map((message, index) => (
              <ListItem key={index} alignItems="flex-start">
                <Paper elevation={1} sx={{ p: 2, width: '100%' }}>
                  <ListItemText
                    primary={`${message.role.charAt(0).toUpperCase() + message.role.slice(1)}:`}
                    secondary={
                      <Typography whiteSpace="pre-wrap">
                        {message.content.text}
                      </Typography>
                    }
                  />
                </Paper>
              </ListItem>
            ))}
          </List>
        </Box>
      );
    }
    return null;
  };

  const getTitle = () => {
    if (testType === TestType.TOOL && tool) {
      return `Test Tool: ${tool.name}`;
    } else if (testType === TestType.RESOURCE && resource) {
      return `View Resource: ${resource.name}`;
    } else if (testType === TestType.PROMPT && prompt) {
      return `Test Prompt: ${prompt.name}`;
    }
    return 'MCP Test';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {getTitle()}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {testType === TestType.TOOL && tool && (
          <Typography variant="body2" gutterBottom>
            {tool.description}
          </Typography>
        )}
        {testType === TestType.RESOURCE && resource && (
          <Typography variant="body2" gutterBottom>
            {resource.description} ({resource.mimeType})
          </Typography>
        )}
        {testType === TestType.PROMPT && prompt && (
          <Typography variant="body2" gutterBottom>
            {prompt.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {testType !== TestType.RESOURCE && renderFormFields()}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          result && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              {renderResult()}
            </Box>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {testType === TestType.RESOURCE ? (
          <Button 
            onClick={handleResourceDownload} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Download
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Execute
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export { TestType };
export default MCPTestModal;