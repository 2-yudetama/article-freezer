# Hooks

## 目的

rules で表現しにくい引数順・文脈依存チェックを hooks で補完する。
hooks は rules と同じく guardrail として扱い、ロール判定や issue スコープ判定の正本にはしない。

## 基本方針

- hooks は `PreToolUse` の `Bash` に限定する
- rules で制御できる文脈不要の禁止操作は rules に寄せる
- hooks では引数順・現在ブランチ・staged files など、実行直前の状態が必要なものを確認する

## 配置

```txt
.codex/hooks.json
.codex/hooks/pre_tool_use_policy.py
```

## 有効化条件

hooks の利用には Codex の `codex_hooks` feature flag を有効にする必要がある。

## deny 対象

### `gh api` の DELETE 相当操作

`--method DELETE`、`--method=DELETE`、`-X DELETE`、引数内の `DELETE` を検出した場合は deny する。

### `git push` 前のブランチ名不一致

現在ブランチが `issue/` で始まらない場合は deny する。

### staged files がない状態での `git commit`

`git diff --cached --name-only` が空の場合は deny する。

### rules で拾いきれない広範囲 stage

`git add` の対象に `.`, `-A`, `--all`, `-u`, `:/` が含まれる場合は deny する。

### rules で拾いきれない再帰削除

`rm` の引数から再帰削除相当と判断できる場合は deny する。

### 変更破棄を伴う `git checkout --`

`git checkout` の引数に `--` が含まれる場合は deny する。

## 運用上の注意

- hooks はシェル実行経路のすべてを完全に捕捉するものではない
- hook の deny は、明確に禁止できる操作に限定する
- lint や自動フォーマットなどの hooks を追加する場合は、このファイルへ追記する
