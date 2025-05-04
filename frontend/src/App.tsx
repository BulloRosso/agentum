import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, AppBar, Toolbar, Fade,
  IconButton, Menu, MenuItem, Modal, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Dashboard from './components/Dashboard';
import ChatDrawer from './components/ChatDrawer';

const App: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [robotVisible, setRobotVisible] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [chatEndpoint, setChatEndpoint] = useState<string>('');

  // Load chat endpoint from localStorage on component mount
  useEffect(() => {
    const savedEndpoint = localStorage.getItem('chat_endpoint_url');
    if (savedEndpoint) {
      setChatEndpoint(savedEndpoint);
    }
  }, []);

  const handleRobotClick = () => {
    setRobotVisible(false);
    setTimeout(() => setChatOpen(true), 300); // Delay to allow fade out animation
  };

  const handleChatClose = () => {
    setChatOpen(false);
    setTimeout(() => setRobotVisible(true), 300); // Delay to allow drawer to close
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChatSettingsOpen = () => {
    handleMenuClose();
    setChatSettingsOpen(true);
  };

  const handleChatSettingsClose = () => {
    setChatSettingsOpen(false);
  };

  const handleChatEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatEndpoint(e.target.value);
  };

  const saveChatEndpoint = () => {
    localStorage.setItem('chat_endpoint_url', chatEndpoint);
    handleChatSettingsClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Agents Playground
          </Typography>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleChatSettingsOpen}>Chat interface settings</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Chat Settings Dialog */}
      <Dialog open={chatSettingsOpen} onClose={handleChatSettingsClose}>
        <DialogTitle>Chat Interface Settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="chat-endpoint"
            label="Chat API endpoint (POST)"
            type="text"
            fullWidth
            variant="outlined"
            value={chatEndpoint}
            onChange={handleChatEndpointChange}
            sx={{ mt: 2, minWidth: 350 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleChatSettingsClose}>Cancel</Button>
          <Button onClick={saveChatEndpoint} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      <Container component="main" sx={{ mt: 2, mb: 4, flex: '1 1 auto', px: 3 }}>
        <Box sx={{ my: 2 }}>
          <Dashboard />
        </Box>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[100] }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            coded by Claude with ❤️ gentle human guidance
          </Typography>
        </Container>
      </Box>

      {/* Robot image with fade effect */}
      <Fade in={robotVisible} timeout={300}>
        <div>
          <img 
            src="./img/builder-bot-upper.png" 
            style={{ 
              display: 'block', 
              position: 'fixed', 
              width: '120px', 
              bottom: '-20px', 
              left: '20%', 
              transform: 'translateX(-50%)',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease-in-out',
              zIndex: 1000
            }} 
            alt="Builder Bot" 
            onClick={handleRobotClick}
          />
        </div>
      </Fade>

      {/* Chat drawer */}
      <ChatDrawer open={chatOpen} onClose={handleChatClose} apiEndpoint={chatEndpoint} />
    </Box>
  );
};

export default App;
