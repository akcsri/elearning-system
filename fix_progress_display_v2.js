// ========================================
// 構文エラー修正版 - fix_progress_display_v2.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 受講状況表示の修正スクリプト v2');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.syntax_fix_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

let modCount = 0;

// 修正1: AppDataに progressData を追加
console.log('🔨 修正1: AppDataに progressData 追加');
const pattern1 = /(const AppData = \{[\s\n]+currentUser: null,[\s\n]+currentCourse: null,[\s\n]+analysisResult: null,[\s\n]+savedProgress: null,)(?!\s*progressData)/;
if (pattern1.test(content)) {
    content = content.replace(pattern1, '$1\n    progressData: {},');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済みまたはパターンが見つかりません');
}

// 修正2: 既存の loadAllProgress を削除（構文エラーの可能性があるため）
console.log('🔨 修正2: 既存の loadAllProgress を削除');
if (content.includes('loadAllProgress')) {
    // 既存の不完全な loadAllProgress を削除
    content = content.replace(/,?\s*async loadAllProgress\(\)\s*\{[^}]*\}/gs, '');
    console.log('   ✓ 既存のloadAllProgressを削除');
}

// 修正3: Database の最後に loadAllProgress を正しく追加
console.log('🔨 修正3: loadAllProgress() を正しく追加');

// Databaseオブジェクトの終わり（}; の直前）を見つける
const databaseEndPattern = /(async import\(jsonString\) \{[\s\S]*?\n            \})\s*(}\s*;)/;

if (databaseEndPattern.test(content)) {
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
    
    content = content.replace(databaseEndPattern, replacement);
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  Databaseオブジェクトのパターンが見つかりません');
}

// 修正4: App.init() で進捗ロード
console.log('🔨 修正4: App.init() で進捗データをロード');
const pattern3 = /(async init\(\) \{\s*await Database\.load\(\);)(?!\s*await Database\.loadAllProgress)/;
if (pattern3.test(content)) {
    content = content.replace(pattern3, '$1\n        await Database.loadAllProgress();');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済みまたはパターンが見つかりません');
}

// 修正5: renderLearners() の修正
console.log('🔨 修正5: renderLearners() を同期化');
const pattern4 = /const progress = Database\.loadProgress\(learner\.id\);/g;
const matches4 = content.match(pattern4);
if (matches4 && matches4.length > 0) {
    content = content.replace(pattern4, 'const progress = AppData.progressData[learner.id];');
    modCount++;
    console.log(`   ✓ 完了 (${matches4.length}箇所)`);
} else {
    console.log('   ⚠️  既に修正済みまたはパターンが見つかりません');
}

// 修正6: viewLearnerDetail() の修正
console.log('🔨 修正6: viewLearnerDetail() を同期化');
const pattern5 = /const progress = Database\.loadProgress\(userId\);/g;
const matches5 = content.match(pattern5);
if (matches5 && matches5.length > 0) {
    content = content.replace(pattern5, 'const progress = AppData.progressData[userId];');
    modCount++;
    console.log(`   ✓ 完了 (${matches5.length}箇所)`);
} else {
    console.log('   ⚠️  既に修正済みまたはパターンが見つかりません');
}

// 修正7: saveProgress() でprogressDataを更新
console.log('🔨 修正7: saveProgress() でprogressDataを更新');
const pattern6 = /(if \(result\.success\) \{\s*console\.log\(['"]💾 進行状況を保存['"]\);)(?!\s*AppData\.progressData)/;
if (pattern6.test(content)) {
    content = content.replace(pattern6, "$1\n            AppData.progressData[userId] = progress;");
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済みまたはパターンが見つかりません');
}

// ファイルに保存
console.log('');
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');

console.log('');
console.log('==================================');
console.log(`✅ 構文エラーを修正しました！ (${modCount}箇所)`);
console.log('==================================');
console.log('');
console.log('次のステップ:');
console.log('1. ブラウザをリロード (Ctrl+Shift+R)');
console.log('2. F12でコンソールを開く');
console.log('3. エラーが消えていることを確認');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('==================================');
