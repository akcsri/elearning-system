# 📦 PostgreSQL版 eラーニングシステム - ファイル一覧

## ✅ 完了した変更

既存のファイルベースシステムをPostgreSQLに移行しました！
**データは永続化され、Renderの再起動でも消えません。**

---

## 📁 提供ファイル

### 🔧 コアファイル

1. **database.js** - PostgreSQL接続とデータ操作
   - 全テーブルのCRUD操作
   - データエクスポート/インポート機能
   - 自動初期化

2. **server-postgres.js** - メインサーバー（旧server.js）
   - PostgreSQL対応版
   - 既存APIとの互換性維持
   - 新規REST API追加

3. **package.json** - 依存関係定義
   - `pg`パッケージ追加
   - マイグレーションスクリプト追加

4. **migrate-to-postgres.js** - データ移行スクリプト
   - 既存JSONデータをPostgreSQLに移行
   - 進捗データも移行

### 📄 ドキュメント

5. **README.md** - 完全なドキュメント
   - ローカル開発手順
   - Renderデプロイ手順
   - トラブルシューティング

6. **QUICKSTART.md** - 5分デプロイガイド
   - ステップバイステップ
   - よくある質問

### ⚙️ 設定ファイル

7. **.env.example** - 環境変数の例
8. **render.yaml** - Render自動デプロイ設定
9. **.gitignore** - Git管理除外設定

### 🎨 フロントエンド

10. **public/index.html** - 既存のフロントエンド（そのまま使用可能）

---

## 🚀 デプロイ手順（要約）

### 📍 Render（推奨・無料）

```bash
# 1. GitHubにプッシュ
git init
git add .
git commit -m "PostgreSQL対応版"
git remote add origin YOUR_REPO_URL
git push -u origin main

# 2. Renderで設定
# - PostgreSQL作成（Free、Tokyo）
# - Web Service作成
# - DATABASE_URL環境変数を追加

# 完了！
```

詳細は **QUICKSTART.md** を参照

---

## 💾 データベーススキーマ

### テーブル構成

- **users** - ユーザー情報
- **courses** - コース情報（スライド、クイズ）
- **learning_records** - 受講履歴
- **progress** - 中断・再開データ（24時間保持）

すべて自動作成されます！

---

## 🔄 既存データの移行

既存のJSONファイルがある場合:

```bash
# ローカル環境で
npm run migrate
```

データは自動的にPostgreSQLに移行されます。

---

## 🆚 変更点

| 項目 | 旧版 | 新版 |
|------|------|------|
| データ保存 | JSON（data/database.json） | PostgreSQL |
| 再起動時 | ❌ データ消失 | ✅ データ保持 |
| Render対応 | ❌ 無料プランで不可 | ✅ 無料プランOK |
| コスト | 無料 | 無料（90日）→ 月$7〜 |

---

## 📊 無料プランの制限

### Render PostgreSQL（無料）
- ストレージ: 1GB
- 期間: 90日間
- 接続数: 97

### Render Web Service（無料）
- 無制限使用
- 15分無操作でスリープ
- 月750時間無料

**十分な容量です！**

---

## 🔐 セキュリティ注意事項

本番環境では以下を実装してください:

1. ✅ パスワードのハッシュ化（bcrypt推奨）
2. ✅ JWT認証
3. ✅ HTTPS通信（Renderで自動）
4. ✅ 環境変数の適切な管理

現在は開発版のため、平文パスワードです。

---

## 📞 サポート

### 問題が発生した場合

1. **README.md**のトラブルシューティングを確認
2. **QUICKSTART.md**のFAQを確認
3. Renderのログを確認
4. GitHubでIssueを作成

---

## ✨ 次のステップ

### すぐに始める
→ **QUICKSTART.md**を開いてデプロイ！

### 詳しく知る
→ **README.md**で全機能を確認

### ローカル開発
→ PostgreSQLをインストールして`.env`を設定

---

**🎉 PostgreSQL移行完了！データが永続化されます！**

💡 90日後も使い続けたい場合は、Renderの有料プラン（月$7）をご検討ください。
