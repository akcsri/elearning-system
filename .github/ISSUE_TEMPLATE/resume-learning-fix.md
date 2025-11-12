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

Modify `public/index.html`:
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
