// ========================================
// index.html 自動修正スクリプト (Windows対応)
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 index.html 自動修正スクリプト');
console.log('==================================');
console.log('');

// ファイルパス
const indexPath = path.join(__dirname, 'public', 'index.html');

// ファイルの存在確認
if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    console.error('   このスクリプトをプロジェクトルートで実行してください');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ作成完了: ${path.basename(backupPath)}`);
console.log('');

// ファイルを読み込む
console.log('🔨 ファイル修正中...');
let content = fs.readFileSync(indexPath, 'utf-8');

// 元の行数
const originalLines = content.split('\n').length;

// 修正パターン1: localStorage.setItem から const AppData まで削除
// より確実なパターンマッチング
const pattern1 = /\};[\s\n]+localStorage\.setItem\(this\.STORAGE_KEY.*?(?=\s*const AppData = \{)/s;

// 修正実行
let contentFixed = content.replace(pattern1, '};');

// 修正後の行数
const fixedLines = contentFixed.split('\n').length;
const removedLines = originalLines - fixedLines;

// ファイルに書き戻す
fs.writeFileSync(indexPath, contentFixed, 'utf-8');

console.log('✅ 修正完了');
console.log(`   元の行数: ${originalLines}`);
console.log(`   修正後行数: ${fixedLines}`);
console.log(`   削除行数: ${removedLines}`);
console.log('');

if (removedLines > 0) {
    console.log(`🎉 ${removedLines}行の重複コードを削除しました！`);
} else {
    console.log('⚠️  削除すべきコードが見つかりませんでした');
    console.log('   すでに修正済みか、ファイル構造が異なる可能性があります');
}

console.log('');
console.log('==================================');
console.log('✅ 修正が完了しました！');
console.log('');
console.log('次のステップ:');
console.log('1. ブラウザでページをリロード (Ctrl+Shift+R)');
console.log('2. ブラウザのコンソールでエラーが出ないか確認');
console.log('3. ログイン機能をテスト');
console.log('');
console.log('問題がある場合:');
console.log(`  バックアップから復元: copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('==================================');
