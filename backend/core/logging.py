import sys

from loguru import logger

from config import settings


def setup_logging():
    """Setup logging configuration"""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level=settings.log_level,
    )
