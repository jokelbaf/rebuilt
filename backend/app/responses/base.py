import typing

from fastapi import status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def envelope(
    data: typing.Any = None,
    message: str = "OK",
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    """Build a standard `{ message, data }` JSON response."""
    return JSONResponse(
        content={"message": message, "data": jsonable_encoder(data, by_alias=True)},
        status_code=status_code,
    )


def ok(data: typing.Any = None, message: str = "OK") -> JSONResponse:
    """Build a successful `{ message, data }` response."""
    return envelope(data=data, message=message, status_code=status.HTTP_200_OK)
