# This file makes the routes directory a Python package
from .storage_routes import router as storage_router

__all__ = ["storage_router"]