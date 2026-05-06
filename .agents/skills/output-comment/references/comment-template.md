# issue コメントテンプレート

```md
# AI: {コメント種別}

Loop: {番号}

{Output または Manager コメント本文}
```

修正ループではないコメントの場合、`Loop` 行は省略する。
`Loop: {番号}` は最初の修正ループを 1 とし、Generator と Evaluator の再実行サイクルごとに 1 ずつ増やす。
