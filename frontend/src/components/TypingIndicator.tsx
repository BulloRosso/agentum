import React from 'react';
import { Box, Paper } from '@mui/material';

const TypingIndicator: React.FC = () => {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        paddingTop: 0,
        paddingBottom: '6px',
        marginRight: '10px',
        display: 'inline-flex',
        maxWidth: 'fit-content',
        backgroundColor: 'white',
        borderRadius: 2,
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        height: '24px',
        py: 1
      }}>
        <Box className="typing-dot" sx={{
          width: '8px',
          height: '8px',
          margin: '0 3px',
          borderRadius: '50%',
          backgroundColor: '#aaa',
          display: 'inline-block',
          animation: 'bounce 1.3s linear infinite',
          animationDelay: '0s'
        }}></Box>
        <Box className="typing-dot" sx={{
          width: '8px',
          height: '8px',
          margin: '0 3px',
          borderRadius: '50%',
          backgroundColor: '#aaa',
          display: 'inline-block',
          animation: 'bounce 1.3s linear infinite',
          animationDelay: '0.2s'
        }}></Box>
        <Box className="typing-dot" sx={{
          width: '8px',
          height: '8px',
          margin: '0 3px',
          borderRadius: '50%',
          backgroundColor: '#aaa',
          display: 'inline-block',
          animation: 'bounce 1.3s linear infinite',
          animationDelay: '0.4s'
        }}></Box>
      </Box>
    </Paper>
  );
};

// Add the keyframes animation to the global stylesheet
const style = document.createElement('style');
style.innerHTML = `
  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-5px);
    }
  }
`;
document.head.appendChild(style);

export default TypingIndicator;