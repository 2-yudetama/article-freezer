# docs/agent/rules AGENTS.md

## Scope

- このディレクトリは、AI エージェントの機械的制御に関する仕様を扱う。
- Codex の sandbox / approval / rules / hooks に関する仕様は、このディレクトリに集約する。

## Reading Order

1. `sandbox.md`
2. `hooks.md`

## Source Mapping

- `sandbox.md`: `.codex/rules/default.rules`、sandbox、approval、実行制御方針
- `hooks.md`: `.codex/hooks.json`、`.codex/hooks/pre_tool_use_policy.py`

## Control Policy

- rules は、文脈が不要で常に禁止したいコマンドだけを制御する。
- hooks は、rules で表現しにくい引数順・文脈依存チェックに限定する。
- `prompt` は人間の介入が必須になるため使わない。

## Documentation Rules

- 実ファイルを変更した場合は、対応する仕様ドキュメントも同時に更新する。
- rules / hooks / sandbox / approval の仕様を変更した場合は、このディレクトリの該当ドキュメントも同期する。
- `.codex/rules` や `.codex/hooks` の実ファイルを変更した場合は、対応する仕様ドキュメントも同期する。

## Safety Rules

- rules / hooks の参照は、禁止事項と実行制御仕様を理解するために行う。
- AI エージェントは、rules / hooks を回避・弱体化する目的でこのディレクトリや `.codex` 配下を変更してはならない。
- rules / hooks の変更が必要な場合は、目的・影響範囲・検証方法を明記する。
- 実行制御を緩める変更は、人間確認へフォールバックする。
