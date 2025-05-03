"""
Storage routes for file operations using Replit's object storage.

These endpoints expose the storage service methods to the frontend, allowing
file operations on both text and binary files.
"""

import os
import io
import base64
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, Body
from fastapi.responses import JSONResponse, FileResponse, Response
from typing import List, Optional, Dict, Any
import logging
from pydantic import BaseModel

from services.storage import StorageTextFile, StorageBinaryFile

# Configure logging
logger = logging.getLogger("api.routes.storage")

# Create router
router = APIRouter(prefix="/v1/storage", tags=["Storage"])

# Pydantic models for request/response
class FileInfo(BaseModel):
    """Information about a file in storage"""
    name: str
    size: int
    is_binary: bool

class FolderInfo(BaseModel):
    """Information about a folder in storage"""
    name: str
    path: str

class StorageListResponse(BaseModel):
    """Response model for listing storage items"""
    files: List[FileInfo] = []
    folders: List[FolderInfo] = []
    current_path: str = ""
    parent_path: Optional[str] = None

class FileContentResponse(BaseModel):
    """Response model for file content"""
    name: str
    content: str
    mime_type: str
    is_binary: bool
    size: int

class FileCreationRequest(BaseModel):
    """Request model for file creation"""
    content: str
    is_binary: bool = False

class FileDeleteResponse(BaseModel):
    """Response model for file deletion"""
    success: bool
    message: str

# Helpers
def get_path_components(path: str) -> List[str]:
    """Split a path into components, filtering empty components"""
    # Remove leading and trailing slashes, split by slash
    components = [p for p in path.strip("/").split("/") if p]
    return components

def get_parent_path(path: str) -> Optional[str]:
    """Get the parent path of a given path"""
    components = get_path_components(path)
    if not components:
        return None  # Root has no parent
    
    # Remove the last component to get the parent path
    parent_components = components[:-1]
    if not parent_components:
        return ""  # Parent is root
    
    return "/".join(parent_components)

def organize_files_into_folders(files: List[str]) -> Dict[str, List[str]]:
    """Organize a flat list of file paths into a nested folder structure"""
    result = {}
    
    for file_path in files:
        # Split the path into components
        components = get_path_components(file_path)
        
        if not components:
            # Skip empty paths
            continue
            
        # If there's only one component, it's a file at the root
        if len(components) == 1:
            if "" not in result:
                result[""] = []
            result[""].append(components[0])
        else:
            # Multiple components means it's in a subfolder
            folder_path = "/".join(components[:-1])
            if folder_path not in result:
                result[folder_path] = []
            result[folder_path].append(components[-1])
    
    return result

def get_file_size(storage_client, file_path: str, is_binary: bool = False) -> int:
    """Get the size of a file in bytes"""
    try:
        if is_binary:
            content = storage_client.get(file_path)
            return len(content) if content else 0
        else:
            content = storage_client.get(file_path)
            return len(content.encode('utf-8')) if content else 0
    except Exception as e:
        logger.warning(f"Error getting file size for {file_path}: {str(e)}")
        return 0

def get_mime_type(file_path: str) -> str:
    """Determine the MIME type based on file extension"""
    ext = os.path.splitext(file_path.lower())[1]
    
    mime_types = {
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.md': 'text/markdown',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.py': 'text/x-python',
    }
    
    return mime_types.get(ext, 'application/octet-stream')

def is_binary_file(file_path: str) -> bool:
    """Determine if a file is binary based on its extension"""
    # List of extensions that are considered binary
    binary_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.zip', '.gz', '.bin']
    ext = os.path.splitext(file_path.lower())[1]
    return ext in binary_extensions

