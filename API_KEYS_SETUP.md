# API Keys Setup Guide

このプロジェクトを完全に動作させるために、以下のAPIキーが必要です。

## 🗺️ Google Maps API Key (必須)

### 取得方法:
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. "APIs & Services" > "Library" に移動
4. 以下のAPIを有効にする:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Geolocation API
5. "APIs & Services" > "Credentials" に移動
6. "Create Credentials" > "API Key" をクリック
7. APIキーを制限（推奨）:
   - Application restrictions: HTTP referrers
   - API restrictions: 上記で有効にしたAPIs

### 環境変数:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 使用箇所:
- フロントエンドの地図表示
- 住所のジオコーディング
- 近隣施設検索

---

## 🤖 OpenAI API Key (AI機能用)

### 取得方法:
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウント作成またはログイン
3. "API Keys" セクションに移動
4. "Create new secret key" をクリック
5. キーをコピーして安全に保存

### 環境変数:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 使用箇所:
- AI研究サービス
- ゴミ箱情報の自動分析
- テキスト処理

---

## 🔍 Google AI API Key (Gemini) (オプション)

### 取得方法:
1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. "Get API Key" をクリック
3. Google Cloudプロジェクトを選択
4. APIキーを生成

### 環境変数:
```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### 使用箇所:
- OpenAIの代替として使用
- マルチモーダル分析（画像+テキスト）

---

## 💰 料金について

### Google Maps API:
- 月額$200のクレジット付き
- 超過後は従量課金
- 詳細: [Google Maps Platform Pricing](https://cloud.google.com/maps-platform/pricing)

### OpenAI API:
- GPT-4: $30/1M tokens (input), $60/1M tokens (output)
- GPT-3.5: $1.50/1M tokens (input), $2.00/1M tokens (output)
- 詳細: [OpenAI Pricing](https://openai.com/pricing)

### Google AI (Gemini):
- Gemini Pro: 無料枠あり
- 詳細: [Google AI Pricing](https://ai.google.dev/pricing)

---

## 🔧 設定方法

1. `.env`ファイルを編集:
```bash
# Google Maps API
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key

# AI API Keys
OPENAI_API_KEY=your_actual_openai_api_key
GOOGLE_AI_API_KEY=your_actual_google_ai_api_key
```

2. サーバーを再起動:
```bash
npm run dev
```

---

## 🧪 テスト用モック設定

開発・テスト環境では、実際のAPIキーなしでも動作するモックを提供しています：

```bash
# .env.test ファイル
GOOGLE_MAPS_API_KEY=test_google_maps_key
OPENAI_API_KEY=test_openai_key
GOOGLE_AI_API_KEY=test_google_ai_key
```

---

## ⚠️ セキュリティ注意事項

1. **APIキーは絶対にGitにコミットしない**
2. **本番環境では環境変数やシークレット管理サービスを使用**
3. **APIキーは定期的にローテーション**
4. **不要な権限は付与しない**
5. **使用量監視を設定**