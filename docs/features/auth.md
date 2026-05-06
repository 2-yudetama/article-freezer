# 認証・認可

## 概要

認証・認可機能は、GitHub OAuth でサインインしたユーザに対して、ユーザ単位の画面と API へのアクセスを制御する機能。

## web-app

- Auth.js と GitHub provider を使う
- session strategy は JWT
- サインイン時に GitHub account と `users` を紐づける
- `/users/[userId]/*` は、URL の `userId` とログインユーザ ID が一致する場合だけ許可する
- ユーザ単位の API route は `authorizeUserApiRequest` で `userId`、所有者、`role` を確認する
- `role !== 1` のユーザは暫定的に API 利用を制限する

## md-extractor

- `POST /api/extract` は Bearer token 認証を使う
- `web-app` は `MD_EXTRACTOR_API_SECRET_KEY` を使って `md-extractor` を呼び出す
- `md-extractor` はアプリユーザの session や userId を扱わない
