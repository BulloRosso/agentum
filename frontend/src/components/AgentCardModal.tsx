import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AgentCard from './AgentCard';

// Using the same interface structure from AgentCard.tsx
interface AgentData {
  name: string;
  description: string;
  url: string;
  provider?: {
    organization: string;
    url: string;
  };
  version: string;
  documentationUrl?: string;
  capabilities: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  authentication: {
    schemes: string[];
    credentials?: string;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples?: string[];
    inputModes?: string[];
    outputModes?: string[];
  }[];
}

interface AgentCardModalProps {
  open: boolean;
  onClose: () => void;
  agent: AgentData | null;
}

const AgentCardModal: React.FC<AgentCardModalProps> = ({ open, onClose, agent }) => {
  if (!agent) return null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Agent Card: {agent.name}
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <AgentCard agent={agent} />
      </DialogContent>
    </Dialog>
  );
};

export default AgentCardModal;