from injector import Binder, Injector

from src.infrastructure.extract.gateway import ExtractGatewayAdapter
from src.infrastructure.translate.gateway import TranslateGatewayAdapter
from src.services.extract import ExtractGateway, ExtractUsecase
from src.services.translate import TranslateGateway, TranslateUsecase


def _configure(binder: Binder):
    """依存関係のバインド"""

    # port
    binder.bind(interface=ExtractGateway, to=ExtractGatewayAdapter)
    binder.bind(interface=TranslateGateway, to=TranslateGatewayAdapter)


_injector = Injector(_configure)


# 依存注入されたユースケースを取得
def get_extract_usecase() -> ExtractUsecase:
    return _injector.get(ExtractUsecase)


def get_translate_usecase() -> TranslateUsecase:
    return _injector.get(TranslateUsecase)
