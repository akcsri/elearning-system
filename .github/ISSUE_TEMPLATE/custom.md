---
name: Custom issue template
about: Describe this issue template's purpose here.
title: ''
labels: ''
assignees: ''

---

---
name: Resume Learning Feature
about: Fix page reload issue
title: '[Bug] Page reload loses progress'
labels: bug
assignees: ''

---

## Problem
Page reload loses login state and progress.

## Solution
Use localStorage to save user ID.

## Code
``````javascript
// App.init()
const savedUserId = localStorage.getItem('currentUserId');
if (savedUserId) {
    const user = AppData.users.find(u => u.id === parseInt(savedUserId));
    if (user) {
        AppData.currentUser = user;
    }
}

// App.login()
localStorage.setItem('currentUserId', user.id);

// App.logout()
localStorage.removeItem('currentUserId');
``````

## Test
1. Login
2. Progress to slide 5
3. Reload (F5)
4. Should show slide 5
