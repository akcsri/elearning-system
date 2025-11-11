// ========================================
// 続きから再開機能 自動修正スクリプト
// fix_resume_learning.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 続きから再開機能 修正スクリプト');
console.log('====================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.resume_fix_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');
const originalLength = content.length;

console.log(`   サイズ: ${originalLength} 文字`);
console.log('');

// 修正カウンター
let fixCount = 0;

console.log('🔨 修正を適用中...');
console.log('');

// ========================================
// 修正1: loadProgress() の戻り値に courseId を追加
// ========================================
console.log('  1/2 loadProgress() の戻り値を修正');

const loadProgressOld = `if (response.ok) {
            const progress = await response.json();
            console.log('✅ 進捗をロードしました:', progress);
            
            return {
                slideIndex: progress.current_slide || 0,
                screen: progress.quiz_started ? 'quiz' : 'training',
                answers: progress.quiz_answers || {},
                showExplanations: {}
            };
        }`;

const loadProgressNew = `if (response.ok) {
            const progress = await response.json();
            console.log('✅ 進捗をロードしました:', progress);
            
            return {
                courseId: progress.course_id,
                slideIndex: progress.current_slide || 0,
                screen: progress.quiz_started ? 'quiz' : 'training',
                answers: progress.quiz_answers || {},
                showExplanations: {},
                userName: progress.user_name,
                userDept: progress.user_dept
            };
        }`;

if (content.includes(loadProgressOld)) {
    content = content.replace(loadProgressOld, loadProgressNew);
    fixCount++;
    console.log('      ✅ 完了');
} else if (content.includes('courseId: progress.course_id')) {
    console.log('      ℹ️  既に修正済み');
} else {
    console.log('      ⚠️  loadProgress() のパターンが一致しません');
    console.log('      ℹ️  手動で修正してください（詳細は fix_resume_learning.md 参照）');
}

// ========================================
// 修正2: resumeLearning() の courseId チェックを改善
// ========================================
console.log('  2/2 resumeLearning() のコース復元ロジックを修正');

// courseId チェック部分を修正
const resumeOld1 = `if (AppData.savedProgress.courseId) {
            const course = AppData.courses.find(function(c) { return c.id === AppData.savedProgress.courseId; });`;

const resumeNew1 = `// ✅ courseId または course_id の両方をチェック
        const savedCourseId = AppData.savedProgress.courseId || AppData.savedProgress.course_id;
        
        if (savedCourseId) {
            const course = AppData.courses.find(function(c) { return c.id === savedCourseId; });`;

if (content.includes(resumeOld1) && !content.includes('savedCourseId')) {
    content = content.replace(resumeOld1, resumeNew1);
    fixCount++;
    console.log('      ✅ コース復元ロジックを修正');
} else if (content.includes('savedCourseId')) {
    console.log('      ℹ️  既に修正済み');
} else {
    console.log('      ⚠️  resumeLearning() のパターンが一致しません');
}

// エラー処理のコースIDログを修正
content = content.replace(
    /console\.warn\('⚠️ 警告: 進行状況のコースID', AppData\.savedProgress\.courseId,/g,
    "console.warn('⚠️ 警告: 進行状況のコースID', savedCourseId,"
);

// 最終安全チェックを追加
const beforeRender = `AppData.savedProgress = null;
        this.render();
    }
}`;

const afterRender = `// ✅ 最後の安全チェック：それでもコースがなければエラーにする
        if (!AppData.currentCourse) {
            alert('エラー: コースが見つかりません。管理者に連絡してください。');
            console.error('❌ エラー: 再開時にコースが見つかりません');
            return;
        }
        
        AppData.savedProgress = null;
        this.render();
    }
}`;

// resumeLearning関数の最後を探して置き換え
const resumeEndPattern = /AppData\.savedProgress = null;\s*this\.render\(\);\s*\}\s*\},?\s*async startFromBeginning/;
if (resumeEndPattern.test(content) && !content.includes('❌ エラー: 再開時にコースが見つかりません')) {
    content = content.replace(
        resumeEndPattern,
        `// ✅ 最後の安全チェック：それでもコースがなければエラーにする
        if (!AppData.currentCourse) {
            alert('エラー: コースが見つかりません。管理者に連絡してください。');
            console.error('❌ エラー: 再開時にコースが見つかりません');
            return;
        }
        
        AppData.savedProgress = null;
        this.render();
    },

    async startFromBeginning`
    );
    fixCount++;
    console.log('      ✅ 安全チェックを追加');
} else if (content.includes('❌ エラー: 再開時にコースが見つかりません')) {
    console.log('      ℹ️  安全チェックは既に追加済み');
}

console.log('');

// ファイル保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');

const finalLength = content.length;
const diff = finalLength - originalLength;

console.log('✅ 保存完了');
console.log('');

// 統計情報
console.log('====================================');
console.log('📊 修正結果');
console.log('====================================');
console.log(`適用された修正: ${fixCount} 箇所`);
console.log(`元のサイズ: ${originalLength} 文字`);
console.log(`最終サイズ: ${finalLength} 文字`);
console.log(`差分: ${diff > 0 ? '+' : ''}${diff} 文字`);
console.log('====================================');
console.log('');

if (fixCount > 0) {
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
    console.log('   - ログアウト');
    console.log('   - 再ログイン → 「続きから再開」をクリック');
    console.log('   - ✅ エラーなく再開できることを確認');
    console.log('');
} else {
    console.log('ℹ️  修正は既に適用されているようです');
    console.log('');
    console.log('問題が続く場合:');
    console.log('  1. fix_resume_learning.md を参照して手動で修正');
    console.log('  2. バックアップから復元:');
    console.log(`     copy "${path.basename(backupPath)}" "public\\index.html"`);
    console.log('');
}

console.log('問題がある場合のロールバック:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('====================================');
