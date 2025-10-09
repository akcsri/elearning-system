// ========================================
// 完全リセット＆修正スクリプト - reset_and_fix.js
// バックアップから復元 → 正しく修正
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔄 完全リセット＆修正スクリプト');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');
const publicDir = path.dirname(indexPath);

// ステップ1: バックアップファイルを探す
console.log('📦 ステップ1: バックアップファイルを探しています...');

const backupFiles = fs.readdirSync(publicDir)
    .filter(f => f.startsWith('index.html.backup'))
    .map(f => ({
        name: f,
        path: path.join(publicDir, f),
        time: fs.statSync(path.join(publicDir, f)).mtime
    }))
    .sort((a, b) => a.time - b.time);

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
console.log('');

// 最初のバックアップを表示
console.log('利用可能なバックアップ:');
backupFiles.forEach((backup, index) => {
    console.log(`  ${index + 1}. ${backup.name}`);
    console.log(`     作成日時: ${backup.time.toLocaleString('ja-JP')}`);
});
console.log('');

// 最初のバックアップを選択
const selectedBackup = backupFiles[0];
console.log(`📂 最初のバックアップを使用: ${selectedBackup.name}`);
console.log('');

// ステップ2: バックアップから復元
console.log('🔄 ステップ2: バックアップから復元中...');

try {
    fs.copyFileSync(selectedBackup.path, indexPath);
    console.log('✅ 復元完了');
} catch (error) {
    console.error('❌ 復元エラー:', error.message);
    process.exit(1);
}

// 新しいバックアップを作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const newBackupPath = `${indexPath}.backup.reset_${timestamp}`;
fs.copyFileSync(indexPath, newBackupPath);
console.log(`📦 新しいバックアップ作成: ${path.basename(newBackupPath)}`);
console.log('');

