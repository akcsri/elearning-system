const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' })); // 制限を増やす
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static('public'));

// API エンドポイント

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全データ取得（既存のJSON形式互換）
app.get('/api/data', async (req, res) => {
    try {
        const data = await db.exportData();
        res.json(data);
    } catch (error) {
        console.error('データ取得エラー:', error);
        res.status(500).json({ error: 'データの読み込みに失敗しました' });
    }
});

// データ保存（全データ） - 無効化
app.post('/api/data', async (req, res) => {
    // このエンドポイントは使用しない
    // 学習記録は /api/learning-records で個別管理
    console.log('⚠️  /api/data への保存リクエストを無視しました');
    res.json({ 
        success: true, 
        message: 'このエンドポイントは無効化されています。学習記録は個別APIで管理されます。' 
    });
});

// 進捗取得
app.get('/api/progress/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const courseId = req.query.courseId ? parseInt(req.query.courseId) : null;
        
        if (courseId) {
            const progress = await db.getProgress(userId, courseId);
            if (progress) {
                // 期限切れチェック
                if (progress.expires_at && new Date(progress.expires_at) < new Date()) {
                    await db.deleteProgress(userId, courseId);
                    return res.status(404).json({ error: '進捗が期限切れです' });
                }
                
                // JSON形式をパース
                if (typeof progress.quiz_answers === 'string') {
                    progress.quiz_answers = JSON.parse(progress.quiz_answers);
                }
                
                res.json(progress);
            } else {
                res.status(404).json({ error: '進捗が見つかりません' });
            }
        } else {
            res.status(400).json({ error: 'courseIdが必要です' });
        }
    } catch (error) {
        console.error('進捗取得エラー:', error);
        res.status(500).json({ error: '進捗の取得に失敗しました' });
    }
});

// 進捗保存
app.post('/api/progress/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const progressData = req.body;
        
        await db.saveProgress(userId, progressData);
        res.json({ success: true, message: '進捗を保存しました' });
    } catch (error) {
        console.error('進捗保存エラー:', error);
        res.status(500).json({ success: false, error: '進捗の保存に失敗しました' });
    }
});

// 進捗削除
app.delete('/api/progress/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const courseId = req.query.courseId ? parseInt(req.query.courseId) : null;
        
        await db.deleteProgress(userId, courseId);
        res.json({ success: true, message: '進捗を削除しました' });
    } catch (error) {
        console.error('進捗削除エラー:', error);
        res.status(500).json({ success: false, error: '進捗の削除に失敗しました' });
    }
});

