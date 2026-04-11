from __future__ import annotations

import json
import sys

import loguru
from loguru import logger

from src.settings import settings


def _format_log(record: loguru.Record) -> str:
    if settings.log_format == "json":
        payload = {
            "time": record["time"].isoformat(),
            "level": record["level"].name,
            "name": record["name"],
            "function": record["function"],
            "line": record["line"],
            "message": record["message"],
            **record["extra"],
        }
        record["extra"]["payload"] = json.dumps(payload, ensure_ascii=False)
        return "{extra[payload]}\n"
    else:
        record["extra"]["payload"] = json.dumps(
            record["extra"], ensure_ascii=False
        )
        return (
            f"<green>{record['time']:YYYY-MM-DD HH:mm:ss ZZ}</green> | "
            f"<level>{record['level'].name}</level> | "
            f"<cyan>{record['name']}</cyan>:<cyan>{record['function']}</cyan>"
            f":<cyan>{record['line']}</cyan> | "
            f"<level>{record['message']}</level> | "
            "{extra[payload]}\n"
        )


def create_logger() -> None:
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level,
        colorize=True,
        format=_format_log,
    )