// ステップ3: ファイル読み込み
console.log('📄 ステップ3: ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

const originalLines = content.split('\n').length;
const originalSize = content.length;

console.log(`   行数: ${originalLines}`);
console.log(`   サイズ: ${originalSize} 文字`);
console.log('');

// ========================================
// 修正開始
// ========================================
console.log('🔨 ステップ4: 修正を適用中...');
console.log('');

let modCount = 0;

// 修正1: Database重複コード削除
console.log('  1/8 Database重複コード削除');
const duplicatePattern = /\};[\s\n]+localStorage\.setItem\(this\.STORAGE_KEY[\s\S]*?(?=\s*const AppData = \{)/;
if (duplicatePattern.test(content)) {
    content = content.replace(duplicatePattern, '};');
    modCount++;
    console.log('      ✓ 完了');
} else {
    console.log('      ℹ️  重複コードなし');
}

// 修正2: AppData.progressData 追加
console.log('  2/8 AppData.progressData 追加');
if (!content.includes('progressData:')) {
    const appDataPattern = /(const AppData = \{[\s\n]+currentUser: null,[\s\n]+currentCourse: null,[\s\n]+analysisResult: null,[\s\n]+savedProgress: null,)/;
    if (appDataPattern.test(content)) {
        content = content.replace(appDataPattern, '$1\n    progressData: {},');
        modCount++;
        console.log('      ✓ 完了');
    } else {
        console.log('      ⚠️  AppData が見つかりません');
    }
} else {
    console.log('      ℹ️  既に存在');
}

// 修正3: Database.loadAllProgress() 追加
console.log('  3/8 Database.loadAllProgress() 追加');
if (!content.includes('async loadAllProgress()')) {
    const databasePattern = /(async import\(jsonString\) \{[\s\S]*?return false;\s*\}\s*\})\s*(\}\s*;[\s\n]*const AppData)/;
    
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
            }
        `;
        
        content = content.replace(databasePattern, `$1${loadAllProgressCode}\n        $2`);
        modCount++;
        console.log('      ✓ 完了');
    } else {
        console.log('      ⚠️  追加位置が見つかりません');
    }
} else {
    console.log('      ℹ️  既に存在');
}

// 修正4: App.init() を async に
console.log('  4/8 App.init() を async 関数に');
if (!content.match(/async\s+init\s*\(\s*\)\s*\{/)) {
    content = content.replace(/(\s+)init\s*\(\s*\)\s*\{/, '$1async init() {');
    modCount++;
    console.log('      ✓ 完了');
} else {
    console.log('      ℹ️  既に async');
}

// 修正5: App.init() で loadAllProgress 呼び出し
console.log('  5/8 App.init() で進捗ロード');
if (!content.includes('await Database.loadAllProgress()')) {
    const initPattern = /(async\s+init\s*\(\s*\)\s*\{\s*await\s+Database\.load\(\);)/;
    if (initPattern.test(content)) {
        content = content.replace(initPattern, '$1\n        await Database.loadAllProgress();');
        modCount++;
        console.log('      ✓ 完了');
    } else {
        console.log('      ⚠️  App.init() が見つかりません');
    }
} else {
    console.log('      ℹ️  既に追加済み');
}

// 修正6: renderLearners() 同期化
console.log('  6/8 renderLearners() 同期化');
const learnersPattern = /const progress = Database\.loadProgress\(learner\.id\);/g;
if (learnersPattern.test(content)) {
    content = content.replace(learnersPattern, 'const progress = AppData.progressData[learner.id];');
    modCount++;
    console.log('      ✓ 完了');
} else {
    console.log('      ℹ️  既に修正済み');
}

// 修正7: viewLearnerDetail() 同期化
console.log('  7/8 viewLearnerDetail() 同期化');
const detailPattern = /const progress = Database\.loadProgress\(userId\);/g;
if (detailPattern.test(content)) {
    content = content.replace(detailPattern, 'const progress = AppData.progressData[userId];');
    modCount++;
    console.log('      ✓ 完了');
} else {
    console.log('      ℹ️  既に修正済み');
}

// 修正8: saveProgress() で progressData 更新
console.log('  8/8 saveProgress() で progressData 更新');
if (!content.includes('AppData.progressData[userId] = progress;')) {
    const savePattern = /(if\s*\(\s*result\.success\s*\)\s*\{\s*console\.log\s*\(\s*['"]💾 進行状況を保存['"]\s*\)\s*;)/;
    if (savePattern.test(content)) {
        content = content.replace(savePattern, "$1\n            AppData.progressData[userId] = progress;");
        modCount++;
        console.log('      ✓ 完了');
    } else {
        console.log('      ⚠️  saveProgress() が見つかりません');
    }
} else {
    console.log('      ℹ️  既に追加済み');
}

console.log('');

// ファイル保存
console.log('💾 ステップ5: ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');

const finalLines = content.split('\n').length;
const finalSize = content.length;

console.log('✅ 保存完了');
console.log('');

// 統計情報
console.log('==================================');
console.log('📊 統計情報');
console.log('==================================');
console.log(`元の行数: ${originalLines}`);
console.log(`最終行数: ${finalLines}`);
console.log(`差分: ${originalLines - finalLines} 行`);
console.log('');
console.log(`元のサイズ: ${originalSize} 文字`);
console.log(`最終サイズ: ${finalSize} 文字`);
console.log(`差分: ${originalSize - finalSize} 文字`);
console.log('');
console.log(`適用された修正: ${modCount} 箇所`);
console.log('==================================');
console.log('');

// 構文チェック
console.log('🔍 ステップ6: 構文チェック中...');
const { execSync } = require('child_process');
try {
    execSync(`node -c "${indexPath}"`, { encoding: 'utf-8' });
    console.log('✅ 構文エラーなし！');
} catch (error) {
    console.log('❌ 構文エラーが検出されました:');
    console.log(error.message);
    console.log('');
    console.log('バックアップから復元してください:');
    console.log(`  copy "${path.basename(newBackupPath)}" "public\\index.html"`);
    process.exit(1);
}

console.log('');
console.log('==================================');
console.log('✅ すべての修正が完了しました！');
console.log('==================================');
console.log('');
console.log('次のステップ:');
console.log('');
console.log('1. サーバーを再起動:');
console.log('   Ctrl+C でサーバーを停止');
console.log('   node server.js で再起動');
console.log('');
console.log('2. ブラウザを完全リロード:');
console.log('   Ctrl+Shift+R を押す');
console.log('');
console.log('3. コンソールを確認 (F12):');
console.log('   ✅ データを読み込みました');
console.log('   ✅ 全ユーザーの進捗データをロードしました');
console.log('   ← これらが表示されることを確認');
console.log('');
console.log('4. 管理画面で確認:');
console.log('   - 管理者でログイン (admin / admin123)');
console.log('   - 「受講者管理」タブをクリック');
console.log('   - 受講状況が表示されることを確認');
console.log('');
console.log('5. テスト受講:');
console.log('   - user1でログイン (user1 / password123)');
console.log('   - 研修を数枚進める');
console.log('   - ログアウト');
console.log('   - 管理者で確認 → user1が「⏸️ 中断中」になっているか');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(newBackupPath)}" "public\\index.html"`);
console.log('==================================');
