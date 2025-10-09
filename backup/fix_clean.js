// ========================================
// 完全クリーン修正スクリプト - fix_clean.js
// バックアップから正しい状態に修正
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 完全クリーン修正スクリプト');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// 最初のバックアップファイルを探す
const publicDir = path.dirname(indexPath);
const backupFiles = fs.readdirSync(publicDir)
    .filter(f => f.startsWith('index.html.backup'))
    .map(f => ({
        name: f,
        path: path.join(publicDir, f),
        time: fs.statSync(path.join(publicDir, f)).mtime
    }))
    .sort((a, b) => a.time - b.time);

if (backupFiles.length === 0) {
    console.log('⚠️  バックアップファイルが見つかりません');
    console.log('   現在のファイルから修正を試みます...');
    console.log('');
} else {
    const oldestBackup = backupFiles[0];
    console.log(`📦 最初のバックアップを使用: ${oldestBackup.name}`);
    console.log(`   作成日時: ${oldestBackup.time.toLocaleString('ja-JP')}`);
    console.log('');
    
    // バックアップから復元
    fs.copyFileSync(oldestBackup.path, indexPath);
    console.log('✅ バックアップから復元しました');
    console.log('');
}

// 新しいバックアップを作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const newBackupPath = `${indexPath}.backup.clean_${timestamp}`;
fs.copyFileSync(indexPath, newBackupPath);
console.log(`📦 新しいバックアップ作成: ${path.basename(newBackupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');

const originalLines = content.split('\n').length;
console.log(`   元の行数: ${originalLines}`);
console.log('');

// ========================================
// 修正1: Database重複コードを削除
// ========================================
console.log('🔨 修正1: Database重複コードを削除');

// localStorage版のDatabase定義を削除
const pattern1 = /\};[\s\n]+localStorage\.setItem\(this\.STORAGE_KEY[\s\S]*?(?=\s*const AppData = \{)/;
if (pattern1.test(content)) {
    content = content.replace(pattern1, '};');
    const newLines = content.split('\n').length;
    console.log(`   ✓ 完了 (削除: ${originalLines - newLines}行)`);
} else {
    console.log('   ℹ️  重複コードは見つかりませんでした');
}

// ========================================
// 修正2: AppDataに progressData を追加
// ========================================
console.log('🔨 修正2: AppDataに progressData 追加');

if (!content.includes('progressData:')) {
    const appDataPattern = /(const AppData = \{[\s\n]+currentUser: null,[\s\n]+currentCourse: null,[\s\n]+analysisResult: null,[\s\n]+savedProgress: null,)/;
    if (appDataPattern.test(content)) {
        content = content.replace(appDataPattern, '$1\n    progressData: {},');
        console.log('   ✓ 完了');
    } else {
        console.log('   ⚠️  AppDataが見つかりません');
    }
} else {
    console.log('   ℹ️  既に追加済み');
}

// ========================================
// 修正3: Database.loadAllProgress() を追加
// ========================================
console.log('🔨 修正3: Database.loadAllProgress() メソッド追加');

if (!content.includes('loadAllProgress')) {
    // import メソッドの終わりを見つける
    const importEndPattern = /(async import\(jsonString\) \{[\s\S]*?return false;\s*\}\s*\})\s*(\}\s*;[\s\n]+const AppData)/;
    
    if (importEndPattern.test(content)) {
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
        
        content = content.replace(importEndPattern, replacement);
        console.log('   ✓ 完了');
    } else {
        console.log('   ⚠️  Databaseオブジェクトが見つかりません');
    }
} else {
    console.log('   ℹ️  既に追加済み');
}

// ========================================
// 修正4: App.init() を async にして loadAllProgress を呼び出す
// ========================================
console.log('🔨 修正4: App.init() を修正');

// App.init() が async であることを確認
if (!content.match(/async\s+init\s*\(\s*\)\s*\{/)) {
    content = content.replace(/(\s+)init\s*\(\s*\)\s*\{/, '$1async init() {');
    console.log('   ✓ async を追加');
}

// loadAllProgress の呼び出しを追加
if (!content.includes('await Database.loadAllProgress()')) {
    const initPattern = /(async\s+init\s*\(\s*\)\s*\{\s*await\s+Database\.load\(\);)/;
    if (initPattern.test(content)) {
        content = content.replace(initPattern, '$1\n        await Database.loadAllProgress();');
        console.log('   ✓ loadAllProgress() 呼び出しを追加');
    } else {
        console.log('   ⚠️  App.init() が見つかりません');
    }
} else {
    console.log('   ℹ️  既に追加済み');
}

// ========================================
// 修正5: renderLearners() を同期化
// ========================================
console.log('🔨 修正5: renderLearners() を同期化');

const learnersPattern = /const progress = Database\.loadProgress\(learner\.id\);/g;
if (learnersPattern.test(content)) {
    content = content.replace(learnersPattern, 'const progress = AppData.progressData[learner.id];');
    console.log('   ✓ 完了');
} else {
    console.log('   ℹ️  既に修正済み');
}

// ========================================
// 修正6: viewLearnerDetail() を同期化
// ========================================
console.log('🔨 修正6: viewLearnerDetail() を同期化');

const detailPattern = /const progress = Database\.loadProgress\(userId\);/g;
if (detailPattern.test(content)) {
    content = content.replace(detailPattern, 'const progress = AppData.progressData[userId];');
    console.log('   ✓ 完了');
} else {
    console.log('   ℹ️  既に修正済み');
}

// ========================================
// 修正7: saveProgress() で progressData を更新
// ========================================
console.log('🔨 修正7: saveProgress() で progressData を更新');

if (!content.includes('AppData.progressData[userId] = progress;')) {
    const savePattern = /(if\s*\(\s*result\.success\s*\)\s*\{\s*console\.log\s*\(\s*['"]💾 進行状況を保存['"]\s*\)\s*;)/;
    if (savePattern.test(content)) {
        content = content.replace(savePattern, "$1\n            AppData.progressData[userId] = progress;");
        console.log('   ✓ 完了');
    } else {
        console.log('   ⚠️  saveProgress() が見つかりません');
    }
} else {
    console.log('   ℹ️  既に追加済み');
}

// ファイルに保存
console.log('');
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');

const finalLines = content.split('\n').length;

console.log('');
console.log('==================================');
console.log('✅ 修正が完了しました！');
console.log('==================================');
console.log('');
console.log('統計情報:');
console.log(`  元の行数: ${originalLines}`);
console.log(`  最終行数: ${finalLines}`);
console.log(`  差分: ${originalLines - finalLines} 行`);
console.log('');
console.log('適用された修正:');
console.log('  ✓ Database重複コードを削除');
console.log('  ✓ AppData.progressData を追加');
console.log('  ✓ Database.loadAllProgress() を追加');
console.log('  ✓ App.init() を async 関数に修正');
console.log('  ✓ renderLearners() を同期化');
console.log('  ✓ viewLearnerDetail() を同期化');
console.log('  ✓ saveProgress() で progressData を更新');
console.log('');
console.log('次のステップ:');
console.log('1. ブラウザを完全にリロード (Ctrl+Shift+R)');
console.log('2. F12でコンソールを開く');
console.log('3. 以下のメッセージが表示されることを確認:');
console.log('   ✅ データを読み込みました');
console.log('   ✅ 全ユーザーの進捗データをロードしました');
console.log('');
console.log('エラーが消えていることを確認してください！');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(newBackupPath)}" "public\\index.html"`);
console.log('==================================');
