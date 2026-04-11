from decimal import Decimal

from loguru import logger
from openai.types.responses.response_usage import ResponseUsage
from pydantic import BaseModel

from src.settings import OpenAIModel


class OpenAIUsageCostRate(BaseModel):
    """OpenAI usage cost rate per 1M tokens."""

    input: Decimal
    cached_input: Decimal
    output: Decimal


OPENAI_USAGE_COST_RATES: dict[OpenAIModel, OpenAIUsageCostRate] = {
    "gpt-4o-mini": OpenAIUsageCostRate(
        input=Decimal("0.15"),
        cached_input=Decimal("0.075"),
        output=Decimal("0.60"),
    ),
    "gpt-5-nano": OpenAIUsageCostRate(
        input=Decimal("0.05"),
        cached_input=Decimal("0.005"),
        output=Decimal("0.40"),
    ),
    "gpt-5.4-nano": OpenAIUsageCostRate(
        input=Decimal("0.20"),
        cached_input=Decimal("0.02"),
        output=Decimal("1.25"),
    ),
}

TOKENS_PER_MILLION = Decimal("1000000")


def calculate_openai_usage_cost(
    model: OpenAIModel, usage: ResponseUsage | None
) -> str | None:
    rate = OPENAI_USAGE_COST_RATES.get(model)
    if rate is None:
        logger.debug("Could not calculate OpenAI usage cost", model=model)
        return None

    if usage is None:
        logger.debug(
            "Could not calculate OpenAI usage cost",
            model=model,
            reason="usage is None",
        )
        return None

    cached_input_tokens = usage.input_tokens_details.cached_tokens
    uncached_input_tokens = usage.input_tokens - cached_input_tokens
    cost = (
        Decimal(uncached_input_tokens) * rate.input
        + Decimal(cached_input_tokens) * rate.cached_input
        + Decimal(usage.output_tokens) * rate.output
    ) / TOKENS_PER_MILLION

    usage_cost = f"{cost:.8f}"
    logger.debug(
        "Calculated OpenAI usage cost",
        model=model,
        input_tokens=usage.input_tokens,
        cached_input_tokens=cached_input_tokens,
        uncached_input_tokens=uncached_input_tokens,
        output_tokens=usage.output_tokens,
        usage_cost=usage_cost,
    )

    return usage_cost
