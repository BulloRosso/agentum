import anyio
import click
import httpx
import json
from starlette.responses import JSONResponse
import mcp.types as types
from mcp.server.lowlevel import Server
from pydantic import FileUrl

# Sample resource content
SAMPLE_RESOURCES = {
    "greeting": "Hello! Welcome to the MCP server implementation.",
    "help": "This server provides API endpoints for tools, resources, and prompts.",
    "config": '{"version": "1.0", "mode": "development", "features": ["tools", "resources", "prompts"]}'
}

async def fetch_website(
    url: str,
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    headers = {
        "User-Agent": "MCP Test Server (github.com/modelcontextprotocol/python-sdk)"
    }
    async with httpx.AsyncClient(follow_redirects=True, headers=headers) as client:
        response = await client.get(url)
        response.raise_for_status()
        return [types.TextContent(type="text", text=response.text)]

def create_messages(
    context: str | None = None, topic: str | None = None
) -> list[types.PromptMessage]:
    """Create the messages for the simple prompt."""
    messages = []

    # Add context if provided
    if context:
        messages.append(
            types.PromptMessage(
                role="user",
                content=types.TextContent(
                    type="text", text=f"Here is some relevant context: {context}"
                ),
            )
        )

    # Add the main prompt
    prompt = "Please help me with "
    if topic:
        prompt += f"the following topic: {topic}"
    else:
        prompt += "whatever questions I may have."

    messages.append(
        types.PromptMessage(
            role="user", content=types.TextContent(type="text", text=prompt)
        )
    )

    return messages

def create_analyzer_messages(
    content: str, instructions: str
) -> list[types.PromptMessage]:
    """Create the messages for the analyzer prompt."""
    messages = []

    messages.append(
        types.PromptMessage(
            role="user",
            content=types.TextContent(
                type="text", 
                text=f"Please analyze the following content according to these instructions:\n\nInstructions: {instructions}\n\nContent: {content}"
            ),
        )
    )

    return messages


@click.command()
@click.option("--port", default=3400, help="Port to listen on for SSE")
@click.option(
    "--transport",
    type=click.Choice(["stdio", "sse"]),
    default="stdio",
    help="Transport type",
)
def main(port: int, transport: str) -> int:
    app = Server("mcp-website-fetcher")

    # Sample data for API responses
    tools_data = [
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
                },
            },
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
                        "description": "Name of the file to save"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to save"
                    }
                }
            }
        }
    ]
    
    resources_data = [
        {
            "uri": "file:///greeting.txt",
            "name": "greeting",
            "description": "A welcome message",
            "mimeType": "text/plain"
        },
        {
            "uri": "file:///help.txt",
            "name": "help",
            "description": "Help information",
            "mimeType": "text/plain"
        },
        {
            "uri": "file:///config.json",
            "name": "config",
            "description": "Configuration settings",
            "mimeType": "application/json"
        }
    ]
    
    prompts_data = [
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
    
    status_data = {
        "tools": len(tools_data),
        "resources": len(resources_data),
        "prompts": len(prompts_data),
        "status": "operational"
    }

    @app.call_tool()
    async def fetch_tool(
        name: str, arguments: dict
    ) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
        if name != "fetch":
            raise ValueError(f"Unknown tool: {name}")
        if "url" not in arguments:
            raise ValueError("Missing required argument 'url'")
        return await fetch_website(arguments["url"])

    @app.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name="fetch",
                description="Fetches a website and returns its content",
                inputSchema={
                    "type": "object",
                    "required": ["url"],
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "URL to fetch",
                        }
                    },
                },
            )
        ]
        
    @app.list_resources()
    async def list_resources() -> list[types.Resource]:
        return [
            types.Resource(
                uri=FileUrl(f"file:///{name}.txt" if name != "config" else "file:///config.json"),
                name=name,
                description=f"A sample resource named {name}",
                mimeType="text/plain" if name != "config" else "application/json",
            )
            for name in SAMPLE_RESOURCES.keys()
        ]

    @app.read_resource()
    async def read_resource(uri: FileUrl) -> str | bytes:
        # Extract the resource name from the URI
        path = uri.path.lstrip("/")
        name = path.replace(".txt", "").replace(".json", "")

        if name not in SAMPLE_RESOURCES:
            raise ValueError(f"Unknown resource: {uri}")

        return SAMPLE_RESOURCES[name]
        
    @app.list_prompts()
    async def list_prompts() -> list[types.Prompt]:
        return [
            types.Prompt(
                name="simple",
                description="A simple prompt template with optional context and topic arguments",
                arguments=[
                    types.PromptArgument(
                        name="context",
                        description="Additional context to consider",
                        required=False,
                    ),
                    types.PromptArgument(
                        name="topic",
                        description="Specific topic to focus on",
                        required=False,
                    ),
                ],
            ),
            types.Prompt(
                name="analyzer",
                description="Analyzes provided content with specific instructions",
                arguments=[
                    types.PromptArgument(
                        name="content",
                        description="Content to analyze",
                        required=True,
                    ),
                    types.PromptArgument(
                        name="instructions",
                        description="Specific analysis instructions",
                        required=True,
                    ),
                ],
            ),
        ]

    @app.get_prompt()
    async def get_prompt(
        name: str, arguments: dict[str, str] | None = None
    ) -> types.GetPromptResult:
        if arguments is None:
            arguments = {}
            
        if name == "simple":
            return types.GetPromptResult(
                messages=create_messages(
                    context=arguments.get("context"), 
                    topic=arguments.get("topic")
                ),
                description="A simple prompt with optional context and topic",
            )
        elif name == "analyzer":
            if "content" not in arguments:
                raise ValueError("Missing required argument 'content'")
            if "instructions" not in arguments:
                raise ValueError("Missing required argument 'instructions'")
                
            return types.GetPromptResult(
                messages=create_analyzer_messages(
                    content=arguments["content"],
                    instructions=arguments["instructions"]
                ),
                description="Analyzes provided content with specific instructions",
            )
        else:
            raise ValueError(f"Unknown prompt: {name}")

    if transport == "sse":
        from mcp.server.sse import SseServerTransport
        from starlette.applications import Starlette
        from starlette.routing import Mount, Route

        sse = SseServerTransport("/")

        async def handle_sse(request):
            async with sse.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                await app.run(
                    streams[0], streams[1], app.create_initialization_options()
                )
                
        # HTTP API handlers
        async def handle_status(request):
            return JSONResponse(status_data)
            
        async def handle_tools(request):
            return JSONResponse(tools_data)
            
        async def handle_resources(request):
            return JSONResponse(resources_data)
            
        async def handle_prompts(request):
            return JSONResponse(prompts_data)
            
        # Resource-specific handlers
        async def handle_resource_content(request):
            resource_name = request.path_params["resource_name"]
            extension = ".json" if resource_name == "config" else ".txt"
            content_type = "application/json" if resource_name == "config" else "text/plain"
            
            if resource_name not in SAMPLE_RESOURCES:
                return JSONResponse({"error": f"Resource {resource_name} not found"}, status_code=404)
                
            from starlette.responses import Response
            return Response(content=SAMPLE_RESOURCES[resource_name], media_type=content_type)
            
        # Prompt-specific handlers
        async def handle_prompt_get(request):
            prompt_name = request.path_params["prompt_name"]
            
            if prompt_name not in ["simple", "analyzer"]:
                return JSONResponse({"error": f"Prompt {prompt_name} not found"}, status_code=404)
                
            if prompt_name == "simple":
                details = {
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
                }
            else:
                details = {
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
                
            return JSONResponse(details)
            
        # Process prompt execution requests
        async def handle_prompt_post(request):
            prompt_name = request.path_params["prompt_name"]
            
            if prompt_name not in ["simple", "analyzer"]:
                return JSONResponse({"error": f"Prompt {prompt_name} not found"}, status_code=404)
            
            try:
                body = await request.json()
            except:
                return JSONResponse({"error": "Invalid JSON request"}, status_code=400)
                
            if prompt_name == "simple":
                # Generate a sample response
                response = [{
                    "role": "assistant",
                    "content": {
                        "type": "text",
                        "text": "I'm here to help! " + 
                               (f"I'll consider the context: {body.get('context', 'No context provided')}. " if "context" in body else "") +
                               (f"Let me address your topic: {body.get('topic', 'general questions')}." if "topic" in body else "What would you like to know?")
                    }
                }]
                return JSONResponse(response)
                
            elif prompt_name == "analyzer":
                # Check for required arguments
                if "content" not in body:
                    return JSONResponse({"error": "Missing required argument 'content'"}, status_code=400)
                if "instructions" not in body:
                    return JSONResponse({"error": "Missing required argument 'instructions'"}, status_code=400)
                    
                # Generate a sample analyzer response
                response = [{
                    "role": "assistant",
                    "content": {
                        "type": "text",
                        "text": f"Analysis based on instructions: '{body['instructions']}':\n\n" +
                               f"Content analyzed: '{body['content']}'\n\n" +
                               f"Sample analysis results: This is a demonstration of the analyzer prompt functionality."
                    }
                }]
                return JSONResponse(response)

        # Import starlette HTTP methods
        from starlette.routing import Route, Mount
        
        starlette_app = Starlette(
            debug=True,
            routes=[
                Route("/sse", endpoint=handle_sse),
                Route("/sse/status", endpoint=handle_status),
                Route("/sse/tools", endpoint=handle_tools),
                Route("/sse/resources", endpoint=handle_resources),
                Route("/sse/prompts", endpoint=handle_prompts),
                Route("/sse/resources/{resource_name}", endpoint=handle_resource_content),
                Route("/sse/prompts/{prompt_name}", endpoint=handle_prompt_get, methods=["GET"]),
                Route("/sse/prompts/{prompt_name}", endpoint=handle_prompt_post, methods=["POST"]),
                Mount("/", app=sse.handle_post_message),
            ],
        )

        import uvicorn

        uvicorn.run(starlette_app, host="0.0.0.0", port=port)
    else:
        from mcp.server.stdio import stdio_server

        async def arun():
            async with stdio_server() as streams:
                await app.run(
                    streams[0], streams[1], app.create_initialization_options()
                )

        anyio.run(arun)

    return 0

if __name__ == "__main__":
    main()