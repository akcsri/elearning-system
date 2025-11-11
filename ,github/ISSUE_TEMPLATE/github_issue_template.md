---
name: 🚨 緊急修正：学習記録の重複データ問題
about: 自動保存機能の暴走により学習記録が2220件に増加し、削除しても復活する問題の修正
title: '[緊急] 学習記録の重複データ削除と自動保存機能の無効化'
labels: bug, priority-high, database, hotfix
assignees: ''
---

## 🚨 問題の概要

学習記録が2220件に増加し、削除してもすぐに復活する問題が発生しています。自動保存機能が2秒ごとに壊れたデータを送信し続けているため、早急な対応が必要です。

## 📊 現在の症状

- ❌ 学習記録数: 2220件（本来は1-10件程度）
- ❌ 削除しても数秒で復活
- ❌ `/api/data` POSTで500エラー
- ❌ 2秒ごとに「✅ データを保存しました」がコンソールに表示
- ❌ ブラウザの動作が重い

## 🔍 根本原因

1. **フロントエンドの自動保存機能**が2秒ごとに全データを`/api/data`に送信
2. **サーバーの`/api/data`エンドポイント**が重複チェックなしでデータを保存
3. 学習記録は`/api/learning-records`で個別管理すべきだが、一括保存で重複が発生
4. 削除してもフロントエンドのメモリ上のデータが再送信されるため復活

---

## 🛠️ 修正作業（3パート）

### パート1: サーバーサイド修正

#### 1-1. `database.js` の修正

**ファイル:** `database.js`

**変更箇所:** 最後の `module.exports`

**変更内容:**
```javascript
module.exports = {
    pool,  // ← この行を追加（APIで使用するため）
    initializeDatabase,
    getUsers,
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser,
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getLearningRecords,
    getLearningRecordsByUserId,
    createLearningRecord,
    getProgress,
    saveProgress,
    deleteProgress,
    cleanupExpiredProgress,
    exportData,
    importData
};
```

---

#### 1-2. `server-postgres.js` の修正

**ファイル:** `server-postgres.js`

**変更1: 既存の `/api/data` POSTエンドポイントを無効化**

検索: `app.post('/api/data',`

既存のコードを以下に置き換え:

```javascript
// データ保存（全データ） - 無効化
app.post('/api/data', async (req, res) => {
    // このエンドポイントは使用しない
    // 学習記録は /api/learning-records で個別管理
    console.log('⚠️  /api/data への保存リクエストを無視しました');
    res.json({ 
        success: true, 
        message: 'このエンドポイントは無効化されています。学習記録は個別APIで管理されます。' 
    });
});
```

**変更2: クリーンアップAPIエンドポイントを追加**

`app.listen()` の**直前**に以下を追加:

```javascript
// ========================================
// 緊急対応: データベースクリーンアップAPI
// ========================================

// 学習記録を完全削除（管理者用）
app.post('/api/debug/reset-learning-records', async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        console.log('🚨 学習記録の完全リセットを実行中...');
        
        await client.query('BEGIN');
        
        const beforeCount = await client.query('SELECT COUNT(*) as count FROM learning_records');
        console.log('  削除前の記録数:', beforeCount.rows[0].count);
        
        await client.query('TRUNCATE TABLE learning_records RESTART IDENTITY');
        
        await client.query('COMMIT');
        
        console.log('✅ 学習記録を完全削除しました');
        
        res.json({
            success: true,
            deletedCount: parseInt(beforeCount.rows[0].count),
            message: '学習記録を完全にリセットしました'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ リセットエラー:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ユーザーごとに最新の記録のみを保持
app.post('/api/debug/keep-latest-only', async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        console.log('🧹 ユーザーごとに最新の記録のみを保持...');
        
        await client.query('BEGIN');
        
        const beforeCount = await client.query('SELECT COUNT(*) as count FROM learning_records');
        console.log('  処理前の記録数:', beforeCount.rows[0].count);
        
        const latestRecords = await client.query(`
            SELECT DISTINCT ON (user_id, course_id) id
            FROM learning_records
            ORDER BY user_id, course_id, completed_at DESC
        `);
        
        const idsToKeep = latestRecords.rows.map(r => r.id);
        console.log('  保持するID:', idsToKeep);
        
        if (idsToKeep.length > 0) {
            await client.query(
                'DELETE FROM learning_records WHERE id NOT IN (' + 
                idsToKeep.map((_, i) => `$${i + 1}`).join(',') + ')',
                idsToKeep
            );
        } else {
            await client.query('TRUNCATE TABLE learning_records RESTART IDENTITY');
        }
        
        await client.query('COMMIT');
        
        const afterCount = await client.query('SELECT COUNT(*) as count FROM learning_records');
        const deletedCount = parseInt(beforeCount.rows[0].count) - parseInt(afterCount.rows[0].count);
        
        console.log('  処理後の記録数:', afterCount.rows[0].count);
        console.log('  削除した記録数:', deletedCount);
        
        res.json({
            success: true,
            before: parseInt(beforeCount.rows[0].count),
            after: parseInt(afterCount.rows[0].count),
            deleted: deletedCount,
            keptIds: idsToKeep
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ クリーンアップエラー:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});
```

