# セットアップガイド

## 1. Google Maps API キーの設定

### ステップ 1: Google Cloud Consoleでプロジェクトを作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. プロジェクト名: `trash-spot-japan` (推奨)

### ステップ 2: 必要なAPIを有効化
以下のAPIを有効化してください：
1. **Maps JavaScript API**
   - Navigation: APIs & Services → Library
   - 検索: "Maps JavaScript API"
   - "ENABLE" をクリック

2. **Places API**
   - 検索: "Places API"
   - "ENABLE" をクリック

3. **Geocoding API**
   - 検索: "Geocoding API"
   - "ENABLE" をクリック

4. **Directions API**
   - 検索: "Directions API"
   - "ENABLE" をクリック

### ステップ 3: API キーを作成
1. Navigation: APIs & Services → Credentials
2. "CREATE CREDENTIALS" → "API key"
3. 作成されたAPIキーをコピー
4. ⚠️ **重要**: "RESTRICT KEY" でセキュリティを設定
   - Application restrictions: HTTP referrers (web sites)
   - Website restrictions: `http://localhost:3000/*`, `https://yourdomain.com/*`
   - API restrictions: 上記4つのAPIのみ選択

### ステップ 4: .envファイルに設定
```bash
GOOGLE_MAPS_API_KEY=AIzaSyC4kXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 2. OpenAI API キーの設定

### ステップ 1: OpenAIアカウント作成
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウントを作成またはログイン

### ステップ 2: API キーを作成
1. 右上のプロフィール → "View API keys"
2. "Create new secret key" をクリック
3. 名前: `trash-spot-japan`
4. 作成されたキーをコピー（⚠️ 一度しか表示されません）

### ステップ 3: 使用制限を設定（推奨）
1. Settings → Usage limits
2. Hard limit: $50/month（推奨）
3. Soft limit: $30/month（推奨）

### ステップ 4: .envファイルに設定
```bash
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 3. Google AI API キー (Gemini) の設定

### ステップ 1: Google AI Studioにアクセス
1. [Google AI Studio](https://makersuite.google.com/) にアクセス
2. Googleアカウントでログイン

### ステップ 2: API キーを作成
1. "Get API Key" をクリック
2. Google Cloudプロジェクトを選択（Maps APIと同じプロジェクト推奨）
3. "Create API Key in new project" または既存プロジェクトを選択
4. 作成されたキーをコピー

### ステップ 3: .envファイルに設定
```bash
GOOGLE_AI_API_KEY=AIzaSyD5XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 4. データベースの設定

### PostgreSQL + PostGISのインストール

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis postgresql-14-postgis-3
```

#### macOS (Homebrew):
```bash
brew install postgresql postgis
brew services start postgresql
```

#### Windows:
1. [PostgreSQL](https://www.postgresql.org/download/windows/) をダウンロード
2. インストール時に PostGIS も選択

### データベースの作成
```bash
# PostgreSQLに接続
sudo -u postgres psql

# データベース作成
CREATE DATABASE trashspotjapan;
CREATE USER trashspot WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE trashspotjapan TO trashspot;

# PostGIS拡張を有効化
\c trashspotjapan;
CREATE EXTENSION postgis;
```

### .envファイルに設定
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trashspotjapan
DB_USER=trashspot
DB_PASSWORD=your_secure_password
```

## 5. Redisの設定

### Redisのインストール

#### Ubuntu/Debian:
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS (Homebrew):
```bash
brew install redis
brew services start redis
```

#### Windows:
```bash
# WSLまたはDocker推奨
docker run -d -p 6379:6379 redis:alpine
```

## 6. アプリケーションの起動

### 依存関係のインストール
```bash
npm install
```

### データベースマイグレーション
```bash
npm run migrate
```

### サンプルデータの挿入（オプション）
```bash
npm run seed
```

### 開発サーバーの起動
```bash
npm run dev
```

### アクセス確認
ブラウザで `http://localhost:3000` にアクセス

## 7. トラブルシューティング

### よくある問題

#### Google Maps APIエラー
- APIキーが正しく設定されているか確認
- 必要なAPIが有効化されているか確認
- リファラー制限が正しく設定されているか確認

#### データベース接続エラー
- PostgreSQLが起動しているか確認: `sudo systemctl status postgresql`
- データベース名・ユーザー・パスワードが正しいか確認
- PostGIS拡張が有効か確認

#### Redis接続エラー
- Redisが起動しているか確認: `redis-cli ping`
- ポートが正しいか確認（デフォルト: 6379）

### ログの確認
```bash
# アプリケーションログ
tail -f logs/combined.log

# エラーログ
tail -f logs/error.log
```

## 8. 本番環境への移行

### 環境変数の更新
```bash
NODE_ENV=production
PORT=80
# セキュアなパスワードに変更
DB_PASSWORD=secure_production_password
JWT_SECRET=very-long-and-secure-jwt-secret-for-production
```

### セキュリティ設定
- APIキーの制限を本番ドメインに変更
- データベースのファイアウォール設定
- SSL証明書の設定

## コスト見積もり

### Google Maps API（月間）
- 無料枠: 28,500マップロード
- 超過時: $7/1,000リクエスト

### OpenAI API（月間）
- GPT-4: $30/1M入力トークン, $60/1M出力トークン
- 推定: $10-50/月（使用量による）

### Google AI API (Gemini)
- Gemini Pro: 無料枠あり
- 詳細は[pricing](https://ai.google.dev/pricing)を確認

合計推定コスト: **$20-100/月**（使用量による）