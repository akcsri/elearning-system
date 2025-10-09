# ========================================
# index.html 自動修正スクリプト (PowerShell版)
# ========================================

Write-Host "🔧 index.html 自動修正スクリプト" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# ファイルパス
$indexPath = "public\index.html"

# ファイルの存在確認
if (-not (Test-Path $indexPath)) {
    Write-Host "❌ エラー: public\index.html が見つかりません" -ForegroundColor Red
    Write-Host "   このスクリプトをプロジェクトルートで実行してください" -ForegroundColor Red
    exit 1
}

# バックアップ作成
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "$indexPath.backup.$timestamp"

Write-Host "📦 バックアップ作成中..." -ForegroundColor Yellow
Copy-Item $indexPath $backupPath
Write-Host "✅ バックアップ作成完了: $backupPath" -ForegroundColor Green
Write-Host ""

# ファイルを読み込む
Write-Host "🔨 ファイル修正中..." -ForegroundColor Yellow
$content = Get-Content $indexPath -Raw -Encoding UTF8

# 元の行数
$originalLines = ($content -split "`n").Count

# 修正パターン: localStorage.setItem から const AppData まで削除
$pattern = '(?s)\};[\s\n]+localStorage\.setItem\(this\.STORAGE_KEY.*?(?=\s*const AppData = \{)'

# 修正実行
$contentFixed = $content -replace $pattern, '};'

# 修正後の行数
$fixedLines = ($contentFixed -split "`n").Count
$removedLines = $originalLines - $fixedLines

# ファイルに書き戻す
$contentFixed | Out-File -FilePath $indexPath -Encoding UTF8 -NoNewline

Write-Host "✅ 修正完了" -ForegroundColor Green
Write-Host "   元の行数: $originalLines"
Write-Host "   修正後行数: $fixedLines"
Write-Host "   削除行数: $removedLines"
Write-Host ""

if ($removedLines -gt 0) {
    Write-Host "🎉 ${removedLines}行の重複コードを削除しました！" -ForegroundColor Green
} else {
    Write-Host "⚠️  削除すべきコードが見つかりませんでした" -ForegroundColor Yellow
    Write-Host "   すでに修正済みか、ファイル構造が異なる可能性があります"
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ 修正が完了しました！" -ForegroundColor Green
Write-Host ""
Write-Host "次のステップ:"
Write-Host "1. ブラウザでページをリロード (Ctrl+Shift+R)"
Write-Host "2. ブラウザのコンソールでエラーが出ないか確認"
Write-Host "3. ログイン機能をテスト"
Write-Host ""
Write-Host "問題がある場合:"
Write-Host "  バックアップから復元: Copy-Item `"$backupPath`" `"$indexPath`" -Force"
Write-Host "==================================" -ForegroundColor Cyan
