import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface DetailItem {
  label: string;
  value: string | number;
}

interface StatusCardProps {
  title: string;
  status: string;
  isOperational: boolean;
  details: DetailItem[];
}

const StatusCard: React.FC<StatusCardProps> = ({ 
  title, 
  status, 
  isOperational,
  details 
}) => {
  return (
    <Card className="shadow-lg h-full">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <Chip
            icon={isOperational ? <CheckCircleIcon /> : <ErrorIcon />}
            label={status}
            color={isOperational ? 'success' : 'error'}
            size="small"
          />
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Table size="small">
            <TableBody>
              {details.map((detail, index) => (
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ pl: 0, borderBottom: index === details.length - 1 ? 'none' : undefined }}>
                    <Typography variant="body2" color="text.secondary">
                      {detail.label}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 0, borderBottom: index === details.length - 1 ? 'none' : undefined }}>
                    <Typography variant="body2" fontWeight="medium">
                      {detail.value}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
