#!/usr/bin/env python3
import re

# 元のHTMLファイルを読み込み
with open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Database objectの定義を検索して置き換え
# 860行目から1008行目までの部分

# 新しいDatabase実装
new_database = '''        // データベース管理(API使用)
        const Database = {
            API_BASE: window.location.origin,
            
            async save() {
                try {
                    const dataToSave = {
                        users: AppData.users,
                        courses: AppData.courses,
                        learningRecords: AppData.learningRecords,
                        lastUpdated: new Date().toISOString()
                    };
                    const response = await fetch(`${this.API_BASE}/api/data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSave)
                    });
                    const result = await response.json();
                    if (result.success) {
                        console.log('✅ データを保存しました', new Date().toLocaleTimeString());
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('❌ データ保存エラー:', error);
                    return false;
                }
            },
            
            async load() {
                try {
                    const response = await fetch(`${this.API_BASE}/api/data`);
                    if (response.ok) {
                        const data = await response.json();
                        
                        AppData.users = data.users || [];
                        AppData.courses = data.courses || [];
                        AppData.learningRecords = data.learningRecords || [];
                        
                        console.log('✅ データを読み込みました', {
                            users: AppData.users.length,
                            courses: AppData.courses.length,
                            records: AppData.learningRecords.length
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('❌ データ読み込みエラー:', error);
                    return false;
                }
            },
            
            async saveProgress(userId) {
                try {
                    const progress = {
                        ...AppData.learningState,
                        userId: userId,
                        courseId: AppData.currentCourse ? AppData.currentCourse.id : null,
                        lastUpdated: new Date().toISOString()
                    };
                    const response = await fetch(`${this.API_BASE}/api/progress/${userId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(progress)
                    });
                    const result = await response.json();
                    if (result.success) {
                        console.log('💾 進行状況を保存');
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('❌ 進行状況保存エラー:', error);
                    return false;
                }
            },
            
            async loadProgress(userId) {
                try {
                    const response = await fetch(`${this.API_BASE}/api/progress/${userId}`);
                    if (response.ok) {
                        const progress = await response.json();
                        const hoursSince = (Date.now() - new Date(progress.lastUpdated)) / (1000 * 60 * 60);
                        if (hoursSince > 24) {
                            await this.clearProgress(userId);
                            return null;
                        }
                        return progress;
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            },
            
            async clearProgress(userId) {
                try {
                    const response = await fetch(`${this.API_BASE}/api/progress/${userId}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    return result.success || false;
                } catch (error) {
                    return false;
                }
            },
            
            async clear() {
                try {
                    const response = await fetch(`${this.API_BASE}/api/data`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    return result.success || false;
                } catch (error) {
                    return false;
                }
            },
            
            async export() {
                try {
                    const response = await fetch(`${this.API_BASE}/api/export`);
                    if (response.ok) {
                        return await response.text();
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            },
            
            async import(jsonString) {
                try {
                    const data = JSON.parse(jsonString);
                    const response = await fetch(`${this.API_BASE}/api/import`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (result.success) {
                        await this.load();
                        return true;
                    }
                    return false;
                } catch (error) {
                    return false;
                }
            }
        };'''

# 正規表現で古いDatabase定義を検索
pattern = r'// データベース管理.*?const Database = \{.*?\};'
content_modified = re.sub(pattern, new_database, content, flags=re.DOTALL)

# App.init()をasyncに変更
content_modified = content_modified.replace(
    'init() {',
    'async init() {'
)

# Database.load()の呼び出しをawaitに変更
content_modified = content_modified.replace(
    'Database.load();',
    'await Database.load();'
)

# 修正したHTMLを保存
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content_modified)

print('✅ HTMLファイルを修正しました')
print(f'   ファイルサイズ: {len(content_modified)} バイト')
