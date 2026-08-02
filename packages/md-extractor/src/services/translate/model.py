from pydantic import BaseModel, Field


class TranslatedMarkdown(BaseModel):
    """記事Markdownの言語判定と日本語への翻訳結果

    - 原文が日本語の場合は翻訳しない
    - Markdownの構造を維持して記事本文だけを翻訳する
    """

    source_language: str = Field(
        description="""
原文で主に使用されている言語のBCP 47言語コード。

例:
- 日本語: ja
- 英語: en
- 中国語（簡体字）: zh-Hans
""".strip(),
    )
    translated_markdown: str | None = Field(
        description="""
原文を日本語に翻訳したMarkdown

原文が日本語の場合はnull

翻訳時の規則:
- 見出し、段落、箇条書き、引用、表などのMarkdown構造を維持する
- コードブロックとインラインコードの内容は翻訳しない
- URLと画像URLは変更しない
- リンクテキストと画像の代替テキストは自然な日本語に翻訳する
- 製品名、サービス名、人名などの固有名詞は文脈に適した表記にする
- 原文の情報を追加または省略しない
""".strip(),
    )
