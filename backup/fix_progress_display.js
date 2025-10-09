// ========================================
// 受講状況表示の自動修正スクリプト (Node.js)
// ========================================
// 
// 使い方:
// node fix_progress_display.js
//
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 受講状況表示の修正スクリプト');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

// ファイルの存在確認
if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.progress_${timestamp}`;

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
const pattern1 = /(const AppData = \{[\s\n]+currentUser: null,[\s\n]+currentCourse: null,[\s\n]+analysisResult: null,[\s\n]+savedProgress: null,)/;
if (pattern1.test(content)) {
    content = content.replace(pattern1, '$1\n    progressData: {}, // 全ユーザーの進捗データ');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  パターンが見つかりません（既に修正済みの可能性）');
}

// 修正2: Database.loadAllProgress() を追加
console.log('🔨 修正2: Database.loadAllProgress() 追加');
const pattern2 = /(async import\(jsonString\) \{[\s\S]*?\n            \}[\s\n]+\}\s*;)/;
const replacement2 = `$1

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
        };`;

if (!content.includes('async loadAllProgress()')) {
    content = content.replace(pattern2, replacement2);
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済み');
}

// 修正3: App.init() で進捗ロード
console.log('🔨 修正3: App.init() で進捗データをロード');
const pattern3 = /(async init\(\) \{\s*await Database\.load\(\);)/;
if (!content.includes('await Database.loadAllProgress()')) {
    content = content.replace(pattern3, '$1\n        await Database.loadAllProgress();');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  既に追加済み');
}

// 修正4: renderLearners() の修正
console.log('🔨 修正4: renderLearners() を同期化');
const pattern4 = /const progress = Database\.loadProgress\(learner\.id\);/g;
if (pattern4.test(content)) {
    content = content.replace(pattern4, 'const progress = AppData.progressData[learner.id];');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  パターンが見つかりません（既に修正済みの可能性）');
}

// 修正5: viewLearnerDetail() の修正
console.log('🔨 修正5: viewLearnerDetail() を同期化');
const pattern5 = /const progress = Database\.loadProgress\(userId\);/g;
if (pattern5.test(content)) {
    content = content.replace(pattern5, 'const progress = AppData.progressData[userId];');
    modCount++;
    console.log('   ✓ 完了');
} else {
    console.log('   ⚠️  パターンが見つかりません（既に修正済みの可能性）');
}

// 修正6: saveProgress() でprogressDataを更新
console.log('🔨 修正6: saveProgress() でprogressDataを更新');
const pattern6 = /(if \(result\.success\) \{\s*console\.log\('💾 進行状況を保存'\);)/;
if (!content.includes('AppData.progressData[userId] = progress;')) {
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
console.log(`✅ 修正完了！ (${modCount}箇所を修正)`);
console.log('==================================');
console.log('');
console.log('次のステップ:');
console.log('1. ブラウザをリロード (Ctrl+Shift+R)');
console.log('2. 管理画面 → 受講者管理 を確認');
console.log('3. 受講状況が表示されることを確認');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('==================================');
