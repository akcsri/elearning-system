// ========================================
// マージコンフリクト完全削除＆正しい修正スクリプト
// fix_merge_and_resume.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 マージコンフリクト完全削除＆修正スクリプト');
console.log('====================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// クリーンなバックアップを探す
const publicDir = path.dirname(indexPath);
console.log('📦 クリーンなバックアップを探しています...');

const backupFiles = fs.readdirSync(publicDir)
    .filter(f => f.startsWith('index.html.backup'))
    .filter(f => !f.includes('resume_fix') && !f.includes('syntax_fix')) // 問題のあるバックアップは除外
    .map(f => ({
        name: f,
        path: path.join(publicDir, f),
        time: fs.statSync(path.join(publicDir, f)).mtime
    }))
    .sort((a, b) => a.time - b.time); // 古い順（最初の = 一番クリーン）

if (backupFiles.length === 0) {
    console.error('❌ バックアップファイルが見つかりません');
    console.log('');
    console.log('手動で以下を実行してください:');
    console.log('1. 元のindex.htmlファイルを用意');
    console.log('2. public\\index.html として配置');
    console.log('3. このスクリプトを再実行');
    process.exit(1);
}

console.log(`✅ ${backupFiles.length}個のバックアップが見つかりました`);
console.log(`📂 最初の（最もクリーンな）バックアップを使用: ${backupFiles[0].name}`);
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
const newBackupPath = `${indexPath}.backup.clean_fix_${timestamp}`;
fs.copyFileSync(indexPath, newBackupPath);
console.log(`📦 新しいバックアップ作成: ${path.basename(newBackupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');
const lines = content.split('\n');

console.log(`   総行数: ${lines.length}`);
console.log('');

// マージコンフリクトマーカーをチェック
console.log('🔍 マージコンフリクトマーカーをチェック中...');
let conflictCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^<{7}(?:\s|$)/.test(line) || 
        /^={7}(?:\s|$)/.test(line) || 
        /^>{7}(?:\s|$)/.test(line) ||
        /^\|{7}(?:\s|$)/.test(line)) {
        console.log(`   ⚠️  行 ${i + 1}: ${line.substring(0, 50)}`);
        conflictCount++;
    }
}

if (conflictCount > 0) {
    console.log(`❌ ${conflictCount} 個のマージコンフリクトマーカーが見つかりました`);
    console.log('');
    console.log('このバックアップもマージコンフリクトを含んでいます。');
    console.log('プロジェクトナレッジから元のファイルを取得してください。');
    process.exit(1);
} else {
    console.log('✅ マージコンフリクトマーカーは見つかりませんでした');
}

console.log('');

// 1010行目付近をチェック
console.log('🔍 1010行目付近をチェック:');
console.log('----------------------------------------');
for (let i = 1005; i <= 1015; i++) {
    if (i < lines.length) {
        console.log(`${i + 1}: ${lines[i].substring(0, 100)}`);
    }
}
console.log('----------------------------------------');
console.log('');

// 修正を適用
console.log('🔨 続きから再開機能の修正を適用中...');
console.log('');

let fixCount = 0;

// ========================================
// 修正1: loadProgress() の戻り値を修正
// ========================================
console.log('  1/2 loadProgress() の戻り値を修正');

// パターン1: 最も基本的な形
if (content.includes('return {\n                slideIndex: progress.current_slide || 0,\n                screen: progress.quiz_started') &&
    !content.includes('courseId: progress.course_id')) {
    
    content = content.replace(
        /return \{\s+slideIndex: progress\.current_slide \|\| 0,\s+screen: progress\.quiz_started \? 'quiz' : 'training',\s+answers: progress\.quiz_answers \|\| \{\},\s+showExplanations: \{\}\s+\};/,
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
    console.log('      ⚠️  パターンが一致しません（手動修正が必要）');
}

// ========================================
// 修正2: resumeLearning() のコース復元ロジック
// ========================================
console.log('  2/2 resumeLearning() のコース復元を修正');

if (content.includes('if (AppData.savedProgress.courseId) {') && !content.includes('savedCourseId')) {
    
    // より柔軟なパターンマッチング
    const pattern = /if \(AppData\.savedProgress\.courseId\) \{\s+const course = AppData\.courses\.find\(function\(c\) \{ return c\.id === AppData\.savedProgress\.courseId; \}\);/;
    
    if (pattern.test(content)) {
        content = content.replace(
            pattern,
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
    } else {
        console.log('      ⚠️  パターンが一致しません（手動修正が必要）');
    }
} else if (content.includes('savedCourseId')) {
    console.log('      ℹ️  既に修正済み');
} else {
    console.log('      ⚠️  resumeLearning() が見つかりません');
}

console.log('');

// ファイル保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');
console.log('✅ 保存完了');
console.log('');

// 最終チェック
console.log('🔍 最終チェック中...');
const finalLines = content.split('\n');
let issues = 0;

// 1010行目付近を再チェック
console.log('');
console.log('修正後の1010行目付近:');
console.log('----------------------------------------');
for (let i = 1005; i <= 1015; i++) {
    if (i < finalLines.length) {
        const line = finalLines[i];
        console.log(`${i + 1}: ${line.substring(0, 100)}`);
        
        // 問題のあるパターンをチェック
        if (/^<{2,}/.test(line) || /^>{2,}/.test(line)) {
            console.log(`   ⚠️  この行に問題があります`);
            issues++;
        }
    }
}
console.log('----------------------------------------');
console.log('');

if (issues > 0) {
    console.log(`⚠️  ${issues} 個の問題が残っています`);
    console.log('');
    console.log('バックアップから復元してください:');
    console.log(`  copy "${path.basename(newBackupPath)}" "public\\index.html"`);
} else {
    console.log('✅ 問題は見つかりませんでした');
}

console.log('');
console.log('====================================');
console.log('📊 修正結果');
console.log('====================================');
console.log(`適用された修正: ${fixCount} 箇所`);
console.log(`元の行数: ${lines.length}`);
console.log(`最終行数: ${finalLines.length}`);
console.log('====================================');
console.log('');

if (fixCount > 0 && issues === 0) {
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
    console.log('3. テスト:');
    console.log('   - user1でログイン');
    console.log('   - 研修を途中まで進める');
    console.log('   - ログアウト → 再ログイン');
    console.log('   - 「続きから再開」をクリック');
    console.log('   - ✅ エラーなく再開できることを確認');
} else {
    console.log('⚠️  修正が不完全です');
    console.log('');
    console.log('プロジェクトナレッジから元のindex.htmlを取得してください。');
}

console.log('');
console.log('問題がある場合のロールバック:');
console.log(`  copy "${path.basename(newBackupPath)}" "public\\index.html"`);
console.log('====================================');
