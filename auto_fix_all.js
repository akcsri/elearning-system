// ========================================
// index.html 完全自動修正スクリプト
// auto_fix_all.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 index.html 完全自動修正');
console.log('====================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    console.log('');
    console.log('このスクリプトはプロジェクトのルートディレクトリで実行してください');
    console.log('  cd C:\\elearning-system');
    console.log('  node auto_fix_all.js');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.auto_fix_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');
const originalLength = content.length;

console.log('');
console.log('🔨 修正を適用中...');
console.log('');

let fixCount = 0;

// ========================================
// 修正1: マージコンフリクトマーカーの削除（loadAllProgress周辺）
// ========================================
console.log('  1/3 マージコンフリクト解消（loadAllProgress）');

const mergePattern1 = /\} catch \(error\) \{\s*return false;\s*\}\s*<{5,} HEAD\s*\},\s*async loadAllProgress\(\) \{\s*try \{\s*const progressData = \{\};?\s*={5,}\s*\};?\s*>{5,} [a-f0-9]+/g;

if (mergePattern1.test(content)) {
    content = content.replace(
        mergePattern1,
        `} catch (error) {
                    return false;
                }
            },

            async loadAllProgress() {
                try {
                    const progressData = {};`
    );
    fixCount++;
    console.log('      ✅ 完了（パターン1）');
} else {
    // より柔軟なパターンで試す
    const flexPattern = /<{5,}.*?HEAD[\s\S]*?={5,}[\s\S]*?>{5,}.*?[a-f0-9]+/;
    if (flexPattern.test(content)) {
        // マージマーカーの範囲を特定
        const match = content.match(/<{5,}.*?HEAD([\s\S]*?)={5,}([\s\S]*?)>{5,}.*?[a-f0-9]+/);
        if (match) {
            // HEADの内容を採用
            content = content.replace(
                /<{5,}.*?HEAD([\s\S]*?)={5,}[\s\S]*?>{5,}.*?[a-f0-9]+/,
                '$1'
            );
            fixCount++;
            console.log('      ✅ 完了（パターン2）');
        }
    } else {
        console.log('      ℹ️  マージマーカーが見つかりません（既に修正済み？）');
    }
}

// 孤立したマーカーを削除
content = content.replace(/<{7,}.*\n/g, '');
content = content.replace(/={7,}.*\n/g, '');
content = content.replace(/>{7,}.*\n/g, '');

// ========================================
// 修正2: loadAllProgress()の重複削除
// ========================================
console.log('  2/3 loadAllProgress()の重複削除');

// loadAllProgress関数の出現回数をカウント
const matches = content.match(/async loadAllProgress\(\)\s*\{/g);
if (matches && matches.length > 1) {
    // 最初の出現位置を保存
    const firstIndex = content.indexOf('async loadAllProgress() {');
    
    // 2回目以降を削除
    let count = 0;
    const parts = content.split('async loadAllProgress() {');
    const filtered = parts.filter((part, index) => {
        if (index === 0) return true; // 最初の部分（前のコード）は保持
        count++;
        if (count === 1) return true; // 最初の関数定義は保持
        
        // 2回目以降は削除（次の関数定義まで削除）
        return false;
    });
    
    // 再結合
    let result = filtered[0]; // 最初の部分
    for (let i = 1; i < filtered.length; i++) {
        result += 'async loadAllProgress() {' + filtered[i];
    }
    
    content = result;
    fixCount++;
    console.log(`      ✅ 完了（${matches.length - 1}個の重複を削除）`);
} else {
    console.log('      ℹ️  重複なし');
}

// ========================================
// 修正3: loadProgress()の戻り値にcourseIdを追加
// ========================================
console.log('  3/3 loadProgress()の戻り値修正');

const loadProgressPattern = /(async loadProgress\(userId\) \{[\s\S]*?if \(response\.ok\) \{[\s\S]*?if \(hoursSince > 24\) \{[\s\S]*?return null;[\s\S]*?\})\s*(return progress;)/;

if (loadProgressPattern.test(content)) {
    content = content.replace(
        loadProgressPattern,
        `$1
                        // ✅ courseIdを追加
                        return {
                            ...progress,
                            courseId: progress.courseId || (AppData.courses.length > 0 ? AppData.courses[0].id : null)
                        };`
    );
    fixCount++;
    console.log('      ✅ 完了');
} else if (content.includes('courseId: progress.courseId ||')) {
    console.log('      ℹ️  既に修正済み');
} else {
    console.log('      ⚠️  パターンが見つかりません（手動確認が必要）');
}

console.log('');

// 空行の整理
content = content.replace(/\n{4,}/g, '\n\n\n');

// ファイル保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, content, 'utf-8');
const finalLength = content.length;

console.log('✅ 保存完了');
console.log('');

// 統計情報
console.log('====================================');
console.log('📊 修正結果');
console.log('====================================');
console.log(`適用された修正: ${fixCount} 箇所`);
console.log(`元のサイズ: ${originalLength} 文字`);
console.log(`最終サイズ: ${finalLength} 文字`);
console.log(`差分: ${originalLength - finalLength} 文字削除`);
console.log('====================================');
console.log('');

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
console.log('3. F12でコンソールを確認:');
console.log('   エラーがないことを確認');
console.log('');
console.log('4. テスト:');
console.log('   - user1/user1123 でログイン');
console.log('   - 研修を途中（例: スライド10）まで進める');
console.log('   - ログアウト');
console.log('   - 再度ログイン');
console.log('   - 「続きから再開」ボタンが表示され、クリックできることを確認');
console.log('   - スライド10から再開されることを確認');
console.log('');
console.log('問題がある場合のロールバック:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('====================================');