# Routes
@router.get("/list", response_model=StorageListResponse)
async def list_storage(path: str = ""):
    """
    List files and folders in storage at the specified path
    
    Args:
        path: The path to list files and folders from (default: root)
        
    Returns:
        List of files and folders in the specified path
    """
    logger.info(f"Listing storage at path: {path}")
    
    try:
        # Initialize storage clients
        text_storage = StorageTextFile()
        binary_storage = StorageBinaryFile()
        
        # Get all files
        text_files = text_storage.list_files()
        binary_files = binary_storage.list_files()
        
        # Organize files into folders
        text_folders = organize_files_into_folders(text_files)
        binary_folders = organize_files_into_folders(binary_files)
        
        # Parse the requested path to get components
        path_components = get_path_components(path)
        current_path = "/".join(path_components) if path_components else ""
        
        # Files at the current path
        files_info = []
        
        # Get text files at the current path
        if current_path in text_folders:
            for file_name in text_folders[current_path]:
                file_path = f"{current_path}/{file_name}" if current_path else file_name
                size = get_file_size(text_storage, file_path)
                files_info.append(FileInfo(name=file_name, size=size, is_binary=False))
        
        # Get binary files at the current path
        if current_path in binary_folders:
            for file_name in binary_folders[current_path]:
                file_path = f"{current_path}/{file_name}" if current_path else file_name
                size = get_file_size(binary_storage, file_path, is_binary=True)
                files_info.append(FileInfo(name=file_name, size=size, is_binary=True))
        
        # Get subfolders at the current path
        folders_info = []
        
        # Use a set to track unique folder names at this level
        unique_folders = set()
        
        # Helper function to extract immediate subfolders
        def extract_immediate_subfolders(folder_paths, current_path):
            for folder_path in folder_paths:
                # Handle the root folder case
                if current_path == "" and "/" in folder_path:
                    # Extract the first component
                    first_component = folder_path.split("/")[0]
                    unique_folders.add(first_component)
                # Handle non-root folders
                elif current_path and folder_path.startswith(current_path + "/"):
                    # Extract the next component after current_path
                    remaining_path = folder_path[len(current_path)+1:]
                    if "/" in remaining_path:
                        next_component = remaining_path.split("/")[0]
                        unique_folders.add(next_component)
        
        # Extract subfolders from both text and binary file paths
        extract_immediate_subfolders(text_files, current_path)
        extract_immediate_subfolders(binary_files, current_path)
        
        # Create folder info objects
        for folder_name in unique_folders:
            folder_path = f"{current_path}/{folder_name}" if current_path else folder_name
            folders_info.append(FolderInfo(name=folder_name, path=folder_path))
        
        # Get parent path
        parent_path = get_parent_path(current_path)
        
        return StorageListResponse(
            files=files_info,
            folders=folders_info,
            current_path=current_path,
            parent_path=parent_path
        )
        
    except Exception as e:
        logger.error(f"Error listing storage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing storage: {str(e)}")

