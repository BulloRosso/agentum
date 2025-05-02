import os
import logging
import requests
from typing import Optional
from models.workflow import WorkflowList

# Configure logging
logger = logging.getLogger("api.workflows")

class WorkflowService:
    """Service for interacting with n8n workflows API"""
    
    def __init__(self):
        """Initialize the service with environment variables"""
        self.n8n_url = os.environ.get("N8N_URL")
        self.n8n_api_key = os.environ.get("N8N_API_KEY")
        
        if not self.n8n_url:
            logger.warning("N8N_URL environment variable is not set")
        
        if not self.n8n_api_key:
            logger.warning("N8N_API_KEY environment variable is not set")
    
    async def get_workflows(self) -> Optional[WorkflowList]:
        """
        Fetch all workflows from the n8n API
        
        Returns:
            WorkflowList: A list of workflows, or None if an error occurs
        """
        if not self.n8n_url or not self.n8n_api_key:
            logger.error("Cannot fetch workflows: N8N_URL or N8N_API_KEY is not set")
            return None
        
        try:
            # Construct the full URL for the workflows endpoint
            url = f"{self.n8n_url}/api/v1/workflows"
            
            # Set up headers with API key
            headers = {
                "X-N8N-API-KEY": self.n8n_api_key,
                "Accept": "application/json"
            }
            
            # Make the request to n8n API
            logger.info(f"Fetching workflows from {url}")
            response = requests.get(url, headers=headers)
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Parse response JSON into our model
            workflows_data = response.json()
            workflows = WorkflowList(**workflows_data)
            
            logger.info(f"Successfully fetched {len(workflows.data)} workflows")
            return workflows
            
        except requests.RequestException as e:
            logger.error(f"Error fetching workflows from n8n API: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while processing workflow data: {str(e)}")
            return None