import React, { useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction,
  IconButton,
  Divider, 
  Button,
  Drawer,
  AppBar,
  Toolbar,
  Pagination,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ArrowUpward as ArrowUpwardIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useStorageStore } from '../store/storageStore';
import MonacoEditor from 'react-monaco-editor';
import { getImageUrl } from '../api/storageApi';

const ToolDataExplorer: React.FC = () => {
  const {
    files,
    folders,
    currentPath,
    parentPath,
    fileContent,
    selectedFile,
    isContentDrawerOpen,
    isLoading,
    error,
    currentPage,
    itemsPerPage,
    
    fetchFiles,
    navigateToFolder,
    navigateToParent,
    viewFile,
    closeContentDrawer,
    deleteSelectedFile,
    initializeDataFolder,
    
    nextPage,
    prevPage,
    setCurrentPage
  } = useStorageStore();

  // Initial load with retry mechanism
  useEffect(() => {
    // Initialize data folder first (if needed) then focus on it
    const initAndFetch = async () => {
      try {
        // Try to initialize the data folder first
        await initializeDataFolder();
        // Then fetch the files from the data folder
        await fetchFiles('data');
      } catch (error) {
        console.error('Error initializing data folder:', error);
      }
    };
    
    initAndFetch();
  }, [fetchFiles, initializeDataFolder]);

  // Calculate pagination
  const totalItems = files.length + folders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Combine and sort folders first, then files
  const allItems = [...folders, ...files];
  const currentItems = allItems.slice(startIndex, endIndex);

  // Format file size
  const formatSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Determine if a file can be previewed
  const canPreviewFile = (fileName: string, isBinary: boolean): boolean => {
    if (!isBinary) {
      // Text files can be previewed
      return true;
    }
    
    // Only specific binary formats can be previewed
    const lowerName = fileName.toLowerCase();
    return lowerName.endsWith('.jpg') || 
           lowerName.endsWith('.jpeg') || 
           lowerName.endsWith('.png') || 
           lowerName.endsWith('.svg');
  };

  // Render file content preview
  const renderFileContent = () => {
    if (!fileContent || !selectedFile) return null;

    // Handle image previews
    if (selectedFile.is_binary && (selectedFile.name.endsWith('.jpg') || 
                                  selectedFile.name.endsWith('.jpeg') || 
                                  selectedFile.name.endsWith('.png'))) {
      const path = currentPath 
        ? `${currentPath}/${selectedFile.name}` 
        : selectedFile.name;
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <img 
            src={getImageUrl(path)} 
            alt={selectedFile.name} 
            style={{ maxWidth: '100%' }} 
          />
        </Box>
      );
    }
    
    // Handle SVG preview
    if (selectedFile.name.endsWith('.svg')) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <div dangerouslySetInnerHTML={{ __html: fileContent.content }} />
        </Box>
      );
    }
    
    // Handle text or code files with Monaco editor
    const getLanguage = () => {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      
      // Map extensions to Monaco editor language identifiers
      const languageMap: Record<string, string> = {
        'json': 'json',
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'md': 'markdown',
        'txt': 'plaintext',
      };
      
      return languageMap[extension] || 'plaintext';
    };
    
    return (
      <Box sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <MonacoEditor
          width="100%"
          height="100%"
          language={getLanguage()}
          theme="vs-light"
          value={fileContent.content}
          options={{
            readOnly: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on'
          }}
        />
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          Tool Data Explorer
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            {folders.length} folder{folders.length !== 1 ? 's' : ''}, {files.length} file{files.length !== 1 ? 's' : ''}
          </Typography>
          
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => fetchFiles(currentPath)}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
      
      {/* Current path display */}
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        Path: {currentPath || 'root'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Parent folder navigation */}
          {parentPath !== null && (
            <Box sx={{ mb: 1 }}>
              <Button
                startIcon={<ArrowUpwardIcon />}
                onClick={() => navigateToParent()}
                variant="text"
                color="primary"
                size="small"
              >
                Go Up
              </Button>
            </Box>
          )}
          
          {/* Files and folders list */}
          <List>
            {currentItems.length === 0 ? (
              <ListItem>
                <ListItemText primary="No files or folders found in this location." />
              </ListItem>
            ) : (
              currentItems.map((item, index) => {
                // Check if item is a folder
                if ('path' in item) {
                  return (
                    <React.Fragment key={`folder-${item.path}`}>
                      {index > 0 && <Divider />}
                      <ListItem button onClick={() => navigateToFolder(item.path)}>
                        <ListItemIcon>
                          <FolderIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.name} 
                          secondary="Folder"
                        />
                      </ListItem>
                    </React.Fragment>
                  );
                } else {
                  // It's a file
                  return (
                    <React.Fragment key={`file-${item.name}`}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemIcon>
                          <FileIcon color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.name} 
                          secondary={formatSize(item.size)}
                        />
                        <ListItemSecondaryAction>
                          {canPreviewFile(item.name, item.is_binary) && (
                            <IconButton edge="end" onClick={() => viewFile(item)}>
                              <VisibilityIcon />
                            </IconButton>
                          )}
                          <IconButton 
                            edge="end" 
                            onClick={() => {
                              useStorageStore.setState({ selectedFile: item });
                              deleteSelectedFile();
                            }}
                            color="error"
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  );
                }
              })
            )}
          </List>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
      
      {/* File content drawer */}
      <Drawer
        anchor="right"
        open={isContentDrawerOpen}
        onClose={closeContentDrawer}
        sx={{
          '& .MuiDrawer-paper': { 
            width: '80%', 
            maxWidth: '1200px'
          }
        }}
      >
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedFile?.name}
            </Typography>
            <IconButton edge="end" color="inherit" onClick={closeContentDrawer}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ p: 2 }}>
          {isLoading ? (
            <CircularProgress />
          ) : (
            renderFileContent()
          )}
        </Box>
      </Drawer>
      </CardContent>
    </Card>
  );
};

export default ToolDataExplorer;