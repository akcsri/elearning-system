// ========================================
// PostgreSQL完全対応版への修正
// fix_to_postgresql_version.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 PostgreSQL完全対応版への修正');
console.log('====================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.postgresql_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

console.log('');
console.log('🔨 PostgreSQL対応修正を適用中...');
console.log('');

let fixCount = 0;

// ========================================
// 修正1: loadProgress()を完全にPostgreSQL版に書き換え
// ========================================
console.log('  1/4 loadProgress()をPostgreSQL版に書き換え');

const oldLoadProgress = /async loadProgress\(userId\) \{[\s\S]*?const response = await fetch\(`\$\{this\.API_BASE\}\/api\/progress\/\$\{userId\}`\);[\s\S]*?\},/;

const newLoadProgress = `async loadProgress(userId) {
                try {
                    const courseId = AppData.currentCourse ? AppData.currentCourse.id : null;
                    if (!courseId) return null;
                    
                    const response = await fetch(\`\${this.API_BASE}/progress/\${userId}?courseId=\${courseId}\`);
                    
                    if (response.ok) {
                        const progress = await response.json();
                        console.log('✅ 進捗をロードしました:', progress);
                        
                        return {
                            courseId: progress.course_id,
                            slideIndex: progress.current_slide || 0,
                            screen: progress.quiz_started ? 'quiz' : 'training',
                            answers: progress.quiz_answers || {},
                            showExplanations: {},
                            userName: progress.user_name,
                            userDept: progress.user_dept,
                            questionIndex: progress.question_index || 0
                        };
                    }
                    
                    return null;
                } catch (error) {
                    console.error('❌ 進捗ロードエラー:', error);
                    return null;
                }
            },`;

if (oldLoadProgress.test(content)) {
    content = content.replace(oldLoadProgress, newLoadProgress);
    fixCount++;
    console.log('      ✅ 完了');
} else {
    console.log('      ⚠️  パターンが見つかりません');
}

// ========================================
// 修正2: saveProgress()をPostgreSQL版に書き換え
// ========================================
console.log('  2/4 saveProgress()をPostgreSQL版に書き換え');

const oldSaveProgress = /async saveProgress\(userId\) \{[\s\S]*?const progress = \{[\s\S]*?\};[\s\S]*?const response = await fetch\(`\$\{this\.API_BASE\}\/api\/progress\/\$\{userId\}`[\s\S]*?\},/;

const newSaveProgress = `async saveProgress(userId) {
                try {
                    const progress = {
                        course_id: AppData.currentCourse ? AppData.currentCourse.id : null,
                        current_slide: AppData.learningState.slideIndex,
                        quiz_started: AppData.learningState.screen === 'quiz',
                        quiz_answers: AppData.learningState.answers || {},
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    };
                    
                    const response = await fetch(\`\${this.API_BASE}/progress/\${userId}\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(progress)
                    });
                    
                    if (response.ok) {
                        console.log('💾 進捗を保存しました');
                        return true;
                    }
                    
                    return false;
                } catch (error) {
                    console.error('❌ 進捗保存エラー:', error);
                    return false;
                }
            },`;

if (oldSaveProgress.test(content)) {
    content = content.replace(oldSaveProgress, newSaveProgress);
    fixCount++;
    console.log('      ✅ 完了');
} else {
    console.log('      ⚠️  パターンが見つかりません');
}

// ========================================
// 修正3: clearProgress()をPostgreSQL版に書き換え
// ========================================
console.log('  3/4 clearProgress()をPostgreSQL版に書き換え');

const oldClearProgress = /async clearProgress\(userId\) \{[\s\S]*?const response = await fetch\(`\$\{this\.API_BASE\}\/api\/progress\/\$\{userId\}`[\s\S]*?\},/;

const newClearProgress = `async clearProgress(userId) {
                try {
                    const courseId = AppData.currentCourse ? AppData.currentCourse.id : null;
                    if (!courseId) return true;
                    
                    const response = await fetch(\`\${this.API_BASE}/progress/\${userId}?courseId=\${courseId}\`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        console.log('🗑️ 進捗をクリアしました');
                        return true;
                    }
                    
                    return false;
                } catch (error) {
                    console.error('❌ 進捗クリアエラー:', error);
                    return false;
                }
            },`;

if (oldClearProgress.test(content)) {
    content = content.replace(oldClearProgress, newClearProgress);
    fixCount++;
    console.log('      ✅ 完了');
} else {
    console.log('      ⚠️  パターンが見つかりません');
}

// ========================================
// 修正4: API_BASEのエンドポイントを確認・修正
// ========================================
console.log('  4/4 APIエンドポイントの確認');

// 残っている /api/progress/ を /progress/ に置換
const apiProgressCount = (content.match(/\/api\/progress\//g) || []).length;
if (apiProgressCount > 0) {
    content = content.replace(/\/api\/progress\//g, '/progress/');
    fixCount++;
    console.log(`      ✅ ${apiProgressCount}箇所の/api/progress/を/progress/に修正`);
} else {
    console.log('      ✅ APIエンドポイントは正しいです');
}

console.log('');

// ファイル保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');

console.log('✅ 保存完了');
console.log('');

// 統計情報
console.log('====================================');
console.log('📊 修正結果');
console.log('====================================');
console.log(`適用された修正: ${fixCount} 箇所`);
console.log('====================================');
console.log('');

console.log('✅ PostgreSQL完全対応版への修正が完了しました！');
console.log('');
console.log('次のステップ:');
console.log('');
console.log('1. サーバーを再起動:');
console.log('   Ctrl+C でサーバーを停止');
console.log('   npm start で再起動');
console.log('');
console.log('2. ブラウザを完全リロード:');
console.log('   Ctrl+Shift+R を押す');
console.log('');
console.log('3. F12でコンソールを確認:');
console.log('   400エラーが消えていることを確認');
console.log('');
console.log('4. テスト:');
console.log('   - user1/user1123 でログイン');
console.log('   - 研修を途中（例: スライド10）まで進める');
console.log('   - ログアウト');
console.log('   - 再度ログイン');
console.log('   - 「続きから再開」が表示され、動作することを確認');
console.log('');
console.log('問題がある場合のロールバック:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('====================================');
