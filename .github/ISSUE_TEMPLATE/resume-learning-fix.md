---
name: 続きから再開機能の修正
about: ページリロード時に学習進捗が自動復元されない問題
title: '[Bug Fix] ページリロード時に続きから自動再開されない'
labels: bug, enhancement
assignees: ''

---

## 🐛 問題の説明

ページをリロード（F5）すると、ログイン状態と学習進捗が失われる。

## 📋 再現手順

1. user1でログイン (user1 / user1123)
2. スライドを5枚進める
3. ページリロード (F5)
4. ❌ ログイン画面に戻される

## 💡 提案される解決策

`public/index.html` を修正：
```javascript
// 1. App.init() に追加
const savedUserId = localStorage.getItem('currentUserId');
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

// 2. App.login() に追加
localStorage.setItem('currentUserId', user.id);

// 3. App.logout() に追加
localStorage.removeItem('currentUserId');
```

## ✅ 受け入れ基準

- [ ] ページリロード時、自動的にログイン状態が復元される
- [ ] 学習画面に戻り、続きのスライドが表示される
- [ ] ログアウト後は自動復元されない

## 🧪 テスト手順

1. user1でログイン
2. スライド5まで進める
3. F5でリロード
4. ✅ 自動的にスライド5が表示されることを確認
