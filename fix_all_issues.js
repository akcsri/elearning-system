require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function fixAllIssues() {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║  🔧 eラーニングシステム 統合修復ツール  ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');

    const client = await pool.connect();

    try {
        // ========== ステップ1: データベース診断 ==========
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 ステップ1: データベース診断');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
        const coursesCount = await client.query('SELECT COUNT(*) as count FROM courses');
        const recordsCount = await client.query('SELECT COUNT(*) as count FROM learning_records');
        const passedCount = await client.query('SELECT COUNT(*) as count FROM learning_records WHERE passed = true');

        console.log(`ユーザー数: ${usersCount.rows[0].count}`);
        console.log(`コース数: ${coursesCount.rows[0].count}`);
        console.log(`学習記録数: ${recordsCount.rows[0].count}`);
        console.log(`修了者数: ${passedCount.rows[0].count}`);

        // 重複チェック
        const duplicates = await client.query(`
            SELECT 
                user_id, 
                course_id, 
                COUNT(*) as count
            FROM learning_records
            GROUP BY user_id, course_id
            HAVING COUNT(*) > 1
        `);

        if (duplicates.rows.length > 0) {
            console.log(`\n⚠️  重複データ: ${duplicates.rows.length}組`);
        } else {
            console.log('\n✅ 重複なし');
        }

        // ========== ステップ2: 重複データのクリーンアップ ==========
        if (duplicates.rows.length > 0) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🧹 ステップ2: 重複データのクリーンアップ');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            await client.query('BEGIN');

            const duplicateDetails = await client.query(`
                SELECT 
                    user_id, 
                    course_id, 
                    array_agg(id ORDER BY completed_at DESC) as record_ids
                FROM learning_records
                GROUP BY user_id, course_id
                HAVING COUNT(*) > 1
            `);

            let deletedCount = 0;

            for (const dup of duplicateDetails.rows) {
                const idsToKeep = [dup.record_ids[0]];
                const idsToDelete = dup.record_ids.slice(1);

                console.log(`ユーザーID: ${dup.user_id}, コースID: ${dup.course_id}`);
                console.log(`  保持: ID ${idsToKeep[0]}`);
                console.log(`  削除: ${idsToDelete.length}件\n`);

                await client.query(
                    'DELETE FROM learning_records WHERE id = ANY($1)',
                    [idsToDelete]
                );

                deletedCount += idsToDelete.length;
            }

            await client.query('COMMIT');
            console.log(`✅ ${deletedCount}件の重複を削除しました\n`);
        } else {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ ステップ2: スキップ（重複なし）');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        // ========== ステップ3: フロントエンドコード修正 ==========
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔧 ステップ3: フロントエンドコード修正');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const indexPath = path.join(__dirname, 'public', 'index.html');
        let content = fs.readFileSync(indexPath, 'utf-8');
        let modified = false;

        // バックアップ作成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const backupPath = path.join(__dirname, 'public', `index.html.backup.${timestamp}`);
        fs.copyFileSync(indexPath, backupPath);
        console.log(`📦 バックアップ作成: ${path.basename(backupPath)}\n`);

        // 修正1: ダッシュボードの修了数計算
        const dashboardOld = `const completedRecords = AppData.learningRecords.filter(r => r.status === 'completed' && r.passed).length;`;
        const dashboardNew = `const completedRecords = AppData.learningRecords.filter(r => r.passed).length;`;

        if (content.includes(dashboardOld)) {
            content = content.replace(dashboardOld, dashboardNew);
            console.log('✅ 修正1: ダッシュボードの修了数計算');
            modified = true;
        } else {
            console.log('ℹ️  修正1: 既に適用済み');
        }

        // 修正2: フィールド名マッピング
        const loadRecordsOld = `                    // 学習記録取得
                    const recordsRes = await fetch(\`\${this.API_BASE}/learning-records\`);
                    if (recordsRes.ok) {
                        AppData.learningRecords = await recordsRes.json();
                        console.log('✅ 学習記録をロード:', AppData.learningRecords.length + '件');
                    } else {
                        AppData.learningRecords = [];
                    }`;

        const loadRecordsNew = `                    // 学習記録取得
                    const recordsRes = await fetch(\`\${this.API_BASE}/learning-records\`);
                    if (recordsRes.ok) {
                        const records = await recordsRes.json();
                        // データベースのフィールド名(snake_case)をフロントエンド用(camelCase)に変換
                        AppData.learningRecords = records.map(r => ({
                            ...r,
                            userId: r.user_id || r.userId,
                            courseId: r.course_id || r.courseId,
                            completedAt: r.completed_at || r.completedAt,
                            timeSpent: r.time_spent || r.timeSpent,
                            status: r.passed ? 'completed' : 'failed'
                        }));
                        console.log('✅ 学習記録をロード:', AppData.learningRecords.length + '件');
                    } else {
                        AppData.learningRecords = [];
                    }`;

        if (content.includes(loadRecordsOld)) {
            content = content.replace(loadRecordsOld, loadRecordsNew);
            console.log('✅ 修正2: フィールド名マッピング処理を追加');
            modified = true;
        } else if (content.includes('userId: r.user_id || r.userId')) {
            console.log('ℹ️  修正2: 既に適用済み');
        }

        if (modified) {
            fs.writeFileSync(indexPath, content, 'utf-8');
            console.log('\n💾 フロントエンドコードを保存しました\n');
        } else {
            console.log('\nℹ️  フロントエンドコードは修正不要です\n');
        }

        // ========== ステップ4: 最終確認 ==========
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 ステップ4: 修正後の状態確認');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const finalRecords = await client.query('SELECT COUNT(*) as count FROM learning_records');
        const finalPassed = await client.query('SELECT COUNT(*) as count FROM learning_records WHERE passed = true');

        console.log(`学習記録数: ${finalRecords.rows[0].count}`);
        console.log(`修了者数: ${finalPassed.rows[0].count}`);

        // ========== 完了 ==========
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ すべての修正が完了しました！');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('次のステップ:');
        console.log('');
        console.log('1. サーバーを再起動:');
        console.log('   Ctrl+C でサーバーを停止');
        console.log('   npm start で再起動');
        console.log('');
        console.log('2. ブラウザを完全リロード:');
        console.log('   Ctrl+Shift+R を押す');
        console.log('');
        console.log('3. 管理画面で確認:');
        console.log('   - 管理者でログイン (admin / admin123)');
        console.log('   - ダッシュボードで数値を確認');
        console.log('   - 受講者管理で受講実績を確認');
        console.log('');
        console.log('問題がある場合、バックアップから復元:');
        console.log(`   cp public/${path.basename(backupPath)} public/index.html`);
        console.log('');

    } catch (error) {
        console.error('\n❌ エラーが発生しました:', error);
        if (client) {
            await client.query('ROLLBACK');
        }
    } finally {
        client.release();
        await pool.end();
    }
}

// 環境変数チェック
if (!process.env.DATABASE_URL) {
    console.error('');
    console.error('❌ エラー: DATABASE_URL 環境変数が設定されていません');
    console.error('');
    console.error('.env ファイルを作成して以下を設定してください:');
    console.error('DATABASE_URL=postgresql://your-database-url');
    console.error('');
    process.exit(1);
}

fixAllIssues();
