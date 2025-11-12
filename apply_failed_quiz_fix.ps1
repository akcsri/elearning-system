# 不合格時の進捗保持機能を追加するスクリプト
# PowerShell用

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "不合格時の進捗保持機能を追加" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ファイルパス
$indexPath = "public\index.html"

if (-not (Test-Path $indexPath)) {
    Write-Host "❌ エラー: $indexPath が見つかりません" -ForegroundColor Red
    Read-Host "Enterキーを押して終了"
    exit 1
}

Write-Host "📄 ファイル: $indexPath" -ForegroundColor Green

# バックアップ作成
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "public\index.html.backup.$timestamp"
Copy-Item $indexPath $backupPath
Write-Host "📦 バックアップ作成: $backupPath" -ForegroundColor Green
Write-Host ""

# ファイル読み込み
$content = Get-Content $indexPath -Raw -Encoding UTF8

Write-Host "🔧 修正を適用中..." -ForegroundColor Yellow
Write-Host ""

# ===================================
# 修正1: finishQuiz() の進捗クリア部分
# ===================================
Write-Host "1/3 finishQuiz() 関数を修正..." -ForegroundColor Yellow

$pattern1 = @'
if \(AppData\.currentUser\) \{\s*await Database\.clearProgress\(AppData\.currentUser\.id\);\s*\}
'@

$replacement1 = @'
// 🔧 修正: 合格時のみ進捗をクリア
                if (AppData.currentUser && passed) {
                    await Database.clearProgress(AppData.currentUser.id);
                    console.log('✅ 合格のため進捗をクリアしました');
                } else if (AppData.currentUser && !passed) {
                    // 不合格の場合は進捗を保持（復習して再挑戦できるようにする）
                    console.log('⚠️ 不合格のため進捗を保持します（復習可能）');
                }
'@

if ($content -match $pattern1) {
    $content = $content -replace $pattern1, $replacement1
    Write-Host "  ✅ finishQuiz() を修正しました" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  パターンが見つかりません（既に修正済みの可能性）" -ForegroundColor Yellow
}

# ===================================
# 修正2: renderResultScreen() の不合格時の表示
# ===================================
Write-Host "2/3 renderResultScreen() 関数を修正..." -ForegroundColor Yellow

$pattern2 = @'
<div class="result-message \$\{passed \? 'pass' : 'fail'\}">
\s*\$\{passed \?[^}]+\}
\s*</div>
'@

$replacement2 = @'
<div class="result-message ${passed ? 'pass' : 'fail'}">
                            ${passed ? 
                                '🎉 おめでとうございます！<br>研修を修了しました' : 
                                '📚 もう少し復習が必要です<br>合格ライン: 8問以上正解'
                            }
                        </div>
'@

if ($content -match $pattern2) {
    $content = $content -replace $pattern2, $replacement2
    Write-Host "  ✅ 結果メッセージを修正しました" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  パターンが見つかりません" -ForegroundColor Yellow
}

# ボタン部分の修正
$pattern3 = @'
<div class="action-buttons">[\s\S]*?</div>\s*</div>\s*\`;\s*\}
'@

$replacement3 = @'
${passed ? `
                            <!-- 合格時のボタン -->
                            <div class="action-buttons">
                                <button class="btn btn-success" onclick="App.logout()">
                                    修了証をダウンロードしてログアウト
                                </button>
                                <button class="btn btn-secondary" onclick="App.retakeQuiz()">
                                    最初から再受講する
                                </button>
                            </div>
                        ` : `
                            <!-- 不合格時のボタン -->
                            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <p style="color: #92400e; margin: 0; line-height: 1.6;">
                                    💡 <strong>アドバイス:</strong> 間違えた問題の解説をもう一度確認してから再挑戦することをお勧めします。
                                    スライドに戻って復習することもできます。
                                </p>
                            </div>
                            
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="App.reviewAndRetry()">
                                    📖 スライドを復習して再挑戦
                                </button>
                                <button class="btn btn-secondary" onclick="App.retakeQuiz()">
                                    🔄 最初からやり直す
                                </button>
                            </div>
                        `}
                    </div>
                `;
            }
'@

if ($content -match $pattern3) {
    $content = $content -replace $pattern3, $replacement3
    Write-Host "  ✅ ボタン表示を修正しました" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  パターンが見つかりません" -ForegroundColor Yellow
}

# ===================================
# 修正3: reviewAndRetry() 関数を追加
# ===================================
Write-Host "3/3 reviewAndRetry() 関数を追加..." -ForegroundColor Yellow

# retakeQuiz() の後に追加
$pattern4 = @'
(async retakeQuiz\(\) \{[\s\S]*?\},)
'@

$replacement4 = @'
$1

            async reviewAndRetry() {
                console.log('📖 復習モードで再開します');
                
                // スライド画面に戻る（進捗は保持されている）
                AppData.learningState.screen = 'training';
                AppData.learningState.slideIndex = 0; // 最初から復習
                AppData.learningState.answers = {}; // テストの解答はリセット
                AppData.learningState.showExplanations = {};
                
                // 進捗を保存
                if (AppData.currentUser) {
                    await Database.saveProgress(AppData.currentUser.id);
                }
                
                this.render();
            },
'@

if ($content -match $pattern4) {
    $content = $content -replace $pattern4, $replacement4
    Write-Host "  ✅ reviewAndRetry() 関数を追加しました" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  パターンが見つかりません（既に追加済みの可能性）" -ForegroundColor Yellow
}

# ===================================
# ファイル保存
# ===================================
Write-Host ""
Write-Host "💾 ファイルを保存中..." -ForegroundColor Yellow

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($indexPath, $content, $utf8NoBom)

Write-Host "✅ 保存完了" -ForegroundColor Green
Write-Host ""

# ===================================
# 完了メッセージ
# ===================================
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 修正完了！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "変更内容:" -ForegroundColor Cyan
Write-Host "1. ✅ 合格時のみ進捗をクリア" -ForegroundColor White
Write-Host "2. ✅ 不合格時は進捗を保持（復習可能）" -ForegroundColor White
Write-Host "3. ✅ 不合格時に「復習して再挑戦」ボタンを追加" -ForegroundColor White
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor Cyan
Write-Host "1. サーバーを再起動" -ForegroundColor White
Write-Host "   Ctrl+C でサーバーを停止" -ForegroundColor Gray
Write-Host "   node server-postgres.js で再起動" -ForegroundColor Gray
Write-Host ""
Write-Host "2. ブラウザで完全リロード (Ctrl+Shift+R)" -ForegroundColor White
Write-Host ""
Write-Host "3. テスト:" -ForegroundColor White
Write-Host "   a) user1でログイン" -ForegroundColor Gray
Write-Host "   b) わざと不合格にする（7問以下正解）" -ForegroundColor Gray
Write-Host "   c) 「スライドを復習して再挑戦」ボタンをクリック" -ForegroundColor Gray
Write-Host "   d) スライドが表示されることを確認" -ForegroundColor Gray
Write-Host "   e) 再度テストに挑戦して合格" -ForegroundColor Gray
Write-Host "   f) 今度は進捗がクリアされることを確認" -ForegroundColor Gray
Write-Host ""
Write-Host "バックアップ: $backupPath" -ForegroundColor Yellow
Write-Host "問題がある場合は以下で復元:" -ForegroundColor Yellow
Write-Host "  Copy-Item `"$backupPath`" `"$indexPath`"" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Read-Host "Enterキーを押して終了"
