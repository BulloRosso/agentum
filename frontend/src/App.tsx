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
      
      <Container component="main" sx={{ mt: 4, mb: 4, flex: '1 1 auto' }}>
        <Box sx={{ my: 4 }}>
          <Dashboard />
        </Box>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[100] }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Agents Playground
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default App;
