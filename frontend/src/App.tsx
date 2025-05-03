import React, { useState } from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Fade } from '@mui/material';
import Dashboard from './components/Dashboard';
import ChatDrawer from './components/ChatDrawer';

const App: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [robotVisible, setRobotVisible] = useState(true);

  const handleRobotClick = () => {
    setRobotVisible(false);
    setTimeout(() => setChatOpen(true), 300); // Delay to allow fade out animation
  };

  const handleChatClose = () => {
    setChatOpen(false);
    setTimeout(() => setRobotVisible(true), 300); // Delay to allow drawer to close
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Agents Playground
          </Typography>
        </Toolbar>
      </AppBar>
      
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
            src="/img/builder-bot-upper.png" 
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
      <ChatDrawer open={chatOpen} onClose={handleChatClose} />
    </Box>
  );
};

export default App;
