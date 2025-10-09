# インサイダー取引規制 eラーニングシステム

PEファンド従業員向けのインサイダー取引規制に関するeラーニングシステムです。

## 🌟 機能

### 受講者向け機能
- ✅ スライド形式の研修コンテンツ
- ✅ 4択形式の確認テスト(10問)
- ✅ 中断・再開機能(24時間保持)
- ✅ 自動採点と解説表示
- ✅ 修了証の発行(合格者のみ)

### 管理者向け機能
- ✅ 受講者管理(追加・削除・詳細表示)
- ✅ コース管理(PowerPointインポート)
- ✅ 受講履歴の閲覧
- ✅ データのエクスポート/インポート
- ✅ ダッシュボード(統計表示)

## 📋 必要要件

- Node.js 18以上
- npm または yarn

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. サーバーの起動

```bash
npm start
```

開発環境では自動リロード付きで起動:

```bash
npm run dev
```

### 3. ブラウザでアクセス

```
http://localhost:3000
```

## 👥 デフォルトアカウント

### 管理者
- ユーザー名: `admin`
- パスワード: `admin123`

### 一般ユーザー
- ユーザー名: `user1`
- パスワード: `user1123`

## 📁 プロジェクト構造

```
elearning-system/
├── server.js           # Expressサーバー
├── package.json        # 依存関係定義
├── public/
│   └── index.html      # フロントエンドアプリ
└── data/               # データ保存用(自動生成)
    ├── database.json   # メインデータベース
    └── progress/       # 進捗データ
        └── {userId}.json
```

## 🌐 Renderへのデプロイ

### 1. GitHubリポジトリの作成

プロジェクトをGitHubにプッシュ:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Renderでの設定

1. [Render](https://render.com)にアクセス
2. 「New」→「Web Service」を選択
3. GitHubリポジトリを接続
4. 以下の設定を入力:
   - **Name**: elearning-system(任意)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free(または有料プラン)

5. 「Create Web Service」をクリック

### 3. デプロイ完了

デプロイが完了すると、`https://your-app-name.onrender.com`でアクセス可能になります。

## 💾 データの永続化

### ローカル環境
データは`data/`ディレクトリに保存されます。

### Render環境
Renderの無料プランではファイルシステムが永続化されないため、以下のオプションがあります:

1. **推奨**: PostgreSQLなどのデータベースに移行
2. **簡易**: 定期的にエクスポート機能でバックアップを取る

## 📤 PowerPointのインポート

### スライド画像のエクスポート手順

1. PowerPointを開く
2. 「ファイル」→「エクスポート」→「ファイル形式の変更」
3. 「PNG」または「JPEG」を選択
4. 「すべてのスライド」を選択してエクスポート
5. 管理画面の「PPTXインポート」タブから画像をアップロード

## 🔧 カスタマイズ

### ポート番号の変更

環境変数`PORT`を設定:

```bash
PORT=8080 npm start
```

### データベースの変更

`server.js`の以下の部分を編集:

```javascript
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');
```

## 🐛 トラブルシューティング

### ポートが使用中のエラー

別のポート番号を使用:

```bash
PORT=3001 npm start
```

### データが保存されない

`data/`ディレクトリの権限を確認:

```bash
chmod 755 data/
```

## 📝 ライセンス

MIT License

## 👨‍💻 開発者向け

### API エンドポイント

- `GET /api/health` - ヘルスチェック
- `GET /api/data` - 全データ取得
- `POST /api/data` - データ保存
- `GET /api/progress/:userId` - 進捗取得
- `POST /api/progress/:userId` - 進捗保存
- `DELETE /api/progress/:userId` - 進捗削除
- `GET /api/export` - データエクスポート
- `POST /api/import` - データインポート
- `DELETE /api/data` - データクリア

### データ構造

```javascript
{
  "users": [...],
  "courses": [...],
  "learningRecords": [...],
  "lastUpdated": "2025-01-XX..."
}
```

## 🙏 サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
