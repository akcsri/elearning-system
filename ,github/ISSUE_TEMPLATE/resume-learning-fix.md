---
name: 続きから再開機能の修正
about: ページリロード時に学習進捗が自動復元されない問題の修正
title: '[Bug Fix] ページリロード時に続きから自動再開されない'
labels: bug, enhancement
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

## 🔍 現在の動作

```
1. user1でログイン
2. スライド5まで進む
3. ページリロード (F5)
4. ❌ ログイン画面に戻される
```

## 💡 提案される解決策

### 修正1: `App.init()` - ログイン状態の復元

```javascript
async init() {
    console.log('🚀 アプリケーション起動 - PostgreSQL版');
    
    // ローカルストレージからログイン状態を復元
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
        console.log('🔄 ログイン状態を復元中...');
    }
    
    await Database.init();
    
    // ログイン状態の復元
    if (savedUserId) {
        const user = AppData.users.find(u => u.id === parseInt(savedUserId));
        if (user) {
            AppData.currentUser = user;
            
            const progress = await Database.loadProgress(user.id);
            if (progress && progress.course_id) {
                const course = AppData.courses.find(c => c.id === progress.course_id);
                if (course) {
                    AppData.currentCourse = course;
                    this.currentView = 'learning';
                    AppData.learningState = {
                        screen: progress.quiz_started ? 'quiz' : 'training',
                        slideIndex: progress.current_slide || 0,
                        questionIndex: 0,
                        answers: progress.quiz_answers || {},
                        showExplanations: {}
                    };
                }
            }
        }
    }
}
```

### 修正2: `App.login()` - ログイン状態の保存

```javascript
if (user) {
    AppData.currentUser = user;
    localStorage.setItem('currentUserId', user.id);
    console.log('💾 ログイン状態を保存');
}
```

### 修正3: `App.logout()` - ログイン状態の削除

```javascript
logout() {
    AppData.currentUser = null;
    localStorage.removeItem('currentUserId');
    this.currentView = 'login';
    this.render();
}
```

## ✅ 受け入れ基準

- [ ] ページリロード時、自動的にログイン状態が復元される
- [ ] 進捗データが正しく復元され、続きのスライドが表示される
- [ ] ログアウト時、localStorage がクリアされる

## 🧪 テスト手順

1. user1でログイン
2. スライドを5枚進める
3. ページリロード (F5)
4. ✅ 自動的にスライド5が表示されることを確認
