"""
Storage service for handling file operations using Replit's object storage.

This module provides two primary classes for managing file storage:
- StorageTextFile: For managing text-based files (JSON, text, etc.)
- StorageBinaryFile: For managing binary files (images, etc.)
"""

import os
import logging
from typing import Optional, List, BinaryIO, Any, Dict, Union
import json
from replit.object_storage import Client

# Configure logging
logger = logging.getLogger("api.storage")

class StorageTextFile:
    """
    Service for managing text-based files in Replit object storage.
    
    Provides CRUD operations for text files such as JSON, plain text, etc.
    Uses Replit's object storage to store file contents.
    """
    
    def __init__(self):
        """Initialize the storage client"""
        try:
            self.client = Client()
            self.prefix = "text/"  # Store text files under this prefix
            logger.info("Storage client initialized successfully for text files")
        except Exception as e:
            logger.error(f"Failed to initialize storage client: {str(e)}")
            raise
    
    def get(self, file_path: str) -> Optional[str]:
        """
        Retrieve a text file's content from storage
        
        Args:
            file_path: Path to the file in storage
            
        Returns:
            String content of the file, or None if not found
        """
        try:
            path = f"{self.prefix}{file_path}"
            logger.info(f"Retrieving text file: {path}")
            content = self.client.download_as_text(path)
            return content
        except Exception as e:
            logger.error(f"Error retrieving text file {file_path}: {str(e)}")
            return None
    
    def get_json(self, file_path: str) -> Optional[Any]:
        """
        Retrieve a JSON file and parse its content
        
        Args:
            file_path: Path to the JSON file in storage
            
        Returns:
            Parsed JSON content as dict/list, or None if not found or invalid
        """
        try:
            content = self.get(file_path)
            if content is None:
                return None
                
            logger.info(f"Parsing JSON from file: {file_path}")
            return json.loads(content)
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON from {file_path}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error retrieving JSON file {file_path}: {str(e)}")
            return None
    
    def create(self, file_path: str, content: str) -> bool:
        """
        Create a new text file in storage
        
        Args:
            file_path: Path to create the file at
            content: Text content to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            path = f"{self.prefix}{file_path}"
            logger.info(f"Creating text file: {path}")
            self.client.upload_from_text(path, content)
            return True
        except Exception as e:
            logger.error(f"Error creating text file {file_path}: {str(e)}")
            return False
    
    def create_json(self, file_path: str, data: Any) -> bool:
        """
        Create a new JSON file in storage
        
        Args:
            file_path: Path to create the JSON file at
            data: Python object to serialize as JSON
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Creating JSON file: {file_path}")
            content = json.dumps(data, indent=2)
            return self.create(file_path, content)
        except Exception as e:
            logger.error(f"Error creating JSON file {file_path}: {str(e)}")
            return False
    
    def update(self, file_path: str, content: str) -> bool:
        """
        Update an existing text file in storage
        
        Args:
            file_path: Path to the file to update
            content: New text content
            
        Returns:
            True if successful, False otherwise
        """
        # In object storage, create and update are the same operation
        return self.create(file_path, content)
    
    def update_json(self, file_path: str, data: Any) -> bool:
        """
        Update an existing JSON file in storage
        
        Args:
            file_path: Path to the JSON file to update
            data: Python object to serialize as JSON
            
        Returns:
            True if successful, False otherwise
        """
        # In object storage, create and update are the same operation
        return self.create_json(file_path, data)
    
    def delete(self, file_path: str) -> bool:
        """
        Delete a file from storage
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            path = f"{self.prefix}{file_path}"
            logger.info(f"Deleting file: {path}")
            self.client.delete(path)
            return True
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
            return False
    
    def list_files(self) -> List[str]:
        """
        List all files in storage
        
        Returns:
            List of file paths (without the prefix)
        """
        try:
            logger.info("Listing all files in storage")
            all_files = self.client.list()
            
            # Filter only the text files (those with our prefix)
            text_files = []
            prefix_len = len(self.prefix)
            
            # Handle the case where all_files is a list of objects or a dictionary
            if isinstance(all_files, dict):
                # If it's a dictionary, the keys should be the file paths
                all_file_paths = list(all_files.keys())
            elif isinstance(all_files, list):
                # If it's a list, check if the items are objects or strings
                if all_files and hasattr(all_files[0], 'name'):
                    # If items have a 'name' attribute, use that
                    all_file_paths = [item.name for item in all_files]
                else:
                    # Otherwise assume they are strings
                    all_file_paths = all_files
            else:
                # If it's some other type, convert to string representation
                logger.warning(f"Unexpected type returned by list(): {type(all_files)}")
                all_file_paths = []
                
            # Now that we have a list of paths, filter those with our prefix
            for file_path in all_file_paths:
                if isinstance(file_path, str) and file_path.startswith(self.prefix):
                    # Remove the prefix to get the original file path
                    text_files.append(file_path[prefix_len:])
            
            return text_files
            
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            return []


class StorageBinaryFile:
    """
    Service for managing binary files in Replit object storage.
    
    Provides CRUD operations for binary files such as images, documents, etc.
    """
    
    def __init__(self):
        """Initialize the storage client"""
        try:
            self.client = Client()
            self.prefix = "binary/"  # Store binary files under this prefix
            logger.info("Storage client initialized successfully for binary files")
        except Exception as e:
            logger.error(f"Failed to initialize storage client: {str(e)}")
            raise
    
    def get(self, file_path: str) -> Optional[bytes]:
        """
        Retrieve a binary file's content from storage
        
        Args:
            file_path: Path to the file in storage
            
        Returns:
            Binary content of the file, or None if not found
        """
        try:
            path = f"{self.prefix}{file_path}"
            logger.info(f"Retrieving binary file: {path}")
            content = self.client.download_as_bytes(path)
            return content
        except Exception as e:
            logger.error(f"Error retrieving binary file {file_path}: {str(e)}")
            return None
    
    def create(self, file_path: str, content: bytes) -> bool:
        """
        Create a new binary file in storage
        
        Args:
            file_path: Path to create the file at
            content: Binary content to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            path = f"{self.prefix}{file_path}"
            logger.info(f"Creating binary file: {path}")
            self.client.upload_from_bytes(path, content)
            return True
        except Exception as e:
            logger.error(f"Error creating binary file {file_path}: {str(e)}")
            return False
    
    def update(self, file_path: str, content: bytes) -> bool:
        """
        Update an existing binary file in storage
        
        Args:
            file_path: Path to the file to update
            content: New binary content
            
        Returns:
            True if successful, False otherwise
        """
        # In object storage, create and update are the same operation
        return self.create(file_path, content)
    
    def delete(self, file_path: str) -> bool:
        """
        Delete a binary file from storage
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            path = f"{self.prefix}{file_path}"
            logger.info(f"Deleting binary file: {path}")
            self.client.delete(path)
            return True
        except Exception as e:
            logger.error(f"Error deleting binary file {file_path}: {str(e)}")
            return False
    
    def get_to_file(self, storage_path: str, local_path: str) -> bool:
        """
        Download a file from storage to a local file
        
        Args:
            storage_path: Path to the file in storage
            local_path: Local filesystem path to save to
            
        Returns:
            True if successful, False otherwise
        """
        try:
            path = f"{self.prefix}{storage_path}"
            logger.info(f"Downloading file {storage_path} to {local_path}")
            
            # Ensure the destination directory exists
            os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)
            
            # Download the content and write to local file
            content = self.get(storage_path)
            if content is None:
                return False
                
            with open(local_path, 'wb') as f:
                f.write(content)
                
            return True
            
        except Exception as e:
            logger.error(f"Error downloading file {storage_path} to {local_path}: {str(e)}")
            return False
    
    def create_from_file(self, storage_path: str, local_path: str) -> bool:
        """
        Upload a file from local filesystem to storage
        
        Args:
            storage_path: Path to create in storage
            local_path: Local filesystem path to read from
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not os.path.exists(local_path):
                logger.warning(f"Local file not found: {local_path}")
                return False
                
            logger.info(f"Uploading file from {local_path} to {storage_path}")
            
            # Read the local file and upload its content
            with open(local_path, 'rb') as f:
                content = f.read()
                return self.create(storage_path, content)
            
        except Exception as e:
            logger.error(f"Error uploading file from {local_path} to {storage_path}: {str(e)}")
            return False
    
    def list_files(self) -> List[str]:
        """
        List all files in storage
        
        Returns:
            List of file paths (without the prefix)
        """
        try:
            logger.info("Listing all binary files in storage")
            all_files = self.client.list()
            
            # Filter only the binary files (those with our prefix)
            binary_files = []
            prefix_len = len(self.prefix)
            
            # Handle the case where all_files is a list of objects or a dictionary
            if isinstance(all_files, dict):
                # If it's a dictionary, the keys should be the file paths
                all_file_paths = list(all_files.keys())
            elif isinstance(all_files, list):
                # If it's a list, check if the items are objects or strings
                if all_files and hasattr(all_files[0], 'name'):
                    # If items have a 'name' attribute, use that
                    all_file_paths = [item.name for item in all_files]
                else:
                    # Otherwise assume they are strings
                    all_file_paths = all_files
            else:
                # If it's some other type, convert to string representation
                logger.warning(f"Unexpected type returned by list(): {type(all_files)}")
                all_file_paths = []
                
            # Now that we have a list of paths, filter those with our prefix
            for file_path in all_file_paths:
                if isinstance(file_path, str) and file_path.startswith(self.prefix):
                    # Remove the prefix to get the original file path
                    binary_files.append(file_path[prefix_len:])
            
            return binary_files
            
        except Exception as e:
            logger.error(f"Error listing binary files: {str(e)}")
            return []