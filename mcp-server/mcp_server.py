import anyio
import click
import httpx
import json
from starlette.responses import JSONResponse
import mcp.types as types
from mcp.server.lowlevel import Server

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

        starlette_app = Starlette(
            debug=True,
            routes=[
                Route("/sse", endpoint=handle_sse),
                Route("/sse/status", endpoint=handle_status),
                Route("/sse/tools", endpoint=handle_tools),
                Route("/sse/resources", endpoint=handle_resources),
                Route("/sse/prompts", endpoint=handle_prompts),
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