@router.get("/file")
async def get_file(path: str = None, binary: bool = False):
    """
    Get file content from storage
    
    Args:
        path: Path to the file
        binary: Whether the file is binary
        
    Returns:
        File content
    """
    if path is None:
        raise HTTPException(status_code=400, detail="Path parameter is required")
        
    logger.info(f"Getting file: {path}, binary: {binary}")
    
    try:
        if binary:
            storage = StorageBinaryFile()
            content = storage.get(path)
            
            if content is None:
                raise HTTPException(status_code=404, detail=f"File not found: {path}")
                
            # Determine MIME type
            mime_type = get_mime_type(path)
            
            # Return file content with appropriate content type
            return Response(content=content, media_type=mime_type)
        else:
            storage = StorageTextFile()
            content = storage.get(path)
            
            if content is None:
                raise HTTPException(status_code=404, detail=f"File not found: {path}")
            
            # Determine MIME type
            mime_type = get_mime_type(path)
            
            # Get file size
            size = len(content.encode('utf-8')) if content else 0
            
            # Return content
            return FileContentResponse(
                name=os.path.basename(path),
                content=content,
                mime_type=mime_type,
                is_binary=binary,
                size=size
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file {path}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting file: {str(e)}")

@router.post("/file")
async def create_file(
    path: str, 
    content: str = Body(...),
    is_binary: bool = Body(False)
):
    """
    Create or update a file in storage
    
    Args:
        path: Path to create the file at
        content: File content (text content or base64 encoded binary content)
        is_binary: Whether the content is binary (base64 encoded)
        
    Returns:
        Success message
    """
    logger.info(f"Creating file: {path}, binary: {is_binary}")
    
    try:
        if is_binary:
            storage = StorageBinaryFile()
            # Decode base64 content
            try:
                binary_content = base64.b64decode(content)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid base64 encoding: {str(e)}")
                
            result = storage.create(path, binary_content)
        else:
            storage = StorageTextFile()
            result = storage.create(path, content)
            
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create file")
            
        return {"success": True, "message": f"File {path} created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating file {path}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating file: {str(e)}")

@router.delete("/file", response_model=FileDeleteResponse)
async def delete_file(path: str, is_binary: bool = False):
    """
    Delete a file from storage
    
    Args:
        path: Path to the file to delete
        is_binary: Whether the file is binary
        
    Returns:
        Success message
    """
    logger.info(f"Deleting file: {path}, binary: {is_binary}")
    
    try:
        if is_binary:
            storage = StorageBinaryFile()
        else:
            storage = StorageTextFile()
            
        result = storage.delete(path)
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to delete file")
            
        return FileDeleteResponse(
            success=True,
            message=f"File {path} deleted successfully"
        )
        
    except Exception as e:
        logger.error(f"Error deleting file {path}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.post("/upload")
async def upload_file(
    file: UploadFile,
    path: str = Form(...)
):
    """
    Upload a file to storage
    
    Args:
        file: File to upload
        path: Path to store the file at
        
    Returns:
        Success message
    """
    logger.info(f"Uploading file: {file.filename} to {path}")
    
    try:
        # Determine full path
        full_path = f"{path}/{file.filename}" if path else file.filename
        
        # Determine if the file is binary based on its content type or extension
        file_binary = not file.content_type.startswith(('text/', 'application/json'))
        if not file_binary:
            # Double check by extension for common binary types
            file_binary = is_binary_file(file.filename)
        
        # Read file content
        content = await file.read()
        
        if file_binary:
            storage = StorageBinaryFile()
            result = storage.create(full_path, content)
        else:
            # Try to decode as text
            try:
                text_content = content.decode('utf-8')
                storage = StorageTextFile()
                result = storage.create(full_path, text_content)
            except UnicodeDecodeError:
                # If decoding fails, treat as binary
                storage = StorageBinaryFile()
                result = storage.create(full_path, content)
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to upload file")
            
        return {"success": True, "message": f"File {file.filename} uploaded successfully"}
        
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.post("/data/init")
async def initialize_data_folder():
    """
    Initialize the 'data' folder with some example files
    
    Creates a folder structure with sample files for testing the Tool Data Explorer.
    This is useful for demo purposes.
    """
    logger.info("Initializing data folder with sample files")
    
    try:
        # Create storage clients
        text_storage = StorageTextFile()
        binary_storage = StorageBinaryFile()
        
        # Sample text files
        sample_text = {
            "data/README.md": "# Tools Data Folder\n\nThis folder contains data files used by AI tools.\n\n## Structure\n\n- `/data/config` - Configuration files\n- `/data/temp` - Temporary files\n- `/data/results` - Analysis results",
            "data/config/settings.json": '{\n  "debug": true,\n  "maxThreads": 4,\n  "outputPath": "./output",\n  "defaultLanguage": "en-US"\n}',
            "data/temp/notes.txt": "Temporary notes for the current session.\nThese will be processed and moved to the results folder.",
            "data/results/analysis.json": '{\n  "status": "complete",\n  "processingTime": 2.45,\n  "itemsProcessed": 120,\n  "errorRate": 0.02\n}'
        }
        
        # Create text files
        for path, content in sample_text.items():
            text_storage.create(path, content)
            logger.info(f"Created sample text file: {path}")
        
        # Create an SVG sample file
        svg_content = """<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
  <text x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" fill="black">Sample</text>
</svg>"""
        text_storage.create("data/sample.svg", svg_content)
        logger.info("Created sample SVG file")
        
        return {"success": True, "message": "Data folder initialized with sample files"}
        
    except Exception as e:
        logger.error(f"Error initializing data folder: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error initializing data folder: {str(e)}")