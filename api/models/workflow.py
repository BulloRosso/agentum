from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WorkflowTag(BaseModel):
    """Model representing a tag associated with a workflow"""
    id: str = Field(..., description="Unique identifier of the tag")
    name: str = Field(..., description="Name of the tag")
    created_at: datetime = Field(..., description="Timestamp when the tag was created", alias="createdAt")
    updated_at: datetime = Field(..., description="Timestamp when the tag was last updated", alias="updatedAt")

    class Config:
        populate_by_name = True


class Workflow(BaseModel):
    """Model representing an n8n workflow"""
    id: str = Field(..., description="Unique identifier of the workflow")
    name: str = Field(..., description="Name of the workflow")
    active: bool = Field(..., description="Whether the workflow is active")
    tags: Optional[List[WorkflowTag]] = Field(None, description="Tags associated with the workflow")

    class Config:
        populate_by_name = True


class WorkflowList(BaseModel):
    """Model representing a list of workflows with pagination info"""
    data: List[Workflow] = Field(..., description="List of workflows")
    next_cursor: Optional[str] = Field(None, description="Cursor for pagination", alias="nextCursor")

    class Config:
        populate_by_name = True