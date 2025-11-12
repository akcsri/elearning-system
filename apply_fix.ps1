# Auto-fix script for failed quiz progress retention
# English version to avoid encoding issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Failed Quiz Progress Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# File path
$indexPath = "public\index.html"

if (-not (Test-Path $indexPath)) {
    Write-Host "ERROR: $indexPath not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "File: $indexPath" -ForegroundColor Green

# Create backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "public\index.html.backup.$timestamp"
Copy-Item $indexPath $backupPath
Write-Host "Backup created: $backupPath" -ForegroundColor Green
Write-Host ""

# Read file
$content = Get-Content $indexPath -Raw -Encoding UTF8

Write-Host "Applying fixes..." -ForegroundColor Yellow
Write-Host ""

# Fix 1: finishQuiz() function
Write-Host "1/3 Fixing finishQuiz()..." -ForegroundColor Yellow

$oldCode1 = @'
                if (AppData.currentUser) {
                    await Database.clearProgress(AppData.currentUser.id);
                }
                
                this.render();
'@

$newCode1 = @'
                // Fix: Clear progress only on pass
                if (AppData.currentUser && passed) {
                    await Database.clearProgress(AppData.currentUser.id);
                    console.log('Pass: Progress cleared');
                } else if (AppData.currentUser && !passed) {
                    // Keep progress for failed quiz (allow review)
                    console.log('Fail: Progress kept for review');
                }
                
                this.render();
'@

if ($content -match [regex]::Escape($oldCode1)) {
    $content = $content.Replace($oldCode1, $newCode1)
    Write-Host "  OK: finishQuiz() fixed" -ForegroundColor Green
} else {
    Write-Host "  SKIP: Pattern not found (may be already fixed)" -ForegroundColor Yellow
}

# Fix 2: Add reviewAndRetry() function
Write-Host "2/3 Adding reviewAndRetry()..." -ForegroundColor Yellow

$marker = @'
            async retakeQuiz() {
                if (AppData.currentUser) {
                    await Database.clearProgress(AppData.currentUser.id);
                }
                
                AppData.learningState = {
                    screen: 'start',
                    slideIndex: 0,
                    questionIndex: 0,
                    userName: AppData.learningState.userName,
                    userDept: AppData.learningState.userDept,
                    answers: {},
                    showExplanations: {}
                };
                this.render();
            },
'@

$newFunction = @'
            async reviewAndRetry() {
                console.log('Review mode started');
                
                // Return to slides (progress is kept)
                AppData.learningState.screen = 'training';
                AppData.learningState.slideIndex = 0; // Start from beginning
                AppData.learningState.answers = {}; // Reset quiz answers
                AppData.learningState.showExplanations = {};
                
                // Save progress
                if (AppData.currentUser) {
                    await Database.saveProgress(AppData.currentUser.id);
                }
                
                this.render();
            },

'@

if ($content -match [regex]::Escape($marker) -and $content -notmatch "reviewAndRetry") {
    $content = $content.Replace($marker, $marker + "`r`n" + $newFunction)
    Write-Host "  OK: reviewAndRetry() added" -ForegroundColor Green
} else {
    Write-Host "  SKIP: Function already exists or marker not found" -ForegroundColor Yellow
}

# Fix 3: Update result screen buttons
Write-Host "3/3 Updating result buttons..." -ForegroundColor Yellow

$oldButtons = @'
                        <div class="action-buttons">
                            <button class="btn btn-success" onclick="App.logout()">
'@

$newButtons = @'
                        ${passed ? `
                            <!-- Pass buttons -->
                            <div class="action-buttons">
                                <button class="btn btn-success" onclick="App.logout()">
                                    Download certificate and logout
                                </button>
                                <button class="btn btn-secondary" onclick="App.retakeQuiz()">
                                    Retake from start
                                </button>
                            </div>
                        ` : `
                            <!-- Fail buttons -->
                            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <p style="color: #92400e; margin: 0; line-height: 1.6;">
                                    Advice: Review the explanations for incorrect answers before retrying.
                                </p>
                            </div>
                            
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="App.reviewAndRetry()">
                                    Review slides and retry
                                </button>
                                <button class="btn btn-secondary" onclick="App.retakeQuiz()">
                                    Start over
                                </button>
                            </div>
                        `}

                        <div class="action-buttons-temp-placeholder">
                            <button class="btn btn-success" onclick="App.logout()">
'@

if ($content -match [regex]::Escape($oldButtons) -and $content -notmatch "reviewAndRetry\(\)") {
    $content = $content.Replace($oldButtons, $newButtons)
    # Clean up placeholder
    $content = $content.Replace('<div class="action-buttons-temp-placeholder">', '<div class="action-buttons">')
    Write-Host "  OK: Result buttons updated" -ForegroundColor Green
} else {
    Write-Host "  SKIP: Buttons already updated" -ForegroundColor Yellow
}

# Save file
Write-Host ""
Write-Host "Saving file..." -ForegroundColor Yellow

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($indexPath, $content, $utf8NoBom)

Write-Host "Saved successfully" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Fix completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes:" -ForegroundColor Cyan
Write-Host "1. Progress cleared only on pass" -ForegroundColor White
Write-Host "2. Progress kept on fail (review enabled)" -ForegroundColor White
Write-Host "3. 'Review and retry' button added for failed quiz" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart server" -ForegroundColor White
Write-Host "   Ctrl+C to stop" -ForegroundColor Gray
Write-Host "   node server-postgres.js to restart" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Hard reload browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host ""
Write-Host "3. Test:" -ForegroundColor White
Write-Host "   a) Login as user1" -ForegroundColor Gray
Write-Host "   b) Fail quiz (answer 7 or fewer correctly)" -ForegroundColor Gray
Write-Host "   c) Click 'Review slides and retry'" -ForegroundColor Gray
Write-Host "   d) Verify slides are displayed" -ForegroundColor Gray
Write-Host "   e) Retry quiz and pass" -ForegroundColor Gray
Write-Host "   f) Verify progress is cleared" -ForegroundColor Gray
Write-Host ""
Write-Host "Backup: $backupPath" -ForegroundColor Yellow
Write-Host "To restore if needed:" -ForegroundColor Yellow
Write-Host "  Copy-Item `"$backupPath`" `"$indexPath`"" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
