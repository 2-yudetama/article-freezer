from __future__ import annotations

import json
import sys
import traceback

import loguru
from loguru import logger

from src.settings import settings


def _format_exception(record: loguru.Record) -> dict[str, str] | None:
    exception = record["exception"]
    if exception is None or exception.type is None or exception.value is None:
        return None

    return {
        "type": exception.type.__name__,
        "message": str(exception.value),
        "traceback": "".join(
            traceback.format_exception(
                exception.type,
                exception.value,
                exception.traceback,
            )
        ),
    }


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
        exception = _format_exception(record)
        if exception is not None:
            payload["exception"] = exception

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
            "{extra[payload]}\n{exception}"
        )


def create_logger() -> None:
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level,
        colorize=True,
        format=_format_log,
        diagnose=False,
        backtrace=False,
    )
