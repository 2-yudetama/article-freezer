```mermaid
erDiagram
    users {
        UUID user_id PK "user.id"
        TEXT provider "account.provider (providerAccountIdと複合UK)"
        TEXT provider_account_id "account.providerAccountId (providerと複合UK)"
        TEXT name "user.name"
        TEXT email "user.email"
        TEXT image "user.image"
        INTEGER role "利用ユーザ制限用"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    articles {
        UUID article_id PK
        UUID user_id FK
        TEXT title
        VARCHAR published_date
        TEXT content
        BOOLEAN is_favorite
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    article_sources {
        UUID article_id PK, FK
        VARCHAR type
        TEXT url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    article_comments {
        UUID comment_id PK
        UUID article_id FK, UK
        UUID user_id FK
        TEXT comment
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    article_tags {
        UUID tag_id PK
        UUID user_id FK
        VARCHAR name "user_id と複合UK"
        VARCHAR color
        VARCHAR description
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    article_tags_articles {
        UUID article_id PK, FK
        UUID tag_id PK, FK
    }

    users ||--o{ articles : owns
    articles ||--|| article_sources : has
    articles ||--o| article_comments : has
    users ||--o{ article_comments : writes
    users ||--o{ article_tags : owns
    articles ||--o{ article_tags_articles : has
    article_tags ||--o{ article_tags_articles : has
```
