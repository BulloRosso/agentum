import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Button,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Mic as MicIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Define a type for chat messages
interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  files?: string[]; // Optional list of file names
}

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  apiEndpoint?: string; // Optional chat API endpoint
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose, apiEndpoint }) => {
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I\'m your AI assistant. How can I help you today?\n\nI can understand **markdown** formatting, including:\n- Bullet lists\n- *Italic* and **bold** text\n- `inline code`\n- [Links](https://www.example.com)\n\n```javascript\n// Code blocks with syntax highlighting\nfunction example() {\n  return "Hello World!";\n}\n```',
      timestamp: new Date()
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load session ID from localStorage when component mounts
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    } else {
      // Generate a random session ID if none exists
      const newSessionId = `session_${Date.now()}`;
      localStorage.setItem('chatSessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Set up marked options once at component initialization
  React.useEffect(() => {
    marked.setOptions({
      gfm: true,       // GitHub Flavored Markdown
      breaks: true,    // Convert newlines to <br>
    });
  }, []);

  // Markdown rendering function
  const renderMarkdown = (text: string): string => {
    try {
      // Use marked to parse markdown to HTML
      const html = marked(text);
      // Sanitize to prevent XSS attacks
      return typeof html === 'string' ? DOMPurify.sanitize(html) : text;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return text; // Fallback to plain text if there's an error
    }
  };

  // Scroll to bottom of chat when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date(),
      files: selectedFiles.length > 0 ? selectedFiles.map(file => file.name) : undefined
    };

    const userMessageContent = message; // Store message before clearing input
    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // If apiEndpoint is available, use it, otherwise fall back to simulation
    if (apiEndpoint && apiEndpoint.trim() !== '') {
      try {
        console.log(`Sending message to API endpoint: ${apiEndpoint}`);
        
        // Create the request payload in the specified JSON format
        const requestPayload = {
          sessionId: sessionId,
          action: "sendMessage",
          chatInput: userMessageContent
        };

        console.log('Sending payload:', requestPayload);

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        // Get the response data
        const responseData = await response.json();
        console.log('API response:', responseData);
        
        // Default response text
        let responseText = "Sorry, I couldn't process your request.";
        
        // Simple direct approach - check if the API returned a response field directly
        if (responseData && responseData.response) {
          // Use the response directly if it's in the expected format
          responseText = responseData.response;
          console.log('Direct response found:', responseText);
        } 
        // If the response is in the wrapped format: [{"output": "{"response":"message text"}"}]
        else if (Array.isArray(responseData) && responseData.length > 0) {
          try {
            if (responseData[0].output) {
              console.log('Output from API:', responseData[0].output);
              
              // If output is a string containing JSON
              if (typeof responseData[0].output === 'string') {
                const parsedOutput = JSON.parse(responseData[0].output);
                if (parsedOutput && parsedOutput.response) {
                  responseText = parsedOutput.response;
                  console.log('Parsed nested response:', responseText);
                }
              } 
              // If output is already an object
              else if (typeof responseData[0].output === 'object' && responseData[0].output.response) {
                responseText = responseData[0].output.response;
                console.log('Used object response:', responseText);
              }
            }
          } catch (error) {
            console.error('Error processing API response:', error);
          }
        }
        
        // Reset selected files after successful upload
        setSelectedFiles([]);
        
        // Create the bot message with the parsed response
        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'bot',
          text: responseText,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error calling chat API:', error);
        
        // Reset selected files on error
        setSelectedFiles([]);
        
        // Show error as a bot message
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `**Error:** Could not connect to the chat API at \`${apiEndpoint}\`. Please check the endpoint URL in settings.`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      // Simulate bot response (fallback for demo purposes)
      setTimeout(() => {
        // Create a more interesting response that shows markdown capabilities
        const responseText = `This is a simulated response to "${userMessageContent}".\n\n` +
          `You can also try sending markdown in your messages:\n` +
          `- Use **bold** or *italic* text\n` +
          `- Create bullet lists\n` +
          `- Add \`inline code\` or code blocks:\n\n` +
          "```javascript\n" +
          "// Example code\n" +
          "function sayHello() {\n" +
          "  console.log('Hello world!');\n" +
          "}\n" +
          "```\n\n" +
          "To connect to an actual API, set the Chat API endpoint in the menu settings." +
          (selectedFiles.length > 0 ? `\n\nReceived ${selectedFiles.length} file(s): ${selectedFiles.map(f => f.name).join(', ')}` : "");
        
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: responseText,
          timestamp: new Date()
        };
        
        // Reset selected files after simulation
        setSelectedFiles([]);
        
        setMessages(prev => [...prev, botMessage]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would use the Web Speech API
    // or a similar library to handle voice recording
    if (!isRecording) {
      // Start recording
      console.log('Started recording');
    } else {
      // Stop recording and process
      console.log('Stopped recording');
      // Simulate voice transcription
      setTimeout(() => {
        const transcribedText = "This is simulated voice transcription.";
        setMessage(transcribedText);
      }, 1000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array and store the files
      const fileArray = Array.from(files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
      
      // Create a message showing the selected files
      const fileNames = fileArray.map(file => file.name).join(', ');
      const fileCountText = fileArray.length === 1 
        ? 'Selected 1 file' 
        : `Selected ${fileArray.length} files`;
      
      // Add a message showing the file(s) selected
      const fileMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: `${fileCountText}: ${fileNames}`,
        timestamp: new Date(),
        files: fileArray.map(file => file.name)
      };
      
      setMessages(prev => [...prev, fileMessage]);
      
      // Clear the file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // If API is not configured, show a simulated response
      if (!apiEndpoint || apiEndpoint.trim() === '') {
        setTimeout(() => {
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: `**Files selected:** \`${fileNames}\`\n\nFiles are ready to be sent with your next message. Type a message and click Send to submit both the message and files.\n\nTo connect to a real API for processing, set the Chat API endpoint in the menu settings.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
        }, 1000);
      }
    }
  };
  
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: '80%', maxWidth: '1000px' }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          py: 1, 
          px: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" fontWeight="bold">
              PoC Chatbot
            </Typography>
          </Box>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={onClose} 
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Chat Messages */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 1.5,
          backgroundColor: '#f5f5f5',
        }}>
          <List sx={{ width: '100%' }}>
            {messages.map((msg) => (
              <Fade in={true} key={msg.id} timeout={500}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    mb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      width: '100%',
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40, mt: 0 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: msg.sender === 'user' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {msg.sender === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                      </Avatar>
                    </ListItemAvatar>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        paddingTop: 0,
                        paddingBottom: '6px',
                        marginRight: '10px',
                        maxWidth: 'calc(100% - 50px)',
                        backgroundColor: msg.sender === 'user' ? '#f7f0dd' : 'white',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        component="div"
                        className="markdown-content"
                        sx={{
                          wordBreak: 'break-word',
                        }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                      />
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          display: 'block', 
                          textAlign: msg.sender === 'user' ? 'right' : 'left',
                          mt: 0.5 
                        }}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                  </Box>
                </ListItem>
              </Fade>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              color={isRecording ? 'error' : 'default'} 
              onClick={toggleRecording}
              sx={{ mr: 1 }}
            >
              <MicIcon />
            </IconButton>
            <IconButton 
              color="default" 
              onClick={() => fileInputRef.current?.click()}
              sx={{ mr: 1 }}
            >
              <AttachFileIcon />
            </IconButton>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ mr: 1 }}
              InputProps={{
                sx: { borderRadius: 4, py: 1 }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={message.trim() === ''}
              sx={{ borderRadius: 4, px: 3, py: 1.5 }}
            >
              Send
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              multiple
            />
          </Box>
          
          {/* Session ID and API Endpoint Info */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mt: 2,
              pt: 2,
              borderTop: '1px dashed rgba(0, 0, 0, 0.12)'
            }}
          >
            <TextField
              size="small"
              label="Session ID"
              value={sessionId}
              onChange={(e) => {
                const newSessionId = e.target.value;
                setSessionId(newSessionId);
                localStorage.setItem('chatSessionId', newSessionId);
              }}
              sx={{ 
                width: '180px',
                '& .MuiInputBase-input': { 
                  fontSize: '0.75rem',
                  py: 0.5
                }
              }}
            />
            {apiEndpoint && (
              <Box sx={{ ml: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  API Endpoint: {apiEndpoint.substring(0, 40) + (apiEndpoint.length > 40 ? '...' : '')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ChatDrawer;