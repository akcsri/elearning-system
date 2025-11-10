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

// データ保存（既存のJSON形式互換）
app.post('/api/data', async (req, res) => {
    try {
        const data = req.body;
        
        // ユーザーの更新
        if (data.users) {
            for (const user of data.users) {
                if (user.id) {
                    const existing = await db.getUserById(user.id);
                    if (existing) {
                        await db.updateUser(user.id, user);
                    } else {
                        await db.createUser(user);
                    }
                } else {
                    await db.createUser(user);
                }
            }
        }
        
        // コースの更新
        if (data.courses) {
            for (const course of data.courses) {
                if (course.id) {
                    const existing = await db.getCourseById(course.id);
                    if (existing) {
                        await db.updateCourse(course.id, course);
                    } else {
                        await db.createCourse(course);
                    }
                } else {
                    await db.createCourse(course);
                }
            }
        }
        
        // 学習記録の保存
        if (data.learningRecords) {
            for (const record of data.learningRecords) {
                await db.createLearningRecord({
                    user_id: record.userId || record.user_id,
                    course_id: record.courseId || record.course_id,
                    score: record.score,
                    passed: record.passed,
                    answers: record.answers || [],
                    time_spent: record.timeSpent || record.time_spent || 0
                });
            }
        }
        
        res.json({ success: true, message: 'データを保存しました' });
    } catch (error) {
        console.error('データ保存エラー:', error);
        res.status(500).json({ success: false, error: 'データの保存に失敗しました' });
    }
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
