import { create } from 'zustand';
import {
  fetchStorageList,
  fetchFileContent,
  deleteFile,
  createFile,
  initDataFolder,
  FileInfo,
  FolderInfo,
  FileContentResponse
} from '../api/storageApi';

interface StorageState {
  // Current storage navigation state
  currentPath: string;
  parentPath: string | null;
  files: FileInfo[];
  folders: FolderInfo[];
  selectedFile: FileInfo | null;
  fileContent: FileContentResponse | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isContentDrawerOpen: boolean;
  
  // Paging
  currentPage: number;
  itemsPerPage: number;
  
  // Actions
  fetchFiles: (path?: string) => Promise<void>;
  navigateToFolder: (path: string) => Promise<void>;
  navigateToParent: () => Promise<void>;
  viewFile: (file: FileInfo) => Promise<void>;
  closeContentDrawer: () => void;
  deleteSelectedFile: () => Promise<boolean>;
  initializeDataFolder: () => Promise<boolean>;
  
  // Pagination
  nextPage: () => void;
  prevPage: () => void;
  setCurrentPage: (page: number) => void;
}

export const useStorageStore = create<StorageState>((set, get) => ({
  // Initial state
  currentPath: '',
  parentPath: null,
  files: [],
  folders: [],
  selectedFile: null,
  fileContent: null,
  isLoading: false,
  error: null,
  isContentDrawerOpen: false,
  currentPage: 1,
  itemsPerPage: 8, // As per requirement
  
  // Actions
  fetchFiles: async (path = '') => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchStorageList(path);
      set({
        currentPath: data.current_path,
        parentPath: data.parent_path,
        files: data.files,
        folders: data.folders,
        isLoading: false,
        // Reset page when changing folders
        currentPage: 1
      });
    } catch (error) {
      console.error('Error in fetchFiles:', error);
      set({
        isLoading: false,
        error: 'Failed to fetch storage items'
      });
    }
  },
  
  navigateToFolder: async (path: string) => {
    await get().fetchFiles(path);
  },
  
  navigateToParent: async () => {
    const { parentPath } = get();
    if (parentPath !== null) {
      await get().fetchFiles(parentPath);
    }
  },
  
  viewFile: async (file: FileInfo) => {
    set({ isLoading: true, error: null, selectedFile: file });
    
    try {
      // Construct the full path
      const path = get().currentPath 
        ? `${get().currentPath}/${file.name}` 
        : file.name;
      
      // Only fetch content for non-binary files that we can display in Monaco editor
      if (!file.is_binary || file.name.endsWith('.svg')) {
        const content = await fetchFileContent(path, false) as FileContentResponse;
        set({
          fileContent: content,
          isContentDrawerOpen: true,
          isLoading: false
        });
      } else {
        // For binary files we don't need to fetch content here since image tag will do that
        set({
          fileContent: {
            name: file.name,
            content: '',
            mime_type: 'application/octet-stream',
            is_binary: true,
            size: file.size
          },
          isContentDrawerOpen: true,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      set({
        isLoading: false,
        error: `Failed to load file content: ${file.name}`,
        isContentDrawerOpen: false
      });
    }
  },
  
  closeContentDrawer: () => {
    set({
      isContentDrawerOpen: false,
      selectedFile: null,
      fileContent: null
    });
  },
  
  deleteSelectedFile: async () => {
    const { selectedFile, currentPath } = get();
    
    if (!selectedFile) return false;
    
    const path = currentPath 
      ? `${currentPath}/${selectedFile.name}` 
      : selectedFile.name;
    
    set({ isLoading: true, error: null });
    
    try {
      const success = await deleteFile(path, selectedFile.is_binary);
      
      if (success) {
        // Re-fetch the file list to update UI
        await get().fetchFiles(currentPath);
        return true;
      } else {
        set({
          isLoading: false,
          error: `Failed to delete file: ${selectedFile.name}`
        });
        return false;
      }
    } catch (error) {
      console.error('Error in deleteSelectedFile:', error);
      set({
        isLoading: false,
        error: `Error deleting file: ${selectedFile.name}`
      });
      return false;
    }
  },
  
  initializeDataFolder: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const success = await initDataFolder();
      
      if (success) {
        // Re-fetch files to show the new data folder
        await get().fetchFiles();
        return true;
      } else {
        set({
          isLoading: false,
          error: 'Failed to initialize data folder'
        });
        return false;
      }
    } catch (error) {
      console.error('Error initializing data folder:', error);
      set({
        isLoading: false,
        error: 'Error initializing data folder'
      });
      return false;
    }
  },
  
  // Pagination methods
  nextPage: () => {
    const { currentPage, files, folders, itemsPerPage } = get();
    const totalItems = files.length + folders.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 });
    }
  },
  
  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
  },
  
  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  }
}));