# This file makes the services directory a Python package
from .storage import StorageTextFile, StorageBinaryFile

__all__ = ["StorageTextFile", "StorageBinaryFile"]