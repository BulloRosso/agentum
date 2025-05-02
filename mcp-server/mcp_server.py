import json
import logging
import os
from typing import Dict, Any, List, Optional

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("mcp-server")

# FastAPI and other imports
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import click
import asyncio
import uvicorn

# Sample data for our MCP server
SAMPLE_TOOLS = [
    {
        "name": "fetch",
        "description": "Fetches a website and returns its content",
        "inputSchema": {
            "type": "object",
            "required": ["url"],
            "properties": {
                "url": {
                    "type": "string",
                    "description": "URL to fetch",
                }
            }
        }
    },
    {
        "name": "saveFile",
        "description": "Saves content to a file",
        "inputSchema": {
            "type": "object",
            "required": ["filename", "content"],
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Name of the file to save",
                },
                "content": {
                    "type": "string", 
                    "description": "Content to save",
                }
            }
        }
    }
]

SAMPLE_RESOURCES = [
    {
        "uri": "file:///greeting.txt",
        "name": "greeting",
        "description": "A welcome message",
        "mimeType": "text/plain",
        "content": "Hello! Welcome to the MCP server."
    },
    {
        "uri": "file:///help.txt",
        "name": "help",
        "description": "Help information",
        "mimeType": "text/plain",
        "content": "This server provides tools and resources for testing MCP functionality."
    },
    {
        "uri": "file:///config.json",
        "name": "config",
        "description": "Configuration settings",
        "mimeType": "application/json",
        "content": json.dumps({
            "version": "1.0.0",
            "features": ["tools", "resources", "prompts"]
        })
    }
]

SAMPLE_PROMPTS = [
    {
        "name": "simple",
        "description": "A simple prompt template with optional context and topic",
        "arguments": [
            {
                "name": "context",
                "description": "Additional context to consider",
                "required": False
            },
            {
                "name": "topic",
                "description": "Specific topic to focus on",
                "required": False
            }
        ]
    },
    {
        "name": "analyzer",
        "description": "Analyzes provided content with specific instructions",
        "arguments": [
            {
                "name": "content",
                "description": "Content to analyze",
                "required": True
            },
            {
                "name": "instructions",
                "description": "Specific analysis instructions",
                "required": True
            }
        ]
    }
]

# Create FastAPI app
app = FastAPI(title="MCP Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Heartbeat/health endpoint
@app.get("/health")
async def health():
    return {
        "status": "operational",
        "uptime": os.getloadavg()[0],  # Use load average as a proxy for uptime
        "version": "1.0.0"
    }

# MCP Status endpoint - both base and SSE paths
@app.get("/status")
@app.get("/sse/status")
async def status():
    return {
        "tools": len(SAMPLE_TOOLS),
        "resources": len(SAMPLE_RESOURCES),
        "prompts": len(SAMPLE_PROMPTS),
        "status": "operational"
    }

# List tools endpoint - both base and SSE paths
@app.get("/tools")
@app.get("/sse/tools")
async def list_tools():
    return SAMPLE_TOOLS

# List resources endpoint - both base and SSE paths
@app.get("/resources")
@app.get("/sse/resources")
async def list_resources():
    # Return resources without the content field
    return [{k: v for k, v in r.items() if k != 'content'} for r in SAMPLE_RESOURCES]

# Get resource endpoint - both base and SSE paths
@app.get("/resources/{name}")
@app.get("/sse/resources/{name}")
async def get_resource(name: str):
    resource = next((r for r in SAMPLE_RESOURCES if r["name"] == name), None)
    if not resource:
        return JSONResponse(
            status_code=404,
            content={"error": "Resource not found"}
        )
    
    if resource["mimeType"] == "application/json":
        return JSONResponse(content=json.loads(resource["content"]))
    
    return Response(
        content=resource["content"],
        media_type=resource["mimeType"]
    )

# List prompts endpoint - both base and SSE paths
@app.get("/prompts")
@app.get("/sse/prompts")
async def list_prompts():
    return SAMPLE_PROMPTS

# Create messages for a prompt
def create_messages(context: Optional[str] = None, topic: Optional[str] = None):
    messages = []
    
    # Add context if provided
    if context:
        messages.append({
            "role": "user",
            "content": {
                "type": "text",
                "text": f"Here is some relevant context: {context}"
            }
        })
    
    # Add the main prompt
    prompt = "Please help me with "
    if topic:
        prompt += f"the following topic: {topic}"
    else:
        prompt += "whatever questions I may have."
    
    messages.append({
        "role": "user",
        "content": {
            "type": "text",
            "text": prompt
        }
    })
    
    return messages

# Get prompt with arguments - both base and SSE paths
@app.post("/prompts/{name}")
@app.post("/sse/prompts/{name}")
async def get_prompt(name: str, arguments: Dict[str, Any]):
    prompt = next((p for p in SAMPLE_PROMPTS if p["name"] == name), None)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"Unknown prompt: {name}")
    
    if name == "simple":
        context = arguments.get("context")
        topic = arguments.get("topic")
        return create_messages(context, topic)
    
    raise HTTPException(status_code=400, detail="Not implemented for this prompt")

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
    logger.info(f"MCP Server running at http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    main()