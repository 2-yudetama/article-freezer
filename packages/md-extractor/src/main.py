import uvicorn

from src.settings import settings
from src.app import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.hot_reload,
    )
