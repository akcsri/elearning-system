# 🚀 クイックスタートガイド - PostgreSQL版

このガイドに従えば、5分でRenderにデプロイできます！

## ステップ1: GitHubにプッシュ

```bash
# 既存のプロジェクトディレクトリで
git init
git add .
git commit -m "PostgreSQL対応版に移行"
git branch -M main

# GitHubで新しいリポジトリを作成してから
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## ステップ2: Renderでデータベースを作成

1. https://dashboard.render.com にアクセス
2. 「New」→「PostgreSQL」をクリック
3. 設定:
   - **Name**: `elearning-db`
   - **Database**: `elearning`
   - **Region**: `Tokyo`
   - **Plan**: `Free`
4. 「Create Database」をクリック
5. ✅ 完了！（5-10秒で作成されます）

## ステップ3: Web Serviceを作成

1. 「New」→「Web Service」をクリック
2. GitHubリポジトリを選択
3. 設定:
   - **Name**: `elearning-system`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. **Environment Variables**セクションで:
   - 「Add Environment Variable」をクリック
   - Key: `DATABASE_URL`
   - Value: 「Add from database」→「elearning-db」を選択
5. 「Create Web Service」をクリック
6. ✅ デプロイ完了！（3-5分かかります）

## ステップ4: アクセス

デプロイが完了したら、RenderのダッシュボードでURLをクリック

例: `https://elearning-system.onrender.com`

## ✅ 完了！

- 管理者アカウント: `admin` / `admin123`
- 一般ユーザー: `user1` / `user1123`

---

## 💡 よくある質問

### Q: 無料プランでどれくらい使える？

**A:** 
- PostgreSQL: 1GB、90日間無料
- Web Service: 無制限（15分無操作でスリープ）

### Q: データは永続化される？

**A:** はい！再起動してもデータは消えません。

### Q: 90日後はどうなる？

**A:** 
- オプション1: 有料プラン（月$7〜）にアップグレード
- オプション2: 新しい無料データベースを作成して移行
- オプション3: Supabaseなど他のサービスに移行

### Q: ローカル開発はどうする？

**A:**
```bash
# PostgreSQLをインストール
brew install postgresql  # macOS
brew services start postgresql

# データベースを作成
createdb elearning

# .envファイルを作成
echo "DATABASE_URL=postgresql://localhost:5432/elearning" > .env

# サーバーを起動
npm install
npm start
```

### Q: 既存のJSONデータを移行したい

**A:**
```bash
# データ移行スクリプトを実行
npm run migrate
```

---

## 🆘 トラブルシューティング

### デプロイが失敗する

1. ログを確認: RenderのダッシュボードでLogsタブを見る
2. `DATABASE_URL`が正しく設定されているか確認
3. GitHubリポジトリに全ファイルがプッシュされているか確認

### データベースに接続できない

1. Renderのダッシュボードでデータベースの状態を確認
2. 環境変数`DATABASE_URL`が正しいか確認
3. デプロイログを確認

### 無料プランがスリープする

15分間アクセスがないとスリープします。
- 最初のアクセス時に数秒かかります（これは正常です）
- 定期的にアクセスするCronJobを設定することも可能

---

**🎉 デプロイ完了おめでとうございます！**
