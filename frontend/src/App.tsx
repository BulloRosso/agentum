import React from 'react';
import { Container, Box, Typography, AppBar, Toolbar } from '@mui/material';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
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

      <div>
        <img src="/img/builder-bot-upper.png" style={{ position: 'absolute', bottom: '0px', left: '50%', transform: 'translateX(-50%)' }} alt="Builder Bot" />
        <img src="/test-icon.svg" style={{ position: 'absolute', top: '70px', right: '20px', width: '50px', height: '50px' }} alt="Test SVG" />
      </div>
    </Box>
  );
};

export default App;
