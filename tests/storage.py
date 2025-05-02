"""
Test module for the storage service.

This module provides comprehensive tests for the storage services:
- StorageTextFile: For text file handling with Replit object storage
- StorageBinaryFile: For binary file handling with Replit object storage

Run with: python -m unittest tests.storage
"""

import unittest
import os
import json
import tempfile
import random
import string
from pathlib import Path
import sys

# Add the parent directory to the path so we can import the api module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

from api.services.storage import StorageTextFile, StorageBinaryFile


class TestStorageTextFile(unittest.TestCase):
    """Test cases for the StorageTextFile class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.storage = StorageTextFile()
        # Generate a unique ID for this test run to avoid conflicts with other test runs
        self.test_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.test_file_path = f"test_file_{self.test_id}.txt"
        self.test_json_path = f"test_json_{self.test_id}.json"
        self.test_content = "Hello, World!"
        self.test_json_content = {"message": "Hello, World!", "count": 42}

    def tearDown(self):
        """Clean up after each test method."""
        # Remove any files created during the test
        try:
            self.storage.delete(self.test_file_path)
        except:
            pass
        try:
            self.storage.delete(self.test_json_path)
        except:
            pass

    def test_create_and_get(self):
        """Test creating and retrieving a text file."""
        # Create a text file
        result = self.storage.create(self.test_file_path, self.test_content)
        self.assertTrue(result, "Failed to create a text file")

        # Get the file content
        content = self.storage.get(self.test_file_path)
        self.assertEqual(content, self.test_content, "Content doesn't match what was stored")

    def test_create_and_get_json(self):
        """Test creating and retrieving a JSON file."""
        # Create a JSON file
        result = self.storage.create_json(self.test_json_path, self.test_json_content)
        self.assertTrue(result, "Failed to create a JSON file")

        # Get the file content
        content = self.storage.get_json(self.test_json_path)
        self.assertEqual(content, self.test_json_content, "JSON content doesn't match what was stored")

    def test_update(self):
        """Test updating a text file."""
        # Create a text file
        self.storage.create(self.test_file_path, self.test_content)

        # Update the file
        new_content = "Updated content"
        result = self.storage.update(self.test_file_path, new_content)
        self.assertTrue(result, "Failed to update a text file")

        # Get the file content
        content = self.storage.get(self.test_file_path)
        self.assertEqual(content, new_content, "Content wasn't properly updated")

    def test_update_json(self):
        """Test updating a JSON file."""
        # Create a JSON file
        self.storage.create_json(self.test_json_path, self.test_json_content)

        # Update the file
        updated_json = {"message": "Updated message", "count": 100}
        result = self.storage.update_json(self.test_json_path, updated_json)
        self.assertTrue(result, "Failed to update a JSON file")

        # Get the file content
        content = self.storage.get_json(self.test_json_path)
        self.assertEqual(content, updated_json, "JSON content wasn't properly updated")

    def test_delete(self):
        """Test deleting a file."""
        # Create a text file
        self.storage.create(self.test_file_path, self.test_content)

        # Delete the file
        result = self.storage.delete(self.test_file_path)
        self.assertTrue(result, "Failed to delete a file")

        # Try to get the file content
        content = self.storage.get(self.test_file_path)
        self.assertIsNone(content, "File wasn't properly deleted")

    def test_list_files(self):
        """Test listing files."""
        # Create a few files with our test ID to ensure unique names
        file_names = [f"test_list_{self.test_id}_{i}.txt" for i in range(3)]
        for file_name in file_names:
            self.storage.create(file_name, f"Content for {file_name}")

        # Get the list of files
        files = self.storage.list_files()
        
        # Check that all our files are in the list
        for file_name in file_names:
            self.assertIn(file_name, files, f"File {file_name} not found in the list of files")

        # Clean up the files we created specifically for this test
        for file_name in file_names:
            self.storage.delete(file_name)


class TestStorageBinaryFile(unittest.TestCase):
    """Test cases for the StorageBinaryFile class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.storage = StorageBinaryFile()
        # Generate a unique ID for this test run to avoid conflicts
        self.test_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.test_file_path = f"test_binary_{self.test_id}.bin"
        self.test_content = b"\x00\x01\x02\x03\x04\x05"  # Sample binary content

    def tearDown(self):
        """Clean up after each test method."""
        # Remove any files created during the test
        try:
            self.storage.delete(self.test_file_path)
        except:
            pass

    def test_create_and_get(self):
        """Test creating and retrieving a binary file."""
        # Create a binary file
        result = self.storage.create(self.test_file_path, self.test_content)
        self.assertTrue(result, "Failed to create a binary file")

        # Get the file content
        content = self.storage.get(self.test_file_path)
        self.assertEqual(content, self.test_content, "Binary content doesn't match what was stored")

    def test_update(self):
        """Test updating a binary file."""
        # Create a binary file
        self.storage.create(self.test_file_path, self.test_content)

        # Update the file
        new_content = b"\x10\x11\x12\x13\x14\x15"
        result = self.storage.update(self.test_file_path, new_content)
        self.assertTrue(result, "Failed to update a binary file")

        # Get the file content
        content = self.storage.get(self.test_file_path)
        self.assertEqual(content, new_content, "Binary content wasn't properly updated")

    def test_delete(self):
        """Test deleting a binary file."""
        # Create a binary file
        self.storage.create(self.test_file_path, self.test_content)

        # Delete the file
        result = self.storage.delete(self.test_file_path)
        self.assertTrue(result, "Failed to delete a binary file")

        # Try to get the file content
        content = self.storage.get(self.test_file_path)
        self.assertIsNone(content, "Binary file wasn't properly deleted")

    def test_get_to_file_and_create_from_file(self):
        """Test getting a file to local disk and creating from a local file."""
        # Create a binary file in storage
        self.storage.create(self.test_file_path, self.test_content)

        # Create a temporary file to download to
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name

        try:
            # Download to local file
            result = self.storage.get_to_file(self.test_file_path, temp_path)
            self.assertTrue(result, "Failed to download file to local path")

            # Verify the content was properly downloaded
            with open(temp_path, 'rb') as f:
                local_content = f.read()
            self.assertEqual(local_content, self.test_content, "Downloaded content doesn't match original")

            # Create a new file in storage from the local file
            new_storage_path = f"test_from_file_{self.test_id}.bin"
            result = self.storage.create_from_file(new_storage_path, temp_path)
            self.assertTrue(result, "Failed to create file from local path")

            # Verify the content was properly uploaded
            content = self.storage.get(new_storage_path)
            self.assertEqual(content, self.test_content, "Uploaded content doesn't match original")

            # Clean up the new file
            self.storage.delete(new_storage_path)
        finally:
            # Clean up the local file
            os.unlink(temp_path)

    def test_list_files(self):
        """Test listing binary files."""
        # Create a few files with our test ID to ensure unique names
        file_names = [f"test_bin_list_{self.test_id}_{i}.bin" for i in range(3)]
        for file_name in file_names:
            self.storage.create(file_name, f"Content for {file_name}".encode())

        # Get the list of files
        files = self.storage.list_files()
        
        # Check that all our files are in the list
        for file_name in file_names:
            self.assertIn(file_name, files, f"File {file_name} not found in the list of files")

        # Clean up the files we created specifically for this test
        for file_name in file_names:
            self.storage.delete(file_name)


if __name__ == '__main__':
    unittest.main()