// データエクスポート
app.get('/api/export', async (req, res) => {
    try {
        const data = await db.exportData();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=elearning_backup_${new Date().toISOString().split('T')[0]}.json`);
        res.send(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('エクスポートエラー:', error);
        res.status(500).json({ error: 'データのエクスポートに失敗しました' });
    }
});

// データインポート
app.post('/api/import', async (req, res) => {
    try {
        await db.importData(req.body);
        res.json({ success: true, message: 'データをインポートしました' });
    } catch (error) {
        console.error('インポートエラー:', error);
        res.status(500).json({ success: false, error: 'データのインポートに失敗しました' });
    }
});

// データクリア
app.delete('/api/data', async (req, res) => {
    try {
        const initialData = {
            users: [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    name: '金子 明彦',
                    email: 'akihiko.kaneko@csri-japan.com',
                    role: 'admin',
                    department: 'オペレーションズ部'
                }
            ],
            courses: [],
            learningRecords: []
        };
        
        await db.importData(initialData);
        res.json({ success: true, message: 'データをクリアしました' });
    } catch (error) {
        console.error('データクリアエラー:', error);
        res.status(500).json({ success: false, error: 'データのクリアに失敗しました' });
    }
});

// ユーザー管理API

// 全ユーザー取得
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json(users);
    } catch (error) {
        console.error('ユーザー取得エラー:', error);
        res.status(500).json({ error: 'ユーザーの取得に失敗しました' });
    }
});

// ユーザー作成
app.post('/api/users', async (req, res) => {
    try {
        const user = await db.createUser(req.body);
        res.json({ success: true, user });
    } catch (error) {
        console.error('ユーザー作成エラー:', error);
        res.status(500).json({ success: false, error: 'ユーザーの作成に失敗しました' });
    }
});

// ユーザー更新
app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await db.updateUser(parseInt(req.params.id), req.body);
        res.json({ success: true, user });
    } catch (error) {
        console.error('ユーザー更新エラー:', error);
        res.status(500).json({ success: false, error: 'ユーザーの更新に失敗しました' });
    }
});

// ユーザー削除
app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.deleteUser(parseInt(req.params.id));
        res.json({ success: true, message: 'ユーザーを削除しました' });
    } catch (error) {
        console.error('ユーザー削除エラー:', error);
        res.status(500).json({ success: false, error: 'ユーザーの削除に失敗しました' });
    }
});

// コース管理API

// 全コース取得
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await db.getCourses();
        res.json(courses);
    } catch (error) {
        console.error('コース取得エラー:', error);
        res.status(500).json({ error: 'コースの取得に失敗しました' });
    }
});

// コース取得（ID）
app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await db.getCourseById(parseInt(req.params.id));
        if (course) {
            console.log('📖 コース取得:', {
                id: course.id,
                title: course.title,
                slideImagesCount: course.slideImages ? course.slideImages.length : 0,
                firstImageSize: course.slideImages && course.slideImages[0] ? 
                    course.slideImages[0].data?.substring(0, 50) : 'なし'
            });
            res.json(course);
        } else {
            res.status(404).json({ error: 'コースが見つかりません' });
        }
    } catch (error) {
        console.error('コース取得エラー:', error);
        res.status(500).json({ error: 'コースの取得に失敗しました' });
    }
});

// コース作成
app.post('/api/courses', async (req, res) => {
    try {
        console.log('📝 コース作成リクエスト:', {
            title: req.body.title,
            slideImagesCount: req.body.slideImages ? req.body.slideImages.length : 0,
            slidesCount: req.body.slides ? req.body.slides.length : 0,
            firstImagePreview: req.body.slideImages && req.body.slideImages[0] ? 
                req.body.slideImages[0].data?.substring(0, 50) + '...' : 'なし'
        });
        const course = await db.createCourse(req.body);
        console.log('✅ コース作成成功:', course.id);
        res.json({ success: true, course });
    } catch (error) {
        console.error('コース作成エラー:', error);
        res.status(500).json({ success: false, error: 'コースの作成に失敗しました', details: error.message });
    }
});

// コース更新
app.put('/api/courses/:id', async (req, res) => {
    try {
        const course = await db.updateCourse(parseInt(req.params.id), req.body);
        res.json({ success: true, course });
    } catch (error) {
        console.error('コース更新エラー:', error);
        res.status(500).json({ success: false, error: 'コースの更新に失敗しました' });
    }
});

// コース削除
app.delete('/api/courses/:id', async (req, res) => {
    try {
        await db.deleteCourse(parseInt(req.params.id));
        res.json({ success: true, message: 'コースを削除しました' });
    } catch (error) {
        console.error('コース削除エラー:', error);
        res.status(500).json({ success: false, error: 'コースの削除に失敗しました' });
    }
});

// 学習記録API

// 学習記録取得（全て）
app.get('/api/learning-records', async (req, res) => {
    try {
        const records = await db.getLearningRecords();
        res.json(records);
    } catch (error) {
        console.error('学習記録取得エラー:', error);
        res.status(500).json({ error: '学習記録の取得に失敗しました' });
    }
});

// 学習記録取得（ユーザーID）
app.get('/api/learning-records/user/:userId', async (req, res) => {
    try {
        const records = await db.getLearningRecordsByUserId(parseInt(req.params.userId));
        res.json(records);
    } catch (error) {
        console.error('学習記録取得エラー:', error);
        res.status(500).json({ error: '学習記録の取得に失敗しました' });
    }
});

// 学習記録作成
app.post('/api/learning-records', async (req, res) => {
    try {
        const record = await db.createLearningRecord(req.body);
        res.json({ success: true, record });
    } catch (error) {
        console.error('学習記録作成エラー:', error);
        res.status(500).json({ success: false, error: '学習記録の作成に失敗しました' });
    }
});

// ルートパス
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 定期的な期限切れ進捗のクリーンアップ（1時間ごと）
setInterval(async () => {
    try {
        const deleted = await db.cleanupExpiredProgress();
        if (deleted > 0) {
            console.log(`🧹 期限切れの進捗を ${deleted} 件削除しました`);
        }
    } catch (error) {
        console.error('期限切れ進捗の削除エラー:', error);
    }
}, 60 * 60 * 1000);

// ========================================
// 以下のコードをserver-postgres.jsに追加してください
// app.listen()の直前に追加するのが適切です
// ========================================

// データベース診断エンドポイント
app.get('/api/debug/database', async (req, res) => {
    try {
        const usersCount = await db.pool.query('SELECT COUNT(*) as count FROM users');
        const coursesCount = await db.pool.query('SELECT COUNT(*) as count FROM courses');
        const recordsCount = await db.pool.query('SELECT COUNT(*) as count FROM learning_records');
        const passedCount = await db.pool.query('SELECT COUNT(*) as count FROM learning_records WHERE passed = true');
        
        // 重複チェック
        const duplicates = await db.pool.query(`
            SELECT 
                user_id, 
                course_id, 
                COUNT(*) as count
            FROM learning_records
            GROUP BY user_id, course_id
            HAVING COUNT(*) > 1
        `);

        res.json({
            success: true,
            stats: {
                users: usersCount.rows[0].count,
                courses: coursesCount.rows[0].count,
                totalRecords: recordsCount.rows[0].count,
                passedRecords: passedCount.rows[0].count,
                duplicates: duplicates.rows.length
            },
            duplicateDetails: duplicates.rows
        });
    } catch (error) {
        console.error('診断エラー:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 重複データ削除エンドポイント
app.post('/api/debug/cleanup-duplicates', async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 重複を見つける
        const duplicates = await client.query(`
            SELECT 
                user_id, 
                course_id, 
                array_agg(id ORDER BY completed_at DESC) as record_ids
            FROM learning_records
            GROUP BY user_id, course_id
            HAVING COUNT(*) > 1
        `);

        let deletedCount = 0;
        const details = [];

        for (const dup of duplicates.rows) {
            const idsToKeep = [dup.record_ids[0]];
            const idsToDelete = dup.record_ids.slice(1);

            details.push({
                user_id: dup.user_id,
                course_id: dup.course_id,
                kept: idsToKeep[0],
                deleted: idsToDelete
            });

            await client.query(
                'DELETE FROM learning_records WHERE id = ANY($1)',
                [idsToDelete]
            );

            deletedCount += idsToDelete.length;
        }

        await client.query('COMMIT');
        
        // 最終状態を確認
        const finalCount = await client.query('SELECT COUNT(*) as count FROM learning_records');

        res.json({
            success: true,
            deletedCount,
            remainingRecords: finalCount.rows[0].count,
            details
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('クリーンアップエラー:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ========================================
// 緊急対応: データベースクリーンアップAPI
// ========================================

// 学習記録を完全削除（管理者用）
app.post('/api/debug/reset-learning-records', async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        console.log('🚨 学習記録の完全リセットを実行中...');
        
        await client.query('BEGIN');
        
        const beforeCount = await client.query('SELECT COUNT(*) as count FROM learning_records');
        console.log('  削除前の記録数:', beforeCount.rows[0].count);
        
        await client.query('TRUNCATE TABLE learning_records RESTART IDENTITY');
        
        await client.query('COMMIT');
        
        console.log('✅ 学習記録を完全削除しました');
        
        res.json({
            success: true,
            deletedCount: parseInt(beforeCount.rows[0].count),
            message: '学習記録を完全にリセットしました'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ リセットエラー:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ユーザーごとに最新の記録のみを保持
app.post('/api/debug/keep-latest-only', async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        console.log('🧹 ユーザーごとに最新の記録のみを保持...');
        
        await client.query('BEGIN');
        
        const beforeCount = await client.query('SELECT COUNT(*) as count FROM learning_records');
        console.log('  処理前の記録数:', beforeCount.rows[0].count);
        
        const latestRecords = await client.query(`
            SELECT DISTINCT ON (user_id, course_id) id
            FROM learning_records
            ORDER BY user_id, course_id, completed_at DESC
        `);
        
        const idsToKeep = latestRecords.rows.map(r => r.id);
        console.log('  保持するID:', idsToKeep);
        
        if (idsToKeep.length > 0) {
            await client.query(
                'DELETE FROM learning_records WHERE id NOT IN (' + 
                idsToKeep.map((_, i) => `$${i + 1}`).join(',') + ')',
                idsToKeep
            );
        } else {
            await client.query('TRUNCATE TABLE learning_records RESTART IDENTITY');
        }
        
        await client.query('COMMIT');
        
        const afterCount = await client.query('SELECT COUNT(*) as count FROM learning_records');
        const deletedCount = parseInt(beforeCount.rows[0].count) - parseInt(afterCount.rows[0].count);
        
        console.log('  処理後の記録数:', afterCount.rows[0].count);
        console.log('  削除した記録数:', deletedCount);
        
        res.json({
            success: true,
            before: parseInt(beforeCount.rows[0].count),
            after: parseInt(afterCount.rows[0].count),
            deleted: deletedCount,
            keptIds: idsToKeep
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ クリーンアップエラー:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// サーバー起動
async function startServer() {
    try {
        await db.initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`
🚀 eラーニングシステムが起動しました！
📡 サーバー: http://localhost:${PORT}
🗄️  データベース: PostgreSQL (${process.env.DATABASE_URL ? '接続済み' : 'ローカル'})
            `);
        });
    } catch (error) {
        console.error('❌ サーバー起動エラー:', error);
        process.exit(1);
    }
}

startServer();
