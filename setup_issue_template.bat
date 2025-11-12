@echo off
chcp 65001 >nul
echo ========================================
echo GitHubイシューテンプレート セットアップ
echo ========================================
echo.

REM 1. ディレクトリ作成
echo 📁 ステップ1: ディレクトリを作成...
if not exist ".github\ISSUE_TEMPLATE" mkdir ".github\ISSUE_TEMPLATE"
if exist ".github\ISSUE_TEMPLATE" (
    echo ✅ ディレクトリ作成完了
) else (
    echo ❌ エラー: ディレクトリの作成に失敗しました
    pause
    exit /b 1
)
echo.

REM 2. メインのイシューテンプレート作成
echo 📝 ステップ2: イシューテンプレートを作成...
(
echo ---
echo name: 続きから再開機能の修正
echo about: ページリロード時に学習進捗が自動復元されない問題
echo title: '[Bug Fix] ページリロード時に続きから自動再開されない'
echo labels: bug, enhancement
echo assignees: ''
echo.
echo ---
echo.
echo ## 🐛 問題の説明
echo.
echo ページをリロード^(F5^)すると、ログイン状態と学習進捗が失われる問題。
echo.
echo ## 📋 再現手順
echo.
echo 1. ログイン^(例：user1 / user1123^)
echo 2. スライドを数枚進める
echo 3. ページリロード ^(F5^)
echo 4. ❌ ログイン画面に戻される
echo.
echo ## 💡 提案される解決策
echo.
echo ### 修正内容
echo.
echo `public/index.html` の以下の関数を修正：
echo.
echo 1. **App.init^(^)** - ログイン状態の復元
echo 2. **App.login^(^)** - localStorage への保存
echo 3. **App.logout^(^)** - localStorage のクリア
echo.
echo ### コード例
echo.
echo ```javascript
echo // App.init^(^) に追加
echo const savedUserId = localStorage.getItem^('currentUserId'^);
echo if ^(savedUserId^) {
echo     const user = AppData.users.find^(u =^> u.id === parseInt^(savedUserId^)^);
echo     if ^(user^) {
echo         AppData.currentUser = user;
echo         // 進捗を復元...
echo     }
echo }
echo.
echo // App.login^(^) に追加
echo localStorage.setItem^('currentUserId', user.id^);
echo.
echo // App.logout^(^) に追加
echo localStorage.removeItem^('currentUserId'^);
echo ```
echo.
echo ## ✅ 受け入れ基準
echo.
echo - [ ] ページリロード時、自動的にログイン状態が復元される
echo - [ ] 学習画面に戻り、続きのスライドが表示される
echo - [ ] ログアウト後は自動復元されない
) > ".github\ISSUE_TEMPLATE\resume-learning-fix.md"
echo ✅ イシューテンプレート作成完了
echo.

REM 3. 簡易版バグレポート作成
echo 📝 ステップ3: バグレポートテンプレートを作成...
(
echo ---
echo name: Bug Report
echo about: Report a bug or issue
echo title: ''
echo labels: bug
echo assignees: ''
echo.
echo ---
echo.
echo ## Description
echo.
echo A clear description of what the bug is.
echo.
echo ## Steps to Reproduce
echo.
echo 1. Go to '...'
echo 2. Click on '....'
echo 3. See error
echo.
echo ## Expected Behavior
echo.
echo What you expected to happen.
echo.
echo ## Actual Behavior
echo.
echo What actually happened.
) > ".github\ISSUE_TEMPLATE\bug_report.md"
echo ✅ バグレポートテンプレート作成完了
echo.

REM 4. config.yml 作成
echo 📝 ステップ4: config.yml を作成...
(
echo blank_issues_enabled: true
) > ".github\ISSUE_TEMPLATE\config.yml"
echo ✅ config.yml 作成完了
echo.

REM 5. ファイル確認
echo 🔍 ステップ5: 作成されたファイルを確認...
echo.
dir ".github\ISSUE_TEMPLATE" /b
echo.

REM 6. Gitステータス確認
echo 📊 ステップ6: Gitステータスを確認...
echo.
git status
echo.

REM 完了メッセージ
echo ======================================
echo ✅ セットアップ完了！
echo ======================================
echo.
echo 次のステップ:
echo.
echo 1. ファイルをコミット:
echo    git add .github/
echo    git commit -m "Add issue templates"
echo.
echo 2. GitHubにプッシュ:
echo    git push origin main
echo.
echo 3. 確認:
echo    ブラウザで以下のURLにアクセス:
echo    https://github.com/YOUR-USERNAME/YOUR-REPO/issues/new/choose
echo.
echo 4. トラブルシューティング:
echo    テンプレートが表示されない場合:
echo    - ブラウザのハードリロード ^(Ctrl+Shift+R^)
echo    - 5-10分待つ^(GitHubのキャッシュ更新^)
echo    - ISSUE_TEMPLATE_TROUBLESHOOTING.md を参照
echo.
echo ======================================
echo.
pause
