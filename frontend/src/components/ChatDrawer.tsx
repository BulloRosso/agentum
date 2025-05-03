import React, { useState, useRef } from 'react';
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
}

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I\'m your AI assistant. How can I help you today?\n\nI can understand **markdown** formatting, including:\n- Bullet lists\n- *Italic* and **bold** text\n- `Code snippets`\n- [Links](https://www.example.com)',
      timestamp: new Date()
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Markdown rendering function
  const renderMarkdown = (text: string): string => {
    try {
      // Convert markdown to HTML using marked
      const rawHTML = marked(text);
      // Sanitize HTML to prevent XSS attacks
      return DOMPurify.sanitize(rawHTML as string);
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

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate bot response (would be replaced with actual API call)
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `This is a simulated response to "${message}". In a complete implementation, this would connect to the OpenAI API.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
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
      const file = files[0];
      // In a real implementation, this would upload the file to OpenAI API
      // and process it for multimodal analysis
      console.log(`File selected: ${file.name}`);
      
      // Add a message showing the file was uploaded
      const fileMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: `Uploaded file: ${file.name}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fileMessage]);
      
      // Simulate bot response
      setTimeout(() => {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `I've received your file: ${file.name}. In a complete implementation, I would analyze this file using OpenAI's multimodal capabilities.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
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
          <Typography variant="h6" component="div" fontWeight="bold">
            PoC Chatbot
          </Typography>
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
                        p: 1.5,
                        maxWidth: 'calc(100% - 50px)',
                        backgroundColor: msg.sender === 'user' ? 'primary.light' : 'white',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        component="div"
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
            />
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ChatDrawer;