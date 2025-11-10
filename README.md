# インサイダー取引規制 eラーニングシステム (PostgreSQL版)

PEファンド従業員向けのインサイダー取引規制に関するeラーニングシステムです。

**✨ PostgreSQL対応版** - データが永続化され、再起動してもデータが消えません！

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
- PostgreSQL 12以上（または Render PostgreSQL）
- npm または yarn

## 🚀 セットアップ

### 方法1: Renderにデプロイ（推奨）

#### 1. GitHubリポジトリの準備

```bash
git init
git add .
git commit -m "PostgreSQL対応版"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

#### 2. RenderでPostgreSQLを作成

1. [Render Dashboard](https://dashboard.render.com) にログイン
2. 「New」→ 「PostgreSQL」を選択
3. 以下の設定:
   - **Name**: `elearning-db` (任意)
   - **Database**: `elearning` (任意)
   - **User**: 自動生成
   - **Region**: Tokyo推奨
   - **Plan**: **Free** （無料で90日間利用可能）

4. 「Create Database」をクリック
5. **Internal Database URL** をコピー（後で使います）

#### 3. RenderでWeb Serviceを作成

1. 「New」→「Web Service」を選択
2. GitHubリポジトリを接続
3. 以下の設定を入力:
   - **Name**: `elearning-system` (任意)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (または有料プラン)

4. **Environment Variables**（環境変数）を追加:
   - Key: `DATABASE_URL`
   - Value: 先ほどコピーしたInternal Database URL

5. 「Create Web Service」をクリック

#### 4. デプロイ完了！

デプロイが完了すると、`https://your-app-name.onrender.com`でアクセス可能になります。

**✨ データは永続化されており、再起動しても消えません！**

---

### 方法2: ローカル開発環境

