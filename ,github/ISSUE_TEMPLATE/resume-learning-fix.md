---
name: 続きから再開機能の修正
about: ページリロード時に学習進捗が自動復元されない問題の修正
title: '[Bug Fix] ページリロード時に続きから自動再開されない'
labels: bug, enhancement, priority:high
assignees: ''
---

## 🐛 問題の説明

現在、ユーザーがログインして学習を進めた後にページをリロード（F5）すると、以下の問題が発生します：

- ログイン状態が失われる
- 学習進捗が初期化される
- ユーザーが手動で「続きから再開」ボタンを押す必要がある

**期待される動作：**
- ページをリロードしても、ログイン状態が保持される
- 自動的に学習画面に遷移し、続きから再開される
- ユーザーは何もせずに学習を継続できる

## 🔍 現在の動作

```
1. user1でログイン
2. スライド5まで進む
3. ページリロード (F5)
4. ❌ ログイン画面に戻される
5. ❌ 進捗データはDBに保存されているが、手動で「続きから再開」が必要
```

## ✅ 期待される動作

```
1. user1でログイン
2. スライド5まで進む
3. ページリロード (F5)
4. ✅ 自動的にログイン状態が復元される
5. ✅ スライド5の画面が自動的に表示される
6. ✅ ユーザーは何もせずに学習を継続できる
```

## 📋 再現手順

1. `http://localhost:3000` または Renderのデプロイ先にアクセス
2. 任意のユーザーでログイン（例：`user1` / `user1123`）
3. スライドを数枚進める
4. ブラウザのリロードボタンを押す、または F5 キーを押す
5. **結果：** ログイン画面に戻され、進捗が失われる

## 🔧 技術的詳細

### 原因
- `AppData.currentUser` はメモリ上にのみ存在
- ページリロード時にJavaScriptの状態がリセットされる
- ログイン状態が永続化されていない

### データベース状態
- 進捗データは PostgreSQL の `progress` テーブルに正しく保存されている
- `current_slide`, `quiz_started`, `quiz_answers` などは保存されている
- 問題は**フロントエンドでの状態復元**が実装されていないこと

### コンソールログ（現在）
```
✅ データを読み込みました {users: 11, courses: 1, records: 1}
✅ 進捗をロードしました: {id: 1, user_id: 1, course_id: 1, current_slide: 0, quiz_started: false, …}
```

## 💡 提案される解決策

### 実装箇所
`public/index.html` の `App` オブジェクト

### 修正1: `init()` 関数 - ログイン状態の復元

```javascript
async init() {
    console.log('🚀 アプリケーション起動 - PostgreSQL版');
    
    // ローカルストレージからログイン状態を復元
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
        console.log('🔄 ログイン状態を復元中...');
    }
    
    // DB初期化
    await Database.init();
    
    // ログイン状態の復元
    if (savedUserId) {
        const user = AppData.users.find(u => u.id === parseInt(savedUserId));
        if (user) {
            AppData.currentUser = user;
            console.log('✅ ログイン状態を復元:', user.name);
            
            // 進捗を読み込み
            const progress = await Database.loadProgress(user.id);
            if (progress && progress.course_id) {
                console.log('📖 進捗を発見:', progress);
                
                // コースを復元
                const course = AppData.courses.find(c => c.id === progress.course_id);
                if (course) {
                    AppData.currentCourse = course;
                    console.log('✅ コースを復元:', course.title);
                    
                    // 学習画面に移動して進捗を適用
                    this.currentView = 'learning';
                    AppData.learningState = {
                        screen: progress.quiz_started ? 'quiz' : 'training',
                        slideIndex: progress.current_slide || 0,
                        questionIndex: 0,
                        answers: progress.quiz_answers || {},
                        showExplanations: {}
                    };
                    console.log('✅ 学習画面に自動復元: スライド', progress.current_slide + 1);
                }
            }
        }
    }
    
    // 全ユーザーの進捗データをロード
    await Database.loadAllProgress();
    
    // 以下、既存のコード...
}
```

### 修正2: `login()` 関数 - ログイン状態の保存

