import asyncio
import json
import logging
import os
from typing import List, Dict, Any, Union, Optional

import anyio
import click
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from pydantic import BaseModel, Field, AnyUrl, FileUrl
import uvicorn

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("mcp-server")

# Define data models for protocol types
class ToolProperty(BaseModel):
    type: str
    description: str

class ToolSchema(BaseModel):
    type: str
    required: List[str]
    properties: Dict[str, ToolProperty]

class Tool(BaseModel):
    name: str
    description: str
    inputSchema: ToolSchema

class PromptArgument(BaseModel):
    name: str
    description: str
    required: bool = False

class Prompt(BaseModel):
    name: str
    description: str
    arguments: List[PromptArgument]

class Resource(BaseModel):
    uri: Union[AnyUrl, str]
    name: str
    description: str
    mimeType: str
    content: Optional[str] = None  # Internal field, not exposed via API

class MCPStatus(BaseModel):
    tools: int
    resources: int
    prompts: int
    status: str

# Define available tools
available_tools = [
    Tool(
        name="fetch",
        description="Fetches content from a URL",
        inputSchema=ToolSchema(
            type="object",
            required=["url"],
            properties={
                "url": ToolProperty(
                    type="string",
                    description="URL to fetch",
                )
            }
        )
    ),
    Tool(
        name="saveFile",
        description="Saves content to a file",
        inputSchema=ToolSchema(
            type="object",
            required=["filename", "content"],
            properties={
                "filename": ToolProperty(
                    type="string",
                    description="Name of the file to save",
                ),
                "content": ToolProperty(
                    type="string",
                    description="Content to save",
                )
            }
        )
    )
]

# Define available resources
available_resources = [
    Resource(
        uri="file:///greeting.txt",
        name="greeting",
        description="A welcome message",
        mimeType="text/plain",
        content="Hello! Welcome to the MCP server."
    ),
    Resource(
        uri="file:///help.txt",
        name="help",
        description="Help information",
        mimeType="text/plain",
        content="This server provides tools and resources for testing MCP functionality."
    ),
    Resource(
        uri="file:///config.json",
        name="config",
        description="Configuration settings",
        mimeType="application/json",
        content=json.dumps({
            "version": "1.0.0",
            "features": ["tools", "resources", "prompts"]
        })
    )
]

# Define available prompts
available_prompts = [
    Prompt(
        name="simple",
        description="A simple prompt template with optional context and topic",
        arguments=[
            PromptArgument(
                name="context",
                description="Additional context to consider",
                required=False
            ),
            PromptArgument(
                name="topic",
                description="Specific topic to focus on",
                required=False
            )
        ]
    ),
    Prompt(
        name="analyzer",
        description="Analyzes provided content with specific instructions",
        arguments=[
            PromptArgument(
                name="content",
                description="Content to analyze",
                required=True
            ),
            PromptArgument(
                name="instructions",
                description="Specific analysis instructions",
                required=True
            )
        ]
    )
]

# Create the FastAPI app
app = FastAPI(title="MCP Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to convert objects to dict (handles Pydantic models)
def to_dict(obj):
    if hasattr(obj, "dict"):
        return obj.dict()
    return obj

# Heartbeat/health endpoint
@app.get("/health")
async def health():
    return {
        "status": "operational",
        "uptime": os.getloadavg()[0],  # Use load average as a proxy for uptime
        "version": "1.0.0"
    }

# MCP Status endpoint
@app.get("/status", response_model=MCPStatus)
async def status():
    return {
        "tools": len(available_tools),
        "resources": len(available_resources),
        "prompts": len(available_prompts),
        "status": "operational"
    }

# List tools endpoint
@app.get("/tools")
async def list_tools():
    return [tool.dict() for tool in available_tools]

# List resources endpoint
@app.get("/resources")
async def list_resources():
    # Return resources without the content field
    result = []
    for resource in available_resources:
        res_dict = resource.dict()
        if "content" in res_dict:
            del res_dict["content"]
        result.append(res_dict)
    return result

# Get resource endpoint
@app.get("/resources/{name}")
async def get_resource(name: str):
    resource = next((r for r in available_resources if r.name == name), None)
    if not resource:
        return JSONResponse(
            status_code=404,
            content={"error": "Resource not found"}
        )
    
    if resource.mimeType == "application/json":
        return JSONResponse(content=json.loads(resource.content))
    
    return Response(
        content=resource.content,
        media_type=resource.mimeType
    )

# List prompts endpoint
@app.get("/prompts")
async def list_prompts():
    return [prompt.dict() for prompt in available_prompts]

# SSE endpoint for streaming responses
@app.get("/sse")
async def sse(request: Request):
    async def event_generator():
        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connection', 'message': 'Connected to MCP server'})}\n\n"
        
        # Keep connection alive with periodic pings
        try:
            while True:
                # Check if client is still connected
                if await request.is_disconnected():
                    logger.info("SSE client disconnected")
                    break
                
                # Send a ping event
                yield f"data: {json.dumps({'type': 'ping', 'timestamp': asyncio.get_event_loop().time()})}\n\n"
                
                # Wait for 30 seconds before next ping
                await asyncio.sleep(30)
        except asyncio.CancelledError:
            logger.info("SSE connection was cancelled")
        except Exception as e:
            logger.error(f"Error in SSE connection: {e}")
        finally:
            logger.info("SSE client disconnected")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@click.command()
@click.option("--port", default=3400, help="Port to listen on")
@click.option("--host", default="0.0.0.0", help="Host to bind to")
def main(port: int, host: str):
    # Run the server
    logger.info(f"MCP Server running at http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    main()