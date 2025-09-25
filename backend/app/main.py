from .database import create_db_and_tables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.taskiq_config import nats_broker
from .routers import router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Task Tracker API",
        description="Backend API for Task Tracker dashboard",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, specify exact origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)

    return app


app = create_app()


@app.on_event("startup")
async def startup():
    """Initialize database and TaskIQ broker on startup"""
    await create_db_and_tables()
    if not nats_broker.is_worker_process:
        await nats_broker.startup()


@app.on_event("shutdown")
async def shutdown():
    """Shutdown TaskIQ broker on application shutdown"""
    if not nats_broker.is_worker_process:
        await nats_broker.shutdown()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
