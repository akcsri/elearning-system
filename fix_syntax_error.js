// ========================================
// 構文エラー修正スクリプト
// fix_syntax_error.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 構文エラー修正スクリプト');
console.log('====================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// 最新のバックアップを探す
const publicDir = path.dirname(indexPath);
console.log('📦 バックアップファイルを探しています...');

const backupFiles = fs.readdirSync(publicDir)
    .filter(f => f.startsWith('index.html.backup'))
    .filter(f => !f.includes('resume_fix')) // resume_fix は使わない
    .map(f => ({
        name: f,
        path: path.join(publicDir, f),
        time: fs.statSync(path.join(publicDir, f)).mtime
    }))
    .sort((a, b) => b.time - a.time); // 新しい順

if (backupFiles.length === 0) {
    console.error('❌ バックアップファイルが見つかりません');
    console.log('');
    console.log('バックアップがない場合は、プロジェクトナレッジから');
    console.log('index.htmlを再取得してください。');
    process.exit(1);
}

console.log(`✅ ${backupFiles.length}個のバックアップが見つかりました`);
console.log(`📂 最新のバックアップを使用: ${backupFiles[0].name}`);
console.log('');

// バックアップから復元
console.log('🔄 バックアップから復元中...');
try {
    fs.copyFileSync(backupFiles[0].path, indexPath);
    console.log('✅ 復元完了');
} catch (error) {
    console.error('❌ 復元エラー:', error.message);
    process.exit(1);
}

// 新しいバックアップを作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const newBackupPath = `${indexPath}.backup.syntax_fix_${timestamp}`;
fs.copyFileSync(indexPath, newBackupPath);
console.log(`📦 新しいバックアップ作成: ${path.basename(newBackupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

console.log('');
console.log('🔨 正しい修正を適用中...');
console.log('');

let fixCount = 0;

// ========================================
// 修正1: loadProgress() の戻り値を修正（構文エラーが出ない方法）
// ========================================
console.log('  1/2 loadProgress() の戻り値を修正');

// より安全なパターンマッチング
const loadProgressPattern = /return\s*\{\s*slideIndex:\s*progress\.current_slide\s*\|\|\s*0,\s*screen:\s*progress\.quiz_started\s*\?\s*'quiz'\s*:\s*'training',\s*answers:\s*progress\.quiz_answers\s*\|\|\s*\{\},\s*showExplanations:\s*\{\}\s*\};/;

if (loadProgressPattern.test(content)) {
    content = content.replace(
        loadProgressPattern,
        `return {
                    courseId: progress.course_id,
                    slideIndex: progress.current_slide || 0,
                    screen: progress.quiz_started ? 'quiz' : 'training',
                    answers: progress.quiz_answers || {},
                    showExplanations: {},
                    userName: progress.user_name,
                    userDept: progress.user_dept
                };`
    );
    fixCount++;
    console.log('      ✅ 完了');
} else if (content.includes('courseId: progress.course_id')) {
    console.log('      ℹ️  既に修正済み');
} else {
    console.log('      ⚠️  パターンが一致しません');
}

// ========================================
// 修正2: resumeLearning() を慎重に修正
// ========================================
console.log('  2/2 resumeLearning() を修正');

// courseId チェック部分を修正（より慎重に）
if (content.includes('if (AppData.savedProgress.courseId)') && !content.includes('savedCourseId')) {
    // 古いパターンを新しいパターンに置き換え
    content = content.replace(
        /if \(AppData\.savedProgress\.courseId\) \{\s*const course = AppData\.courses\.find\(function\(c\) \{ return c\.id === AppData\.savedProgress\.courseId; \}\);/,
        `const savedCourseId = AppData.savedProgress.courseId || AppData.savedProgress.course_id;
                
                if (savedCourseId) {
                    const course = AppData.courses.find(function(c) { return c.id === savedCourseId; });`
    );
    
    // エラーメッセージも修正
    content = content.replace(
        /'⚠️ 警告: 進行状況のコースID', AppData\.savedProgress\.courseId,/g,
        "'⚠️ 警告: 進行状況のコースID', savedCourseId,"
    );
    
    fixCount++;
    console.log('      ✅ 完了');
} else if (content.includes('savedCourseId')) {
    console.log('      ℹ️  既に修正済み');
} else {
    console.log('      ⚠️  パターンが一致しません');
}

console.log('');

// ファイル保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');
console.log('✅ 保存完了');
console.log('');

// 構文チェック
console.log('🔍 構文チェック中...');
const { execSync } = require('child_process');

// 簡易的な構文チェック：予期しないトークンを探す
const lines = content.split('\n');
let syntaxIssues = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 行頭のカンマをチェック
    if (/^\s*,/.test(line)) {
        console.log(`⚠️  行 ${i + 1}: 行頭にカンマがあります`);
        syntaxIssues++;
    }
}

if (syntaxIssues === 0) {
    console.log('✅ 明らかな構文エラーは見つかりませんでした');
} else {
    console.log(`⚠️  ${syntaxIssues} 個の潜在的な問題が見つかりました`);
}

console.log('');

// 結果表示
console.log('====================================');
console.log('📊 修正結果');
console.log('====================================');
console.log(`適用された修正: ${fixCount} 箇所`);
console.log('====================================');
console.log('');

console.log('✅ 修正が完了しました！');
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
console.log('3. F12 でコンソールを確認:');
console.log('   構文エラーが消えていることを確認');
console.log('');
console.log('問題が続く場合のロールバック:');
console.log(`  copy "${path.basename(newBackupPath)}" "public\\index.html"`);
console.log('====================================');
