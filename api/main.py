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
from workflow_model import WorkflowList
from workflow_service import WorkflowService

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
async def get_workflows():
    """
    Fetches a list of workflows from the n8n API.
    
    This endpoint interacts with the n8n API to retrieve all workflows.
    Requires N8N_URL and N8N_API_KEY environment variables to be set.
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
    
    return workflows

# Backward compatibility for old workflows URL
@app.get("/api/workflows", response_model=WorkflowList, include_in_schema=False)
async def get_workflows_legacy():
    """
    Legacy workflows endpoint (will be deprecated)
    """
    logger.info("Legacy workflows requested")
    return await get_workflows()

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=3000, 
        reload=True,
        log_level="info"
    )
