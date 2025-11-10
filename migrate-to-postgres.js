const fs = require('fs').promises;
const path = require('path');
const db = require('./database');

async function migrate() {
    console.log('🔄 データ移行を開始します...');
    
    try {
        // 既存のJSONファイルを読み込み
        const dataFile = path.join(__dirname, 'data', 'database.json');
        
        try {
            const jsonData = await fs.readFile(dataFile, 'utf-8');
            const data = JSON.parse(jsonData);
            
            console.log('📂 既存のJSONデータを読み込みました');
            console.log(`  - ユーザー: ${data.users?.length || 0} 件`);
            console.log(`  - コース: ${data.courses?.length || 0} 件`);
            console.log(`  - 学習記録: ${data.learningRecords?.length || 0} 件`);
            
            // データベースにインポート
            await db.importData(data);
            
            console.log('✅ PostgreSQLへの移行が完了しました！');
            
            // 進捗データの移行
            const progressDir = path.join(__dirname, 'data', 'progress');
            try {
                const files = await fs.readdir(progressDir);
                console.log(`\n📂 進捗データを移行します (${files.length} ファイル)...`);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const userId = parseInt(file.replace('.json', ''));
                        const progressData = JSON.parse(await fs.readFile(path.join(progressDir, file), 'utf-8'));
                        
                        await db.saveProgress(userId, progressData);
                        console.log(`  ✓ ユーザーID ${userId} の進捗を移行`);
                    }
                }
                
                console.log('✅ 進捗データの移行が完了しました！');
            } catch (error) {
                console.log('ℹ️  進捗データが見つかりませんでした（スキップ）');
            }
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('ℹ️  既存のJSONデータが見つかりません');
                console.log('ℹ️  デフォルトデータで初期化されています');
            } else {
                throw error;
            }
        }
        
        // 移行後のデータを確認
        console.log('\n📊 移行後のデータ:');
        const users = await db.getUsers();
        const courses = await db.getCourses();
        const records = await db.getLearningRecords();
        
        console.log(`  - ユーザー: ${users.length} 件`);
        console.log(`  - コース: ${courses.length} 件`);
        console.log(`  - 学習記録: ${records.length} 件`);
        
        console.log('\n✨ 移行が正常に完了しました！');
        console.log('💡 サーバーを起動してください: npm start');
        
    } catch (error) {
        console.error('❌ 移行エラー:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

migrate();
