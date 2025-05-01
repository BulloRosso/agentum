import React from 'react';
import { Container, Box, Typography, AppBar, Toolbar } from '@mui/material';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            System Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ mt: 4, mb: 4, flex: '1 1 auto' }}>
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            System Status Dashboard
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
            Monitor the status of all system components
          </Typography>
          
          <Dashboard />
        </Box>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[100] }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} System Dashboard
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default App;
