// ========================================
// 最新版への更新＆続きから再開機能修正スクリプト
// update_to_latest_and_fix.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 最新版への更新＆修正スクリプト');
console.log('====================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.update_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

console.log('');
console.log('🔨 修正を適用中...');
console.log('');

let fixCount = 0;

// ========================================
// 修正: loadProgress() の戻り値に courseId を追加
// ========================================
console.log('  修正: loadProgress() の戻り値');

const oldLoadProgress = `return {
                            slideIndex: progress.current_slide || 0,
                            screen: progress.quiz_started ? 'quiz' : 'training',
                            answers: progress.quiz_answers || {},
                            showExplanations: {}
                        };`;

const newLoadProgress = `return {
                            courseId: progress.course_id,
                            slideIndex: progress.current_slide || 0,
                            screen: progress.quiz_started ? 'quiz' : 'training',
                            answers: progress.quiz_answers || {},
                            showExplanations: {},
                            userName: progress.user_name,
                            userDept: progress.user_dept,
                            questionIndex: progress.question_index || 0
                        };`;

if (content.includes('slideIndex: progress.current_slide || 0,') && 
    !content.includes('courseId: progress.course_id,')) {
    
    content = content.replace(oldLoadProgress, newLoadProgress);
    fixCount++;
    console.log('      ✅ 完了');
} else if (content.includes('courseId: progress.course_id')) {
    console.log('      ℹ️  既に修正済み');
} else {
    console.log('      ⚠️  loadProgress() が見つかりません');
    console.log('      ℹ️  PostgreSQL対応版ではない可能性があります');
}

console.log('');

// ファイル保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');
console.log('✅ 保存完了');
console.log('');

// 結果表示
console.log('====================================');
console.log('📊 修正結果');
console.log('====================================');
console.log(`適用された修正: ${fixCount} 箇所`);
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
    console.log('   - ログアウト → 再ログイン');
    console.log('   - 「続きから再開」をクリック');
    console.log('   - ✅ エラーなく再開できることを確認');
    console.log('');
} else {
    console.log('⚠️  修正パターンが見つかりませんでした');
    console.log('');
    console.log('可能性:');
    console.log('1. ファイルが古いバージョン（PostgreSQL対応前）');
    console.log('2. 既に最新版で修正済み');
    console.log('');
    console.log('確認方法:');
    console.log('1. public/index.htmlを開く');
    console.log('2. "async loadProgress(userId)" を検索');
    console.log('3. "API_BASE" や "fetch" があればPostgreSQL版');
    console.log('   なければ古いバージョン');
    console.log('');
    console.log('古いバージョンの場合:');
    console.log('プロジェクトナレッジから最新のindex.htmlを取得してください');
}

console.log('');
console.log('問題がある場合のロールバック:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('====================================');
