#!/usr/bin/env python3
"""
Database initialization script for AI Genomics Lab.
This script initializes the PostgreSQL database with schema and default data.
Can be run manually or as part of container startup.
"""

import asyncio
import logging
import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database_service import get_database_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_database():
    """Initialize database schema and seed default data"""
    try:
        db_service = get_database_service()
        
        logger.info("Connecting to database...")
        await db_service.connect()
        
        logger.info("Database initialization complete!")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False


async def main():
    """Main entry point"""
    logger.info("Starting database initialization...")
    
    success = await init_database()
    
    if success:
        logger.info("Database initialized successfully!")
        sys.exit(0)
    else:
        logger.error("Database initialization failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())