// ========================================
// マージマーカー完全削除＆修正スクリプト
// fix_merge_conflict.js
// ========================================

const fs = require('fs');
const path = require('path');

console.log('🔧 マージマーカー完全削除スクリプト');
console.log('==================================');
console.log('');

const indexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ エラー: public/index.html が見つかりません');
    process.exit(1);
}

// バックアップ作成
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];
const backupPath = `${indexPath}.backup.merge_fix_${timestamp}`;

console.log('📦 バックアップ作成中...');
fs.copyFileSync(indexPath, backupPath);
console.log(`✅ バックアップ: ${path.basename(backupPath)}`);
console.log('');

// ファイル読み込み
console.log('📄 ファイル読み込み中...');
let content = fs.readFileSync(indexPath, 'utf-8');
const lines = content.split('\n');

console.log(`   総行数: ${lines.length}`);
console.log('');

// マージマーカーを検索
console.log('🔍 マージマーカーを検索中...');

const conflictMarkers = {
    start: /^<{7}(?:\s|$)/,      // <<<<<<< 
    middle: /^={7}(?:\s|$)/,     // =======
    end: /^>{7}(?:\s|$)/,        // >>>>>>>
    base: /^\|{7}(?:\s|$)/       // |||||||
};

let foundMarkers = [];
lines.forEach((line, index) => {
    if (conflictMarkers.start.test(line)) {
        foundMarkers.push({ line: index + 1, type: 'start', content: line });
    } else if (conflictMarkers.middle.test(line)) {
        foundMarkers.push({ line: index + 1, type: 'middle', content: line });
    } else if (conflictMarkers.end.test(line)) {
        foundMarkers.push({ line: index + 1, type: 'end', content: line });
    } else if (conflictMarkers.base.test(line)) {
        foundMarkers.push({ line: index + 1, type: 'base', content: line });
    } else if (line.includes('<<')) {
        foundMarkers.push({ line: index + 1, type: 'other', content: line });
    } else if (line.includes('>>')) {
        foundMarkers.push({ line: index + 1, type: 'other', content: line });
    }
});

if (foundMarkers.length > 0) {
    console.log(`⚠️  ${foundMarkers.length}個のマーカーが見つかりました:`);
    foundMarkers.forEach(marker => {
        console.log(`   行${marker.line} [${marker.type}]: ${marker.content.substring(0, 50)}...`);
    });
    console.log('');
} else {
    console.log('✅ マージマーカーは見つかりませんでした');
    console.log('');
    console.log('1010行目の内容:');
    if (lines[1009]) {
        console.log(`"${lines[1009]}"`);
    }
    console.log('');
    console.log('別の問題の可能性があります。');
    process.exit(0);
}

// マージマーカーを削除
console.log('🔨 マージマーカーを削除中...');

// 行ごとに処理
const cleanedLines = [];
let inConflict = false;
let useOurs = true; // HEAD側（現在のブランチ）を使用

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (conflictMarkers.start.test(line)) {
        // コンフリクト開始
        inConflict = true;
        useOurs = true;
        continue;
    } else if (conflictMarkers.middle.test(line)) {
        // コンフリクト中間（他のブランチのコード開始）
        useOurs = false;
        continue;
    } else if (conflictMarkers.end.test(line)) {
        // コンフリクト終了
        inConflict = false;
        continue;
    } else if (conflictMarkers.base.test(line)) {
        // ベースバージョン（無視）
        continue;
    }
    
    // コンフリクト中は HEAD側のコードのみ保持
    if (inConflict && !useOurs) {
        continue;
    }
    
    // 単独の << や >> を削除
    let cleanedLine = line;
    cleanedLine = cleanedLine.replace(/<<(?!<)/g, '');
    cleanedLine = cleanedLine.replace(/>>(?!>)/g, '');
    
    cleanedLines.push(cleanedLine);
}

const cleanedContent = cleanedLines.join('\n');

// ファイルに保存
console.log('💾 ファイル保存中...');
fs.writeFileSync(indexPath, cleanedContent, 'utf-8');

console.log('');
console.log('==================================');
console.log('✅ マージマーカーを削除しました！');
console.log('==================================');
console.log(`元の行数: ${lines.length}`);
console.log(`修正後行数: ${cleanedLines.length}`);
console.log(`削除された行: ${lines.length - cleanedLines.length}`);
console.log('');

// 修正後の1010行目付近を表示
console.log('修正後の1010行目付近:');
console.log('----------------------------------------');
for (let i = 1005; i <= 1015; i++) {
    if (i < cleanedLines.length) {
        console.log(`${i + 1}: ${cleanedLines[i]}`);
    }
}
console.log('----------------------------------------');
console.log('');

console.log('次のステップ:');
console.log('1. ブラウザを完全にリロード (Ctrl+Shift+R)');
console.log('2. F12でコンソールを確認');
console.log('3. エラーが消えていることを確認');
console.log('');
console.log('問題がある場合:');
console.log(`  copy "${path.basename(backupPath)}" "public\\index.html"`);
console.log('==================================');
