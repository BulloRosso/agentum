import axios from 'axios';

// Base URL for API requests
const API_URL = 'http://localhost:3000'; // Same as other API calls

// Types
export interface FileInfo {
  name: string;
  size: number;
  is_binary: boolean;
}

export interface FolderInfo {
  name: string;
  path: string;
}

export interface StorageListResponse {
  files: FileInfo[];
  folders: FolderInfo[];
  current_path: string;
  parent_path: string | null;
}

export interface FileContentResponse {
  name: string;
  content: string;
  mime_type: string;
  is_binary: boolean;
  size: number;
}

// API methods
export const fetchStorageList = async (path: string = ''): Promise<StorageListResponse> => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/storage/list`, {
      params: { path }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching storage list:', error);
    // Return empty list on error
    return {
      files: [],
      folders: [],
      current_path: path,
      parent_path: null
    };
  }
};

export const fetchFileContent = async (path: string, binary: boolean = false): Promise<FileContentResponse | Blob> => {
  try {
    if (binary) {
      // For binary files, return as blob
      const response = await axios.get(`${API_URL}/api/v1/storage/file`, {
        params: { path, binary },
        responseType: 'blob'
      });
      return response.data;
    } else {
      // For text files, return structured content
      const response = await axios.get(`${API_URL}/api/v1/storage/file`, {
        params: { path, binary }
      });
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching file content for ${path}:`, error);
    throw error;
  }
};

export const deleteFile = async (path: string, is_binary: boolean = false): Promise<boolean> => {
  try {
    await axios.delete(`${API_URL}/api/v1/storage/file`, {
      params: { path, is_binary }
    });
    return true;
  } catch (error) {
    console.error(`Error deleting file ${path}:`, error);
    return false;
  }
};

export const createFile = async (path: string, content: string, is_binary: boolean = false): Promise<boolean> => {
  try {
    await axios.post(`${API_URL}/api/v1/storage/file`, {
      content,
      is_binary
    }, {
      params: { path }
    });
    return true;
  } catch (error) {
    console.error(`Error creating file ${path}:`, error);
    return false;
  }
};

export const initDataFolder = async (): Promise<boolean> => {
  try {
    await axios.post(`${API_URL}/api/v1/storage/data/init`);
    return true;
  } catch (error) {
    console.error('Error initializing data folder:', error);
    return false;
  }
};

// Function to get image URL for binary files
export const getImageUrl = (path: string): string => {
  return `${API_URL}/api/v1/storage/file?path=${encodeURIComponent(path)}&binary=true`;
};