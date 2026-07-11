import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


def _serialize_datetime(value: datetime.datetime) -> str:
    """Serialize timestamps as unambiguous UTC ISO strings."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=datetime.UTC)
    return value.astimezone(datetime.UTC).isoformat().replace("+00:00", "Z")


class CamelModel(BaseModel):
    """Base schema that (de)serializes using camelCase aliases."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        json_encoders={datetime.datetime: _serialize_datetime},
    )
