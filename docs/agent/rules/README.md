# Rules

## Scope

- このディレクトリは、AI エージェントの機械的制御に関する仕様を扱う。
- Codex の sandbox / approval / rules / hooks に関する仕様は、このディレクトリに集約する。
- このディレクトリの文書は、通常のエージェント作業で必ず読むものではなく、実行制御仕様を確認・変更するときに参照する。

## Source Mapping

- `sandbox.md`: `.codex/rules/default.rules`、sandbox、approval、実行制御方針
- `hooks.md`: `.codex/hooks.json`、`.codex/hooks/pre_tool_use_policy.py`、`.codex/hooks/format_after_write.py`

## Control Policy

- rules は、文脈が不要で常に禁止したいコマンドだけを制御する。
- hooks は、rules で表現しにくい引数順・文脈依存チェックに限定する。
- `prompt` は人間の介入が必須になるため使わない。
- Codex の仕様上、通常の実行中エージェントは `.codex` 配下を直接変更できない。
- `.codex` 配下の変更自体を明示スコープに含む issue で Manager が許可した場合のみ、guardrail を弱体化しない最小変更を行う。

## Documentation Rules

- 実ファイルを変更した場合は、対応する仕様ドキュメントも同時に更新する。
- rules / hooks / sandbox / approval の仕様を変更した場合は、このディレクトリの該当ドキュメントも同期する。
- `.codex/rules` や `.codex/hooks` の実ファイルを変更した場合は、対応する仕様ドキュメントも同期する。

## Safety Rules

- rules / hooks の参照は、禁止事項と実行制御仕様を理解するために行う。
- AI エージェントは、rules / hooks を回避・弱体化する目的でこのディレクトリや `.codex` 配下を変更してはならない。
- `.codex/hooks`、`.codex/rules`、`.codex/agents` 配下の変更が必要な場合、エージェントは権限回避を試みず、必要な変更内容をドキュメントへ記録して人間確認へ戻す。
- `.codex` 配下の変更が issue の明示スコープとして採用されている場合も、禁止操作の許可や検証 bypass などの弱体化は行わない。
