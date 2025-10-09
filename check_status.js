// ========================================
// 診断スクリプト - check_status.js
// 現在の状態を確認
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔍 受講状況表示の診断スクリプト');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

const content = fs.readFileSync(indexPath, 'utf-8');

console.log('📊 診断結果:');
console.log('');

// チェック1: progressData の存在
console.log('1️⃣  AppData.progressData の存在:');
if (content.includes('progressData:')) {
    console.log('   ✅ 存在します');
} else {
    console.log('   ❌ 存在しません - 修正が必要');
}

// チェック2: loadAllProgress メソッドの存在
console.log('');
console.log('2️⃣  Database.loadAllProgress() の存在:');
if (content.includes('async loadAllProgress()')) {
    console.log('   ✅ 存在します');
} else {
    console.log('   ❌ 存在しません - 修正が必要');
}

// チェック3: App.init() での呼び出し
console.log('');
console.log('3️⃣  App.init() での loadAllProgress() 呼び出し:');
if (content.includes('await Database.loadAllProgress()')) {
    console.log('   ✅ 存在します');
} else {
    console.log('   ❌ 存在しません - 修正が必要');
}

// チェック4: renderLearners() の修正
console.log('');
console.log('4️⃣  renderLearners() の progressData 使用:');
if (content.includes('AppData.progressData[learner.id]')) {
    console.log('   ✅ 正しく修正されています');
} else if (content.includes('Database.loadProgress(learner.id)')) {
    console.log('   ❌ 古いコードのままです - 修正が必要');
} else {
    console.log('   ⚠️  どちらも見つかりません');
}

// チェック5: viewLearnerDetail() の修正
console.log('');
console.log('5️⃣  viewLearnerDetail() の progressData 使用:');
if (content.includes('AppData.progressData[userId]')) {
    console.log('   ✅ 正しく修正されています');
} else if (content.includes('Database.loadProgress(userId)')) {
    console.log('   ❌ 古いコードのままです - 修正が必要');
} else {
    console.log('   ⚠️  どちらも見つかりません');
}

// チェック6: saveProgress() での更新
console.log('');
console.log('6️⃣  saveProgress() での progressData 更新:');
if (content.match(/AppData\.progressData\[userId\]\s*=\s*progress/)) {
    console.log('   ✅ 正しく修正されています');
} else {
    console.log('   ❌ 更新コードがありません - 修正が必要');
}

// チェック7: App.init() が async か
console.log('');
console.log('7️⃣  App.init() が async 関数か:');
if (content.match(/async\s+init\s*\(\s*\)\s*\{/)) {
    console.log('   ✅ async 関数です');
} else {
    console.log('   ❌ async ではありません - 修正が必要');
}

// 総合判定
console.log('');
console.log('========================================');

const checks = [
    content.includes('progressData:'),
    content.includes('async loadAllProgress()'),
    content.includes('await Database.loadAllProgress()'),
    content.includes('AppData.progressData[learner.id]'),
    content.includes('AppData.progressData[userId]'),
    content.match(/AppData\.progressData\[userId\]\s*=\s*progress/),
    content.match(/async\s+init\s*\(\s*\)\s*\{/)
];

const passedChecks = checks.filter(c => c).length;
const totalChecks = checks.length;

console.log(`総合結果: ${passedChecks}/${totalChecks} 項目が正常`);
console.log('');

if (passedChecks === totalChecks) {
    console.log('✅ すべての修正が適用されています！');
    console.log('');
    console.log('受講状況が表示されない場合:');
    console.log('1. ブラウザを完全にリロード (Ctrl+Shift+R)');
    console.log('2. ブラウザのキャッシュをクリア');
    console.log('3. F12でコンソールを開いて以下を確認:');
    console.log('   - エラーメッセージがないか');
    console.log('   - "全ユーザーの進捗データをロードしました" が表示されるか');
    console.log('4. サーバーを再起動');
} else {
    console.log('❌ 修正が不完全です');
    console.log('');
    console.log('次のステップ:');
    console.log('  node fix_progress_final.js');
    console.log('');
    console.log('を実行して修正を適用してください');
}

console.log('========================================');