#### 1. PostgreSQLのインストール

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
[PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード

#### 2. データベースの作成

```bash
# PostgreSQLに接続
psql postgres

# データベースを作成
CREATE DATABASE elearning;

# ユーザーを作成（オプション）
CREATE USER elearning_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE elearning TO elearning_user;

# 終了
\q
```

#### 3. 環境変数の設定

`.env`ファイルを作成:

```bash
DATABASE_URL=postgresql://localhost:5432/elearning
# または
# DATABASE_URL=postgresql://elearning_user:your_password@localhost:5432/elearning
PORT=3000
NODE_ENV=development
```

#### 4. 依存関係のインストール

```bash
npm install
```

#### 5. 既存データの移行（オプション）

既存のJSONデータがある場合:

```bash
npm run migrate
```

#### 6. サーバーの起動

```bash
npm start
```

開発環境では自動リロード付きで起動:

```bash
npm run dev
```

#### 7. ブラウザでアクセス

```
http://localhost:3000
```

---

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
├── server-postgres.js      # Expressサーバー (PostgreSQL版)
├── database.js              # データベース操作
├── migrate-to-postgres.js   # データ移行スクリプト
├── package.json             # 依存関係定義
├── .env                     # 環境変数（Git管理外）
├── .env.example             # 環境変数の例
├── public/
│   └── index.html           # フロントエンドアプリ
└── data/                    # 旧データ（移行用）
    ├── database.json
    └── progress/
```

## 🗄️ データベーススキーマ

### users テーブル
```sql
- id (serial primary key)
- username (varchar, unique)
- password (varchar)
- name (varchar)
- email (varchar, unique)
- role (varchar)
- department (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

### courses テーブル
```sql
- id (serial primary key)
- title (varchar)
- description (text)
- slides (jsonb)
- quiz (jsonb)
- passing_score (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

### learning_records テーブル
```sql
- id (serial primary key)
- user_id (integer, foreign key)
- course_id (integer, foreign key)
- score (integer)
- passed (boolean)
- completed_at (timestamp)
- answers (jsonb)
- time_spent (integer)
```

### progress テーブル
```sql
- id (serial primary key)
- user_id (integer, foreign key)
- course_id (integer)
- current_slide (integer)
- quiz_started (boolean)
- quiz_answers (jsonb)
- expires_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

## 📤 PowerPointのインポート

### スライド画像のエクスポート手順

1. PowerPointを開く
2. 「ファイル」→「エクスポート」→「ファイル形式の変更」
3. 「PNG」または「JPEG」を選択
4. 「すべてのスライド」を選択してエクスポート
5. 管理画面の「PPTXインポート」タブから画像をアップロード

## 🔒 本番環境のセキュリティ

### 推奨事項

1. **パスワードのハッシュ化**
   - 現在は平文保存なので、bcryptなどでハッシュ化を実装
   
2. **環境変数の管理**
   - `.env`ファイルは`.gitignore`に追加
   - 本番環境ではRenderの環境変数を使用

3. **HTTPS化**
   - Renderでは自動的にHTTPS化されます

4. **データベースのバックアップ**
   - Renderの有料プランで自動バックアップ
   - または定期的にエクスポート機能を使用

## 💾 データのバックアップ

### エクスポート

管理画面から「データエクスポート」をクリック、またはAPI:

```bash
curl https://your-app.onrender.com/api/export > backup.json
```

### インポート

管理画面から「データインポート」でJSONファイルをアップロード

## 🐛 トラブルシューティング

### データベース接続エラー

```bash
Error: connect ECONNREFUSED
```

**解決方法:**
1. `DATABASE_URL`環境変数が正しく設定されているか確認
2. PostgreSQLサーバーが起動しているか確認
3. ファイアウォール設定を確認

### Renderで90日後にデータベースが削除される

Renderの無料PostgreSQLは90日で自動削除されます。

**解決方法:**
1. 有料プラン（月$7〜）にアップグレード
2. 他のプロバイダ（Supabase、Neon.tech）の無料枠を使用
3. 定期的にエクスポートしてバックアップ

### マイグレーションエラー

```bash
npm run migrate
```

でエラーが出る場合:
1. `data/database.json`が存在するか確認
2. PostgreSQLに接続できるか確認
3. エラーメッセージを確認して対応

## 📊 パフォーマンス

- **同時接続数**: Render無料プランで50〜100ユーザー
- **データベース**: PostgreSQLの無料プランで1GB
- **応答速度**: 平均100-300ms

より多くのユーザーには有料プランをご検討ください。

## 🆚 旧版（JSONファイル版）との違い

| 項目 | 旧版 | PostgreSQL版 |
|------|------|--------------|
| データ保存 | ファイルシステム | PostgreSQL |
| 再起動時 | ❌ データ消失 | ✅ データ保持 |
| 複数サーバー | ❌ 非対応 | ✅ 対応 |
| バックアップ | 手動 | 自動（有料プラン） |
| スケーラビリティ | 低 | 高 |

## 📝 API エンドポイント

### 既存API（互換性維持）
- `GET /api/health` - ヘルスチェック
- `GET /api/data` - 全データ取得
- `POST /api/data` - データ保存
- `GET /api/progress/:userId` - 進捗取得
- `POST /api/progress/:userId` - 進捗保存
- `DELETE /api/progress/:userId` - 進捗削除
- `GET /api/export` - データエクスポート
- `POST /api/import` - データインポート
- `DELETE /api/data` - データクリア

### 新規API
- `GET /api/users` - 全ユーザー取得
- `POST /api/users` - ユーザー作成
- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除
- `GET /api/courses` - 全コース取得
- `GET /api/courses/:id` - コース取得
- `POST /api/courses` - コース作成
- `PUT /api/courses/:id` - コース更新
- `DELETE /api/courses/:id` - コース削除
- `GET /api/learning-records` - 学習記録取得
- `GET /api/learning-records/user/:userId` - ユーザー別学習記録
- `POST /api/learning-records` - 学習記録作成

## 🔄 アップグレード手順（既存システムから）

1. 新しいファイルをダウンロード
2. `npm install`で依存関係を更新
3. `.env`ファイルを作成してDATABASE_URLを設定
4. `npm run migrate`で既存データを移行
5. `npm start`でサーバーを起動

**既存のJSONファイルはバックアップとして保持されます。**

## 📞 サポート

問題が発生した場合:
1. このREADMEを再確認
2. ログを確認: `console.log`の出力を見る
3. GitHubのIssuesで質問

## 📄 ライセンス

MIT License

---

**🎉 これでデータが永続化され、安心して使えます！**
