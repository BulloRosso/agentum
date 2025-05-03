import os
import time
import json
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import uvicorn
import logging
import requests

# Import service and models
from models.workflow import WorkflowList
from services.workflow import WorkflowService

# Import routes
from routes.storage_routes import router as storage_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("api")

# Create FastAPI app
app = FastAPI(
    title="System Dashboard API",
    description="API for system status monitoring",
    version="1.0.0",
    docs_url=None,  # Disable default Swagger UI
    redoc_url=None,  # Disable default Redoc URL (we'll create a custom one)
)

# Include routers
app.include_router(storage_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start time for uptime calculation
start_time = time.time()

class HealthResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str = Field(..., description="Service status")
    uptime: float = Field(..., description="Service uptime in seconds")
    version: str = Field(..., description="API version")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint returns the status of the API service
    """
    logger.info("Health check requested")
    return {
        "status": "operational",
        "uptime": time.time() - start_time,
        "version": "1.0.0",
    }

# Add backward compatibility route for a transitional period
@app.get("/v1/health", response_model=HealthResponse, include_in_schema=False)
async def health_check_legacy():
    """
    Legacy health check endpoint (will be deprecated)
    """
    logger.info("Legacy health check requested")
    return await health_check()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log all requests"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Request {request.method} {request.url.path} processed in {process_time:.4f}s")
    return response

# Custom Redoc documentation endpoint
@app.get("/api/v1/doc", include_in_schema=False)
async def get_documentation():
    """
    Custom Redoc documentation endpoint
    """
    logger.info("API documentation requested")
    return get_redoc_html(
        openapi_url="/openapi.json",
        title="API Documentation",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
    )

# Backward compatibility for old doc URL
@app.get("/api/doc", include_in_schema=False)
async def get_documentation_legacy():
    """
    Legacy documentation endpoint (will be deprecated)
    """
    logger.info("Legacy API documentation requested")
    return await get_documentation()

# OpenAPI schema endpoint that will return a list of available API methods
@app.get("/api/v1/methods", response_class=JSONResponse)
async def get_api_methods():
    """
    Returns a list of all available API methods with their paths, descriptions and HTTP methods
    """
    logger.info("API methods requested")
    
    # Get the OpenAPI schema
    openapi_schema = app.openapi()
    
    # Extract endpoints info
    methods = []
    
    for path, path_item in openapi_schema["paths"].items():
        for method, operation in path_item.items():
            if method.lower() not in ["get", "post", "put", "delete", "patch"]:
                continue
                
            method_info = {
                "path": path,
                "method": method.upper(),
                "summary": operation.get("summary", ""),
                "description": operation.get("description", ""),
                "operationId": operation.get("operationId", ""),
                "tags": operation.get("tags", []),
                "parameters": []
            }
            
            # Extract parameters info
            if "parameters" in operation:
                for param in operation["parameters"]:
                    param_info = {
                        "name": param.get("name", ""),
                        "in": param.get("in", ""),
                        "required": param.get("required", False),
                        "description": param.get("description", ""),
                    }
                    method_info["parameters"].append(param_info)
            
            methods.append(method_info)
    
    return {"methods": methods}

# Backward compatibility for old methods URL
@app.get("/api/methods", response_class=JSONResponse, include_in_schema=False)
async def get_api_methods_legacy():
    """
    Legacy methods endpoint (will be deprecated)
    """
    logger.info("Legacy API methods requested")
    return await get_api_methods()

# Workflows endpoint to fetch n8n workflows
@app.get("/api/v1/workflows", response_model=WorkflowList, tags=["Workflows"])
@app.get("/v1/workflows", response_model=WorkflowList, tags=["Workflows"])
@app.get("/workflows", response_model=WorkflowList, tags=["Workflows"])
async def get_workflows():
    """
    Fetches a list of workflows from the n8n API.
    
    This endpoint interacts with the n8n API to retrieve all workflows.
    Requires N8N_URL and N8N_API_KEY environment variables to be set.
    
    The workflow data is also stored in object storage as workflows.json for later retrieval.
    """
    logger.info("Workflows requested")
    
    # Create service instance
    workflow_service = WorkflowService()
    
    # Fetch workflows
    workflows = await workflow_service.get_workflows()
    
    # Handle error case
    if workflows is None:
        logger.error("Failed to fetch workflows from n8n API")
        raise HTTPException(
            status_code=503,
            detail="Unable to fetch workflows from n8n API. Check server logs for details."
        )
    
    # Store workflows in storage as JSON using StorageTextFile
    try:
        from services.storage import StorageTextFile
        storage = StorageTextFile()
        
        # Convert workflows to JSON-serializable format
        # Note: workflows is a WorkflowList object, we need to use its dict() method or model_dump()
        # for Pydantic v2 to get the dictionary representation
        workflows_dict = workflows.model_dump() if hasattr(workflows, 'model_dump') else workflows.dict()
        
        # Ensure the format is correct for storage (it should have a 'data' field)
        if "data" not in workflows_dict and hasattr(workflows, "data"):
            # Add the data field explicitly
            workflows_dict = {"data": workflows.data}
        
        # Save to storage
        logger.info("Storing workflows to workflows.json")
        storage_result = storage.create_json("workflows.json", workflows_dict)
        
        if storage_result:
            logger.info(f"Successfully stored {len(workflows_dict.get('data', []))} workflows to workflows.json")
        else:
            logger.warning("Failed to store workflows to workflows.json")
            
    except Exception as e:
        # Log the error but don't fail the API request if storage fails
        logger.error(f"Error while storing workflows to storage: {str(e)}")
    
    return workflows

# Backward compatibility for old workflows URL
@app.get("/api/workflows", response_model=WorkflowList, include_in_schema=False)
async def get_workflows_legacy():
    """
    Legacy workflows endpoint (will be deprecated)
    """
    logger.info("Legacy workflows requested")
    return await get_workflows()

# Endpoint to get workflows from storage without calling the n8n API
@app.get("/api/v1/workflows/cached", response_model=WorkflowList, tags=["Workflows"])
@app.get("/v1/workflows/cached", response_model=WorkflowList, tags=["Workflows"])
@app.get("/workflows/cached", response_model=WorkflowList, tags=["Workflows"])
async def get_cached_workflows():
    """
    Retrieves workflows from storage without calling the n8n API.
    
    This endpoint reads the workflows.json file from object storage, which is 
    created when the /api/v1/workflows endpoint is called. If the file does not
    exist, it will return an empty workflow list.
    """
    logger.info("Cached workflows requested")
    
    try:
        from services.storage import StorageTextFile
        from models.workflow import WorkflowList
        
        storage = StorageTextFile()
        
        # Load workflows from storage
        workflows_json = storage.get_json("workflows.json")
        
        if workflows_json is None:
            logger.warning("No cached workflows found in storage")
            # Create an empty workflow list with the correct structure
            empty_workflows = {"data": []}
            return WorkflowList(**empty_workflows)
        
        # Convert to WorkflowList object
        # Check the structure to ensure it's correct
        if not isinstance(workflows_json, dict):
            logger.warning("Invalid structure in cached workflows.json, creating empty workflow list")
            empty_workflows = {"data": []}
            return WorkflowList(**empty_workflows)
            
        # If workflows_json has a "workflows" key, convert it to "data" key for the WorkflowList model
        if "workflows" in workflows_json and "data" not in workflows_json:
            logger.info("Converting workflows key to data key for WorkflowList model")
            workflows_json["data"] = workflows_json.pop("workflows")
            
        # If there's no data key, create an empty one
        if "data" not in workflows_json:
            logger.warning("Adding empty data list to workflows_json")
            workflows_json["data"] = []
            
        # Use appropriate method based on pydantic version
        cached_workflows = WorkflowList.parse_obj(workflows_json) if hasattr(WorkflowList, 'parse_obj') else WorkflowList(**workflows_json)
        
        logger.info(f"Successfully retrieved {len(cached_workflows.data)} cached workflows from storage")
        return cached_workflows
        
    except Exception as e:
        logger.error(f"Error retrieving cached workflows: {str(e)}")
        # Instead of raising an exception, return an empty workflow list
        logger.info("Returning empty workflow list due to error")
        empty_workflows = {"data": []}
        return WorkflowList(**empty_workflows)

# Storage test endpoint to verify that the storage service is working
@app.get("/api/v1/storage/test", response_class=JSONResponse)
async def test_storage():
    """
    Test endpoint for storage service functionality
    
    Creates test text and binary files, performs basic operations on them,
    and returns comprehensive test results. Useful to verify that the
    storage service is working properly.
    """
    from services.storage import StorageTextFile, StorageBinaryFile
    import os
    import tempfile
    
    logger.info("Storage test requested")
    
    results = {
        "text_storage": {},
        "binary_storage": {},
        "success": True
    }
    
    # Generate a unique test ID to avoid conflicts
    import random
    import string
    test_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    # Test text storage
    try:
        # Initialize text storage service
        text_storage = StorageTextFile()
        
        # Test files
        text_file_path = f"test_file_{test_id}.txt"
        json_file_path = f"test_json_{test_id}.json"
        
        # Test content
        text_content = f"Hello, World! Test ID: {test_id}"
        json_content = {
            "message": "Storage service is working correctly",
            "test_id": test_id,
            "timestamp": time.time()
        }
        
        # Test 1: Create and get text file
        create_result = text_storage.create(text_file_path, text_content)
        results["text_storage"]["create_text"] = create_result
        
        if create_result:
            get_result = text_storage.get(text_file_path)
            results["text_storage"]["get_text"] = {
                "success": get_result == text_content,
                "expected": text_content,
                "actual": get_result
            }
        
        # Test 2: Create and get JSON file
        create_json_result = text_storage.create_json(json_file_path, json_content)
        results["text_storage"]["create_json"] = create_json_result
        
        if create_json_result:
            get_json_result = text_storage.get_json(json_file_path)
            results["text_storage"]["get_json"] = {
                "success": isinstance(get_json_result, dict) and get_json_result.get("test_id") == test_id,
                "expected": json_content,
                "actual": get_json_result
            }
        
        # Test 3: Update a text file
        updated_text = f"Updated content {test_id}"
        update_result = text_storage.update(text_file_path, updated_text)
        results["text_storage"]["update_text"] = update_result
        
        if update_result:
            updated_content = text_storage.get(text_file_path)
            results["text_storage"]["updated_content"] = {
                "success": updated_content == updated_text,
                "expected": updated_text,
                "actual": updated_content
            }
        
        # Test 4: List files
        file_list = text_storage.list_files()
        results["text_storage"]["list_files"] = {
            "success": text_file_path in file_list and json_file_path in file_list,
            "files": file_list
        }
        
        # Test 5: Delete files
        delete_result = text_storage.delete(text_file_path)
        results["text_storage"]["delete_text"] = delete_result
        
        delete_json_result = text_storage.delete(json_file_path)
        results["text_storage"]["delete_json"] = delete_json_result
        
        # Overall success
        text_success = all([
            results["text_storage"].get("create_text", False),
            results["text_storage"].get("get_text", {}).get("success", False),
            results["text_storage"].get("create_json", False),
            results["text_storage"].get("get_json", {}).get("success", False),
            results["text_storage"].get("update_text", False),
            results["text_storage"].get("updated_content", {}).get("success", False),
            results["text_storage"].get("list_files", {}).get("success", False),
            results["text_storage"].get("delete_text", False),
            results["text_storage"].get("delete_json", False)
        ])
        
        results["text_storage"]["overall"] = "Success" if text_success else "Failed"
        if not text_success:
            results["success"] = False
            
    except Exception as e:
        logger.error(f"Error in text storage test: {str(e)}")
        results["text_storage"]["error"] = str(e)
        results["text_storage"]["overall"] = "Failed with exception"
        results["success"] = False
    
    # Test binary storage
    try:
        # Initialize binary storage service
        binary_storage = StorageBinaryFile()
        
        # Test files
        binary_file_path = f"test_binary_{test_id}.bin"
        
        # Test content (simple binary data)
        binary_content = f"Binary test data {test_id}".encode('utf-8')
        
        # Test 1: Create and get binary file
        create_result = binary_storage.create(binary_file_path, binary_content)
        results["binary_storage"]["create_binary"] = create_result
        
        if create_result:
            get_result = binary_storage.get(binary_file_path)
            results["binary_storage"]["get_binary"] = {
                "success": get_result == binary_content,
                "expected_length": len(binary_content),
                "actual_length": len(get_result) if get_result else 0
            }
        
        # Test 2: Update binary file
        updated_binary = f"Updated binary content {test_id}".encode('utf-8')
        update_result = binary_storage.update(binary_file_path, updated_binary)
        results["binary_storage"]["update_binary"] = update_result
        
        if update_result:
            updated_content = binary_storage.get(binary_file_path)
            results["binary_storage"]["updated_binary"] = {
                "success": updated_content == updated_binary,
                "expected_length": len(updated_binary),
                "actual_length": len(updated_content) if updated_content else 0
            }
        
        # Test 3: Get to file and create from file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
            
        try:
            # Download to local file
            get_to_file_result = binary_storage.get_to_file(binary_file_path, temp_path)
            results["binary_storage"]["get_to_file"] = get_to_file_result
            
            if get_to_file_result:
                # Verify content
                with open(temp_path, 'rb') as f:
                    local_content = f.read()
                
                results["binary_storage"]["local_file_content"] = {
                    "success": local_content == updated_binary,
                    "expected_length": len(updated_binary),
                    "actual_length": len(local_content) if local_content else 0
                }
                
                # Create from local file
                new_path = f"test_from_file_{test_id}.bin"
                create_from_file_result = binary_storage.create_from_file(new_path, temp_path)
                results["binary_storage"]["create_from_file"] = create_from_file_result
                
                if create_from_file_result:
                    # Verify content
                    new_content = binary_storage.get(new_path)
                    results["binary_storage"]["new_file_content"] = {
                        "success": new_content == updated_binary,
                        "expected_length": len(updated_binary),
                        "actual_length": len(new_content) if new_content else 0
                    }
                    
                    # Delete the new file
                    binary_storage.delete(new_path)
        except Exception as e:
            logger.error(f"Error in temporary file operations: {str(e)}")
            results["binary_storage"]["temp_file_error"] = str(e)
            results["success"] = False
        finally:
            # Clean up the local file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
        # Test 4: List files
        file_list = binary_storage.list_files()
        results["binary_storage"]["list_files"] = {
            "success": binary_file_path in file_list,
            "files": file_list
        }
        
        # Test 5: Delete file
        delete_result = binary_storage.delete(binary_file_path)
        results["binary_storage"]["delete_binary"] = delete_result
        
        # Overall success
        binary_success = all([
            results["binary_storage"].get("create_binary", False),
            results["binary_storage"].get("get_binary", {}).get("success", False),
            results["binary_storage"].get("update_binary", False),
            results["binary_storage"].get("updated_binary", {}).get("success", False),
            results["binary_storage"].get("get_to_file", False),
            results["binary_storage"].get("local_file_content", {}).get("success", False),
            results["binary_storage"].get("create_from_file", False),
            results["binary_storage"].get("new_file_content", {}).get("success", False),
            results["binary_storage"].get("list_files", {}).get("success", False),
            results["binary_storage"].get("delete_binary", False)
        ])
        
        results["binary_storage"]["overall"] = "Success" if binary_success else "Failed"
        if not binary_success:
            results["success"] = False
            
    except Exception as e:
        logger.error(f"Error in binary storage test: {str(e)}")
        results["binary_storage"]["error"] = str(e)
        results["binary_storage"]["overall"] = "Failed with exception"
        results["success"] = False
    
    # Overall test results
    results["timestamp"] = time.time()
    if results["success"]:
        results["message"] = "Storage service tests completed successfully"
    else:
        results["message"] = "One or more storage tests failed"
    
    return results

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=3000, 
        reload=True,
        log_level="info"
    )
