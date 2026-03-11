from injector import Binder, Injector

from src.infrastructure.extract.gateway import ExtractGatewayAdapter
from src.services.extract import ExtractGateway, ExtractUsecase


def _configure(binder: Binder):
    """依存関係のバインド"""

    # port
    binder.bind(interface=ExtractGateway, to=ExtractGatewayAdapter)


_injector = Injector(_configure)


# 依存注入されたユースケースを取得
def get_extract_usecase() -> ExtractUsecase:
    return _injector.get(ExtractUsecase)
