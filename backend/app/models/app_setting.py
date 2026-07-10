from sqlmodel import Field, SQLModel


class AppSetting(SQLModel, table=True):
    """A persisted application preference."""

    key: str = Field(primary_key=True)
    value: str