---

### パート2: フロントエンド修正

#### 2-1. `public/index.html` の修正

**ファイル:** `public/index.html`

**変更1: `Database.save()` 関数を無効化**

検索: `async save() {`（Database オブジェクト内）

見つかった関数を以下に置き換え:

```javascript
async save() {
    // 自動保存は無効化
    // 学習記録は saveLearningRecord() で個別保存される
    console.log('💾 [自動保存] 無効化されています');
    return true;
},
```

**変更2: `init()` 関数の自動保存を削除**

検索: `setInterval(() => { Database.save();`

見つかった行を**削除またはコメントアウト**:

```javascript
async init() {
    await Database.load();
    await Database.startRealtimeSync();
    
    // 自動保存は無効化
    // setInterval(() => { Database.save(); }, 2000); // ← この行を削除
    
    console.log('✅ 初期化完了（自動保存: 無効）');
}
```

---

### パート3: データベースクリーンアップ

#### 3-1. コミットとデプロイ

```bash
git add database.js server-postgres.js public/index.html
git commit -m "🚨 緊急修正: 自動保存無効化とクリーンアップAPI追加"
git push
```

#### 3-2. Renderのデプロイ完了を確認

Render Dashboard → Web Service → Logs で「Deploy succeeded」を確認（約3-5分）

#### 3-3. ブラウザコンソールでクリーンアップスクリプトを実行

1. アプリを開く: `https://your-app.onrender.com`
2. **F12** を押してデベロッパーツールを開く
3. **Console** タブを選択
4. 以下のスクリプトをコピー＆ペースト:

```javascript
// 緊急クリーンアップスクリプト
console.log('🚨 緊急対応スクリプト');
console.log('='.repeat(50));

async function emergencyCleanup() {
    try {
        // 診断
        console.log('📊 現在の状態を確認中...');
        const diagResponse = await fetch('/api/debug/database');
        const diagData = await diagResponse.json();
        
        if (diagData.success) {
            console.log('  学習記録数:', diagData.stats.totalRecords);
            
            if (diagData.stats.totalRecords > 50) {
                // オプション1: 最新のみ保持（推奨）
                if (confirm('オプション1: 各ユーザーの最新記録のみを保持しますか？\n（推奨: データを保持したい場合）')) {
                    console.log('🧹 最新記録のみを保持中...');
                    const cleanResponse = await fetch('/api/debug/keep-latest-only', {
                        method: 'POST'
                    });
                    const cleanData = await cleanResponse.json();
                    
                    if (cleanData.success) {
                        console.log('✅ クリーンアップ完了');
                        console.log('  処理前:', cleanData.before, '件');
                        console.log('  処理後:', cleanData.after, '件');
                        console.log('  削除数:', cleanData.deleted, '件');
                        
                        if (confirm('ブラウザをリロードしますか？')) {
                            location.reload(true);
                        }
                    }
                // オプション2: 完全削除
                } else if (confirm('オプション2: 学習記録を完全に削除しますか？\n（警告: 全ての学習データが消えます！）')) {
                    console.log('🚨 学習記録を完全削除中...');
                    const resetResponse = await fetch('/api/debug/reset-learning-records', {
                        method: 'POST'
                    });
                    const resetData = await resetResponse.json();
                    
                    if (resetData.success) {
                        console.log('✅ 完全削除完了');
                        console.log('  削除数:', resetData.deletedCount, '件');
                        
                        if (confirm('ブラウザをリロードしますか？')) {
                            location.reload(true);
                        }
                    }
                }
            } else {
                console.log('✅ データベースは正常範囲内です');
            }
        }
    } catch (error) {
        console.error('❌ エラー:', error.message);
    }
}

emergencyCleanup();
```