```javascript
async login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = AppData.users.find(function(u) { 
        return u.username === username && u.password === password;
    });

    if (user) {
        AppData.currentUser = user;
        console.log('✅ ログイン成功:', user.name, '(Role:', user.role + ')');
        
        // ログイン状態を保存
        localStorage.setItem('currentUserId', user.id);
        console.log('💾 ログイン状態を保存');
        
        // 以下、既存のコード...
    }
}
```

### 修正3: `logout()` 関数 - ログイン状態の削除

```javascript
logout() {
    AppData.currentUser = null;
    AppData.savedProgress = null;
    
    // ログイン状態を削除
    localStorage.removeItem('currentUserId');
    console.log('👋 ログアウト');
    
    this.currentView = 'login';
    this.render();
}
```

## ✅ 受け入れ基準

- [ ] ログイン後、`localStorage` に `currentUserId` が保存される
- [ ] ページリロード時、自動的にログイン状態が復元される
- [ ] 進捗データが正しく復元され、続きのスライドが表示される
- [ ] クイズ途中の場合も正しく復元される
- [ ] ログアウト時、`localStorage` から `currentUserId` が削除される
- [ ] コンソールに以下のログが表示される：
  ```
  🔄 ログイン状態を復元中...
  ✅ ログイン状態を復元: [ユーザー名]
  📖 進捗を発見: {...}
  ✅ コースを復元: [コース名]
  ✅ 学習画面に自動復元: スライド X
  ```

## 🧪 テスト手順

### 手動テスト

1. **基本的な自動復元テスト**
   ```
   1. user1でログイン (user1 / user1123)
   2. スライドを5枚進める
   3. ページリロード (F5)
   4. ✅ スライド5が自動的に表示されることを確認
   ```

2. **クイズ途中の復元テスト**
   ```
   1. user1でログイン
   2. スライドを最後まで進める
   3. クイズを開始し、3問回答
   4. ページリロード (F5)
   5. ✅ クイズ画面が表示され、3問の回答が保持されていることを確認
   ```

3. **ログアウトテスト**
   ```
   1. user1でログイン
   2. スライドを進める
   3. ログアウト
   4. ページリロード (F5)
   5. ✅ ログイン画面が表示されることを確認
   6. ✅ 自動ログインされないことを確認
   ```

4. **異なるユーザーテスト**
   ```
   1. user1でログイン、スライド5まで進める
   2. ログアウト
   3. user2でログイン
   4. ページリロード (F5)
   5. ✅ user2として復元されることを確認
   6. ✅ user1の進捗ではなく、user2の進捗が表示されることを確認
   ```

### コンソール確認

開発者ツール (F12) で以下を確認：

```javascript
// ログイン後
localStorage.getItem('currentUserId')  // ユーザーIDが返る

// ページリロード後のコンソールログ
// 🔄 ログイン状態を復元中...
// ✅ ログイン状態を復元: 前田 拓
// 📖 進捗を発見: {course_id: 1, current_slide: 4, ...}
// ✅ コースを復元: インサイダー取引規制
// ✅ 学習画面に自動復元: スライド 5

// ログアウト後
localStorage.getItem('currentUserId')  // null が返る
```

## 🎯 優先度

**High** - ユーザーエクスペリエンスに直接影響する重要な機能

## 📝 追加の考慮事項

### セキュリティ
- `localStorage` にはユーザーIDのみを保存（パスワードは保存しない）
- XSS対策として、サニタイズされたデータのみを保存
- セッションタイムアウトの実装は別イシューで検討

### エッジケース
- [ ] ユーザーが削除された場合の処理
- [ ] コースが削除された場合の処理
- [ ] 進捗データの有効期限（24時間）が切れた場合の処理

### 将来的な改善案
- セッショントークンの実装
- サーバーサイドセッション管理
- リフレッシュトークンによる自動ログイン延長

## 📚 関連ドキュメント

- [MDN - Window.localStorage](https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage)
- [PostgreSQL Progress テーブル設計](../database.js)
- [フロントエンド状態管理](../public/index.html)

## 🔗 関連イシュー

- #XX: 進捗データの永続化（PostgreSQL移行）
- #XX: セッション管理の改善

---

**実装者へのメモ：**
この修正により、ユーザーは学習中にブラウザをリロードしても、続きから自動的に再開できるようになります。localStorage を使用した軽量な実装で、即座にUX改善が期待できます。
