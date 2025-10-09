// ========================================
// 完全修正版スクリプト - fix_all_errors.js
// すべての構文エラーを修正
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 全エラー完全修正スクリプト v3');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.complete_fix_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

let modCount = 0;

// ステップ1: 既存の壊れた loadAllProgress を完全削除
console.log('🔨 ステップ1: 既存の壊れたコードを削除');
if (content.includes('loadAllProgress')) {
    // 複数パターンで削除を試行
    content = content.replace(/,?\s*async\s+loadAllProgress\s*\(\s*\)\s*\{[^}]*\}/gs, '');
    content = content.replace(/async\s+loadAllProgress\s*\(\s*\)\s*\{[\s\S]*?\n\s*\}/g, '');
    console.log('   ✓ 既存コードを削除');
}

// ステップ2: await Database.loadAllProgress() の呼び出しを削除
console.log('🔨 ステップ2: 壊れた呼び出しを削除');
content = content.replace(/await\s+Database\.loadAllProgress\(\);?\s*/g, '');
console.log('   ✓ 完了');

// ステップ3: AppDataに progressData を追加（存在しない場合）
console.log('🔨 ステップ3: AppDataに progressData 追加');
const pattern1 = /(const AppData = \{[\s\n]+currentUser: null,[\s\n]+currentCourse: null,[\s\n]+analysisResult: null,[\s\n]+savedProgress: null,)(?!\s*progressData)/;
if (pattern1.test(content)) {
    content = content.replace(pattern1, '$1\n    progressData: {},');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済み');
}

// ステップ4: Database オブジェクトに loadAllProgress を正しく追加
console.log('🔨 ステップ4: Database.loadAllProgress() を正しく追加');

// import メソッドの終わりを見つけて、その後に追加
const importMethodPattern = /(async import\(jsonString\) \{[\s\S]*?return false;\s*\}\s*\})\s*(\}\s*;)/;

if (importMethodPattern.test(content)) {
    const replacement = `$1,
            
            async loadAllProgress() {
                try {
                    const progressData = {};
                    const progressPromises = AppData.users.map(async (user) => {
                        try {
                            const progress = await this.loadProgress(user.id);
                            if (progress) {
                                progressData[user.id] = progress;
                            }
                        } catch (error) {
                            console.error(\`進捗ロードエラー (ユーザー\${user.id}):\`, error);
                        }
                    });
                    await Promise.all(progressPromises);
                    AppData.progressData = progressData;
                    console.log('✅ 全ユーザーの進捗データをロードしました', {
                        loaded: Object.keys(progressData).length,
                        total: AppData.users.length
                    });
                    return true;
                } catch (error) {
                    console.error('❌ 進捗一括ロードエラー:', error);
                    return false;
                }
            }
        $2`;
    
    content = content.replace(importMethodPattern, replacement);
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  Databaseオブジェクトが見つかりません');
}

// ステップ5: App.init() が async 関数であることを確認し、loadAllProgress を呼び出す
console.log('🔨 ステップ5: App.init() で進捗データをロード');

// まず、App.init() が async であることを確認
if (!content.match(/async\s+init\s*\(\s*\)\s*\{/)) {
    console.log('   ⚠️  App.init() が async 関数ではありません。修正します...');
    content = content.replace(/init\s*\(\s*\)\s*\{/, 'async init() {');
}

// loadAllProgress の呼び出しを追加
const initPattern = /(async\s+init\s*\(\s*\)\s*\{\s*await\s+Database\.load\(\);)(?!\s*await\s+Database\.loadAllProgress)/;
if (initPattern.test(content)) {
    content = content.replace(initPattern, '$1\n        await Database.loadAllProgress();');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済みまたはパターンが見つかりません');
}

// ステップ6: renderLearners() の修正
console.log('🔨 ステップ6: renderLearners() を同期化');
const pattern4 = /const progress = Database\.loadProgress\(learner\.id\);/g;
const matches4 = content.match(pattern4);
if (matches4 && matches4.length > 0) {
    content = content.replace(pattern4, 'const progress = AppData.progressData[learner.id];');
    modCount++;
    console.log(`   ✓ 完了 (${matches4.length}箇所)`);
} else {
    console.log('   ⚠️  既に修正済み');
}

// ステップ7: viewLearnerDetail() の修正
console.log('🔨 ステップ7: viewLearnerDetail() を同期化');
const pattern5 = /const progress = Database\.loadProgress\(userId\);/g;
const matches5 = content.match(pattern5);
if (matches5 && matches5.length > 0) {
    content = content.replace(pattern5, 'const progress = AppData.progressData[userId];');
    modCount++;
    console.log(`   ✓ 完了 (${matches5.length}箇所)`);
} else {
    console.log('   ⚠️  既に修正済み');
}

// ステップ8: saveProgress() でprogressDataを更新
console.log('🔨 ステップ8: saveProgress() でprogressDataを更新');
const pattern6 = /(if\s*\(\s*result\.success\s*\)\s*\{\s*console\.log\s*\(\s*['"]💾 進行状況を保存['"]\s*\)\s*;)(?!\s*AppData\.progressData)/;
if (pattern6.test(content)) {
    content = content.replace(pattern6, "$1\n            AppData.progressData[userId] = progress;");
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済み');
}

// ファイルに保存
console.log('');
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');

console.log('');
console.log('==================================');
console.log(`✅ すべてのエラーを修正しました！`);
console.log(`   修正箇所: ${modCount}箇所`);
console.log('==================================');
console.log('');
console.log('修正内容:');
console.log('  ✓ 壊れたコードを削除');
console.log('  ✓ AppData.progressData を追加');
console.log('  ✓ Database.loadAllProgress() を追加');
console.log('  ✓ App.init() を async 関数に修正');
console.log('  ✓ App.init() で loadAllProgress() を呼び出し');
console.log('  ✓ renderLearners() を同期化');
console.log('  ✓ viewLearnerDetail() を同期化');
console.log('  ✓ saveProgress() で progressData を更新');
console.log('');
console.log('次のステップ:');
console.log('1. ブラウザを完全にリロード (Ctrl+Shift+R)');
console.log('2. F12でコンソールを開く');
console.log('3. 以下が表示されることを確認:');
console.log('   ✅ データを読み込みました');
console.log('   ✅ 全ユーザーの進捗データをロードしました');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('==================================');
