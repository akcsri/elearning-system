# GitHub Issue Template Setup Script for PowerShell
# UTF-8 without BOM

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Issue Template Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create directory
Write-Host "Step 1: Creating directory..." -ForegroundColor Yellow
$null = New-Item -ItemType Directory -Force -Path ".github\ISSUE_TEMPLATE"

if (Test-Path ".github\ISSUE_TEMPLATE") {
    Write-Host "OK: Directory created" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to create directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 2: Create main issue template
Write-Host "Step 2: Creating issue template..." -ForegroundColor Yellow

$resumeTemplate = @'
---
name: Resume Learning Feature Fix
about: Auto-restore learning progress on page reload
title: '[Bug Fix] Page reload loses learning progress'
labels: bug, enhancement
assignees: ''

---

## Problem Description

When users reload the page (F5), login state and learning progress are lost.

## Steps to Reproduce

1. Login (e.g., user1 / user1123)
2. Progress through several slides
3. Reload page (F5)
4. User is returned to login screen

## Proposed Solution

### Files to Modify

`public/index.html` - Modify these functions:

1. **App.init()** - Restore login state
2. **App.login()** - Save to localStorage
3. **App.logout()** - Clear localStorage

### Code Example

```javascript
// Add to App.init()
const savedUserId = localStorage.getItem('currentUserId');
if (savedUserId) {
    const user = AppData.users.find(u => u.id === parseInt(savedUserId));
    if (user) {
        AppData.currentUser = user;
        // Restore progress...
    }
}

// Add to App.login()
localStorage.setItem('currentUserId', user.id);

// Add to App.logout()
localStorage.removeItem('currentUserId');
```

## Acceptance Criteria

- [ ] Login state is automatically restored on page reload
- [ ] Learning screen shows the correct slide
- [ ] Logout clears localStorage

## Test Steps

1. Login as user1
2. Progress to slide 5
3. Reload page (F5)
4. Verify slide 5 is displayed automatically
'@

$resumeTemplate | Out-File -FilePath ".github\ISSUE_TEMPLATE\resume-learning-fix.md" -Encoding utf8NoBOM
Write-Host "OK: Issue template created" -ForegroundColor Green
Write-Host ""

# Step 3: Create bug report template
Write-Host "Step 3: Creating bug report template..." -ForegroundColor Yellow

$bugTemplate = @'
---
name: Bug Report
about: Report a bug or issue
title: ''
labels: bug
assignees: ''

---

## Description

A clear description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.
'@

$bugTemplate | Out-File -FilePath ".github\ISSUE_TEMPLATE\bug_report.md" -Encoding utf8NoBOM
Write-Host "OK: Bug report template created" -ForegroundColor Green
Write-Host ""

# Step 4: Create config.yml
Write-Host "Step 4: Creating config.yml..." -ForegroundColor Yellow

$configYml = "blank_issues_enabled: true"
$configYml | Out-File -FilePath ".github\ISSUE_TEMPLATE\config.yml" -Encoding utf8NoBOM
Write-Host "OK: config.yml created" -ForegroundColor Green
Write-Host ""

# Step 5: Verify files
Write-Host "Step 5: Verifying created files..." -ForegroundColor Yellow
Write-Host ""
Get-ChildItem ".github\ISSUE_TEMPLATE" | Format-Table Name, Length -AutoSize
Write-Host ""

# Step 6: Git status
Write-Host "Step 6: Checking Git status..." -ForegroundColor Yellow
Write-Host ""
git status
Write-Host ""

# Completion message
Write-Host "======================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Commit files:" -ForegroundColor White
Write-Host "   git add .github/" -ForegroundColor Gray
Write-Host '   git commit -m "Add issue templates"' -ForegroundColor Gray
Write-Host ""
Write-Host "2. Push to GitHub:" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify:" -ForegroundColor White
Write-Host "   Visit: https://github.com/YOUR-USERNAME/YOUR-REPO/issues/new/choose" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Troubleshooting:" -ForegroundColor White
Write-Host "   - Hard reload browser (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "   - Wait 5-10 minutes for GitHub cache" -ForegroundColor Gray
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
