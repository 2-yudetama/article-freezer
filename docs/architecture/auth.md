# 認証・認可

この文書は、package をまたぐ認証・認可の境界だけを扱う。

機能仕様は `docs/features/auth.md` を参照する。

## 境界

- `web-app` はアプリユーザの認証・認可を担当する
- `md-extractor` は service 間の Bearer token 認証だけを担当する
- `md-extractor` はアプリユーザの session や userId を扱わない
