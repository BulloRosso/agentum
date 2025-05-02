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
    """
    
    def __init__(self):
        """Initialize the storage client"""
        try:
            self.client = Client()
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
            logger.info(f"Retrieving text file: {file_path}")
            content = self.client.download_as_text(file_path)
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
            logger.info(f"Retrieving JSON file: {file_path}")
            content = self.client.download_as_text(file_path)
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
            logger.info(f"Creating text file: {file_path}")
            self.client.upload_from_text(file_path, content)
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
            self.client.upload_from_text(file_path, content)
            return True
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
        try:
            logger.info(f"Updating text file: {file_path}")
            self.client.upload_from_text(file_path, content)
            return True
        except Exception as e:
            logger.error(f"Error updating text file {file_path}: {str(e)}")
            return False
    
    def update_json(self, file_path: str, data: Any) -> bool:
        """
        Update an existing JSON file in storage
        
        Args:
            file_path: Path to the JSON file to update
            data: Python object to serialize as JSON
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Updating JSON file: {file_path}")
            content = json.dumps(data, indent=2)
            self.client.upload_from_text(file_path, content)
            return True
        except Exception as e:
            logger.error(f"Error updating JSON file {file_path}: {str(e)}")
            return False
    
    def delete(self, file_path: str) -> bool:
        """
        Delete a file from storage
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Deleting file: {file_path}")
            self.client.delete(file_path)
            return True
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
            return False
    
    def list_files(self) -> List[str]:
        """
        List all files in storage
        
        Returns:
            List of file paths
        """
        try:
            logger.info("Listing all files in storage")
            return self.client.list()
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
            logger.info(f"Retrieving binary file: {file_path}")
            content = self.client.download_as_bytes(file_path)
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
            logger.info(f"Creating binary file: {file_path}")
            self.client.upload_from_bytes(file_path, content)
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
        try:
            logger.info(f"Updating binary file: {file_path}")
            self.client.upload_from_bytes(file_path, content)
            return True
        except Exception as e:
            logger.error(f"Error updating binary file {file_path}: {str(e)}")
            return False
    
    def delete(self, file_path: str) -> bool:
        """
        Delete a binary file from storage
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Deleting binary file: {file_path}")
            self.client.delete(file_path)
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
            logger.info(f"Downloading file {storage_path} to {local_path}")
            self.client.download_to_filename(storage_path, local_path)
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
            logger.info(f"Uploading file from {local_path} to {storage_path}")
            self.client.upload_from_filename(storage_path, local_path)
            return True
        except Exception as e:
            logger.error(f"Error uploading file from {local_path} to {storage_path}: {str(e)}")
            return False
    
    def list_files(self) -> List[str]:
        """
        List all files in storage
        
        Returns:
            List of file paths
        """
        try:
            logger.info("Listing all files in storage")
            return self.client.list()
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            return []