5. **Enter** を押して実行
6. 指示に従ってクリーンアップ方法を選択
7. 完了後、**Ctrl+Shift+R** でブラウザをリロード

---

## ✅ 完了確認チェックリスト

修正完了後、以下を確認してください:

- [ ] `database.js` に `pool` が export されている
- [ ] `server-postgres.js` の `/api/data` POSTが無効化されている
- [ ] `server-postgres.js` にクリーンアップAPIが追加されている
- [ ] `public/index.html` の `Database.save()` が無効化されている
- [ ] `public/index.html` の自動保存 `setInterval` が削除されている
- [ ] Git commit & push 完了
- [ ] Renderのデプロイ成功
- [ ] ブラウザコンソールでクリーンアップ実行
- [ ] 学習記録数が正常（1-10件程度）
- [ ] コンソールエラーなし
- [ ] 500エラーなし
- [ ] 「✅ データを保存しました」が表示されない

---

## 🧪 テスト手順

### 1. 基本動作確認

1. 管理者でログイン (`admin` / `admin123`)
2. ダッシュボードで数値を確認:
   - 学習記録数: 1-10件（正常範囲）
   - 修了者数: 1件程度
3. 受講者管理で受講実績が表示されることを確認

### 2. 新規受講テスト

1. 一般ユーザーでログイン (`user1` / `user1123`)
2. 研修を最後まで完了
3. テストを受けて合格
4. 管理者画面で確認:
   - 学習記録が1件だけ追加されている
   - 重複していない

### 3. 自動保存の確認

1. ブラウザのコンソール（F12）を開く
2. 「✅ データを保存しました」が**表示されない**ことを確認
3. 500エラーが**発生しない**ことを確認

---

## 📊 期待される結果

**修正前:**
- 学習記録: 2220件
- 500エラー: あり
- 自動保存: 2秒ごと
- 削除: すぐ復活

**修正後:**
- 学習記録: 1-10件
- エラー: なし
- 自動保存: 無効
- 削除: 復活しない

---

## 📁 参考ファイル

修復作業の詳細は以下のファイルを参照:

- `COMPLETE_FIX_GUIDE.md` - 詳細な修復手順
- `emergency_cleanup_endpoints.js` - サーバーコード（参考）
- `disable_autosave.js` - フロントエンド修正（参考）
- `emergency_console_script.js` - クリーンアップスクリプト（参考）

---

## ⏱️ 予想作業時間

- サーバー修正: 10分
- フロントエンド修正: 3分
- デプロイ待ち: 3-5分
- クリーンアップ実行: 2分
- テスト: 5分

**合計: 約25分**

---

## 🆘 トラブルシューティング

### Q: クリーンアップスクリプト実行時にエラーが出る

**A:** Renderのデプロイが完了していません。
- Render Dashboard → Logs で「Deploy succeeded」を確認
- 数分待ってから再試行

### Q: 削除後もまだ記録が多い

**A:** オプション2（完全削除）を選択してください。

### Q: 500エラーが消えない

**A:** `/api/data` の無効化が正しく適用されていません。
- `server-postgres.js` の変更を確認
- Git push が完了しているか確認
- Renderが正しくデプロイされているか確認

---

## 🚀 優先度

- **Priority:** 🔴 High（緊急）
- **Impact:** データベースの肥大化、パフォーマンス低下
- **Effort:** 約25分
- **Risk:** 低（バックアップ不要、クリーンアップは選択式）

---

## 💬 補足

この修正により、学習記録は研修完了時に `/api/learning-records` API経由で1回だけ保存されるようになります。不要な自動保存は完全に無効化されます。

質問がある場合は、このIssueにコメントしてください。
