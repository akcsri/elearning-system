// ========================================
// 1010行目の構文エラー修正スクリプト
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔍 1010行目の構文エラーを修正します');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.fix1010_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
const content = fs.readFileSync(indexPath, 'utf-8');
const lines = content.split('\n');

console.log(`   総行数: ${lines.length}`);
console.log('');

// 1010行目付近を表示
console.log('🔍 1010行目付近の内容:');
console.log('----------------------------------------');
for (let i = 1005; i <= 1015; i++) {
    if (i < lines.length) {
        const lineContent = lines[i];
        const hasError = lineContent.includes('<<') || lineContent.includes('>>');
        const marker = i === 1009 ? ' ← 1010行目（配列は0始まり）' : '';
        const errorMarker = hasError ? ' ⚠️  不正な文字' : '';
        console.log(`${i + 1}: ${lineContent}${marker}${errorMarker}`);
    }
}
console.log('----------------------------------------');
console.log('');

// 不正な文字を検索
console.log('🔨 不正な文字を検索中...');
let fixCount = 0;
const problematicPatterns = [
    { pattern: /<<<+/g, name: '<<< マーカー' },
    { pattern: />>>+/g, name: '>>> マーカー' },
    { pattern: /={7,}/g, name: '======= マーカー' },
    { pattern: /\|\|\|\|\|\|\|/g, name: '||||||| マーカー' }
];

problematicPatterns.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches) {
        console.log(`   ⚠️  ${name} が ${matches.length}箇所見つかりました`);
        fixCount += matches.length;
    }
});

if (fixCount === 0) {
    console.log('   ℹ️  マージマーカーは見つかりませんでした');
    console.log('');
    console.log('🔍 1010行目の詳細を確認してください:');
    if (lines[1009]) {
        console.log(`"${lines[1009]}"`);
    }
    console.log('');
    console.log('手動で修正が必要な可能性があります。');
    process.exit(0);
}

console.log('');
console.log('🔨 マージマーカーを削除中...');

// マージマーカーを削除
let fixedContent = content;

// Git conflict markers を削除
fixedContent = fixedContent.replace(/<<<<<<< .*\n/g, '');
fixedContent = fixedContent.replace(/=======\n/g, '');
fixedContent = fixedContent.replace(/>>>>>>> .*\n/g, '');
fixedContent = fixedContent.replace(/\|\|\|\|\|\|\| .*\n/g, '');

// 不正な << や >> を削除（単独の場合）
fixedContent = fixedContent.replace(/<<(?!<)/g, '');
fixedContent = fixedContent.replace(/>>(?!>)/g, '');

// ファイルに保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, fixedContent, 'utf-8');

const fixedLines = fixedContent.split('\n');

console.log('');
console.log('==================================');
console.log('✅ 修正が完了しました！');
console.log('==================================');
console.log(`元の行数: ${lines.length}`);
console.log(`修正後行数: ${fixedLines.length}`);
console.log(`削除された行: ${lines.length - fixedLines.length}`);
console.log('');
console.log('修正後の1010行目付近:');
console.log('----------------------------------------');
for (let i = 1005; i <= 1015; i++) {
    if (i < fixedLines.length) {
        console.log(`${i + 1}: ${fixedLines[i]}`);
    }
}
console.log('----------------------------------------');
console.log('');
console.log('次のステップ:');
console.log('1. ブラウザをリロード (Ctrl+Shift+R)');
console.log('2. F12でコンソールを確認');
console.log('3. エラーが消えていることを確認');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('==================================');
