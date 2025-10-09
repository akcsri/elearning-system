// ========================================
// 最終修正スクリプト - fix_progress_final.js
// 受講状況表示を確実に修正
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 受講状況表示 最終修正スクリプト');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.final_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

let fixCount = 0;

// ========================================
// 修正1: AppDataに progressData を追加（存在しない場合）
// ========================================
console.log('🔨 修正1: AppData.progressData を確認');

if (!content.includes('progressData:')) {
    const appDataPattern = /(const AppData = \{[\s\n]+currentUser: null,[\s\n]+currentCourse: null,[\s\n]+analysisResult: null,[\s\n]+savedProgress: null,)/;
    if (appDataPattern.test(content)) {
        content = content.replace(appDataPattern, '$1\n    progressData: {},');
        fixCount++;
        console.log('   ✓ progressData を追加しました');
    } else {
        console.log('   ⚠️  AppData が見つかりません');
    }
} else {
    console.log('   ✓ 既に存在します');
}

// ========================================
// 修正2: 既存の壊れた loadAllProgress を削除
// ========================================
console.log('🔨 修正2: 既存の loadAllProgress を削除');

let removed = false;
// 不完全な loadAllProgress を削除
while (content.includes('loadAllProgress')) {
    const beforeLength = content.length;
    content = content.replace(/,?\s*async\s+loadAllProgress\s*\(\s*\)\s*\{[^}]*\}/gs, '');
    content = content.replace(/async\s+loadAllProgress\s*\(\s*\)\s*\{[\s\S]*?\n\s*\}/g, '');
    if (content.length === beforeLength) break;
    removed = true;
}

if (removed) {
    console.log('   ✓ 既存コードを削除しました');
} else {
    console.log('   ✓ 削除するコードはありませんでした');
}

// ========================================
// 修正3: Database.loadAllProgress() を正しく追加
// ========================================
console.log('🔨 修正3: Database.loadAllProgress() を追加');

// import メソッドの後ろに追加
const databasePattern = /(async import\(jsonString\) \{[\s\S]*?return false;\s*\}\s*\})\s*(\}\s*;[\s\n]*(?:\/\/.*\n)?[\s\n]*const AppData)/;

if (databasePattern.test(content)) {
    const loadAllProgressCode = `,

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
            }`;
    
    content = content.replace(databasePattern, `$1${loadAllProgressCode}\n        $2`);
    fixCount++;
    console.log('   ✓ loadAllProgress() を追加しました');
} else {
    console.log('   ⚠️  追加位置が見つかりません');
}

// ========================================
// 修正4: await Database.loadAllProgress() の呼び出しを削除（一旦）
// ========================================
console.log('🔨 修正4: 既存の呼び出しを削除');

content = content.replace(/\s*await\s+Database\.loadAllProgress\(\);\s*/g, '');
console.log('   ✓ 既存の呼び出しを削除しました');

// ========================================
// 修正5: App.init() が async であることを確認
// ========================================
console.log('🔨 修正5: App.init() を async 関数に');

if (!content.match(/async\s+init\s*\(\s*\)\s*\{/)) {
    content = content.replace(/(\s+)init\s*\(\s*\)\s*\{/, '$1async init() {');
    fixCount++;
    console.log('   ✓ async を追加しました');
} else {
    console.log('   ✓ 既に async 関数です');
}

// ========================================
// 修正6: App.init() で loadAllProgress を呼び出す
// ========================================
console.log('🔨 修正6: App.init() で進捗をロード');

const initPattern = /(async\s+init\s*\(\s*\)\s*\{\s*await\s+Database\.load\(\);)/;
if (initPattern.test(content)) {
    content = content.replace(initPattern, '$1\n        await Database.loadAllProgress();');
    fixCount++;
    console.log('   ✓ loadAllProgress() 呼び出しを追加しました');
} else {
    console.log('   ⚠️  App.init() が見つかりません');
}

// ========================================
// 修正7: renderLearners() を同期化
// ========================================
console.log('🔨 修正7: renderLearners() を同期化');

const learnersOldPattern = /const progress = Database\.loadProgress\(learner\.id\);/g;
if (learnersOldPattern.test(content)) {
    content = content.replace(learnersOldPattern, 'const progress = AppData.progressData[learner.id];');
    fixCount++;
    console.log('   ✓ progressData を使用するように変更しました');
} else {
    console.log('   ✓ 既に修正済みです');
}

// ========================================
// 修正8: viewLearnerDetail() を同期化
// ========================================
console.log('🔨 修正8: viewLearnerDetail() を同期化');

const detailOldPattern = /const progress = Database\.loadProgress\(userId\);/g;
if (detailOldPattern.test(content)) {
    content = content.replace(detailOldPattern, 'const progress = AppData.progressData[userId];');
    fixCount++;
    console.log('   ✓ progressData を使用するように変更しました');
} else {
    console.log('   ✓ 既に修正済みです');
}

// ========================================
// 修正9: saveProgress() で progressData を更新
// ========================================
console.log('🔨 修正9: saveProgress() で progressData を更新');

if (!content.includes('AppData.progressData[userId] = progress;')) {
    const savePattern = /(if\s*\(\s*result\.success\s*\)\s*\{\s*console\.log\s*\(\s*['"]💾 進行状況を保存['"]\s*\)\s*;)/;
    if (savePattern.test(content)) {
        content = content.replace(savePattern, "$1\n            AppData.progressData[userId] = progress;");
        fixCount++;
        console.log('   ✓ progressData 更新コードを追加しました');
    } else {
        console.log('   ⚠️  saveProgress() が見つかりません');
    }
} else {
    console.log('   ✓ 既に追加済みです');
}

// ファイルに保存
console.log('');
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');

console.log('');
console.log('==================================');
console.log(`✅ 修正が完了しました！`);
console.log(`   適用された修正: ${fixCount}箇所`);
console.log('==================================');
console.log('');
console.log('適用された修正:');
console.log('  ✓ AppData.progressData 追加');
console.log('  ✓ Database.loadAllProgress() 追加');
console.log('  ✓ App.init() を async 関数に修正');
console.log('  ✓ App.init() で進捗をロード');
console.log('  ✓ renderLearners() を同期化');
console.log('  ✓ viewLearnerDetail() を同期化');
console.log('  ✓ saveProgress() で progressData を更新');
console.log('');
console.log('🔍 動作確認手順:');
console.log('');
console.log('1. サーバーを再起動:');
console.log('   Ctrl+C でサーバーを停止');
console.log('   node server.js で再起動');
console.log('');
console.log('2. ブラウザを完全リロード:');
console.log('   Ctrl+Shift+R を押す');
console.log('   または F12 → Application → Clear storage → Clear site data');
console.log('');
console.log('3. コンソールを確認 (F12):');
console.log('   以下が表示されることを確認:');
console.log('   ✅ データを読み込みました');
console.log('   ✅ 全ユーザーの進捗データをロードしました');
console.log('');
console.log('4. 管理画面で確認:');
console.log('   - 管理者でログイン (admin / admin123)');
console.log('   - 「受講者管理」タブをクリック');
console.log('   - 受講状況カラムに以下が表示されるか確認:');
console.log('     ⏸️ 中断中 / ✅ 修了 / ❌ 不合格 / 未開始');
console.log('');
console.log('5. テスト手順:');
console.log('   a) 受講者でログイン (user1 / password123)');
console.log('   b) 研修を途中まで進める');
console.log('   c) ログアウト');
console.log('   d) 管理者でログイン');
console.log('   e) user1の状況が「⏸️ 中断中」になっているか確認');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('==================================');
