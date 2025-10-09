const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// データファイルのパス
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');
const PROGRESS_DIR = path.join(DATA_DIR, 'progress');

// ミドルウェア
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// データディレクトリの初期化
async function initializeDataDirectory() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(PROGRESS_DIR, { recursive: true });
        
        // データファイルが存在しない場合は初期化
        try {
            await fs.access(DATA_FILE);
        } catch {
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
                    },
                    {
                        id: 2,
                        username: 'user1',
                        password: 'user1123',
                        name: '前田 拓',
                        email: 'taku.maeda@csri-japan.com',
                        role: 'user',
                        department: 'インベストメント部'
                    },
                    {
                        id: 3,
                        username: 'user2',
                        password: 'user2123',
                        name: '藤森 義明',
                        email: 'yoshiaki.fujimori@csri-japan.com',
                        role: 'user',
                        department: 'インベストメント部'
                    }
                ],
                courses: [],
                learningRecords: [],
                lastUpdated: new Date().toISOString()
            };
            await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
            console.log('✅ 初期データを作成しました');
        }
    } catch (error) {
        console.error('❌ データディレクトリの初期化エラー:', error);
    }
}

// データ読み込み
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        return null;
    }
}

// データ保存
async function saveData(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('データ保存エラー:', error);
        return false;
    }
}

// 進捗データの読み込み
async function loadProgress(userId) {
    try {
        const progressFile = path.join(PROGRESS_DIR, `${userId}.json`);
        const data = await fs.readFile(progressFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// 進捗データの保存
async function saveProgress(userId, progressData) {
    try {
        const progressFile = path.join(PROGRESS_DIR, `${userId}.json`);
        progressData.lastUpdated = new Date().toISOString();
        await fs.writeFile(progressFile, JSON.stringify(progressData, null, 2));
        return true;
    } catch (error) {
        console.error('進捗保存エラー:', error);
        return false;
    }
}

// 進捗データの削除
async function deleteProgress(userId) {
    try {
        const progressFile = path.join(PROGRESS_DIR, `${userId}.json`);
        await fs.unlink(progressFile);
        return true;
    } catch (error) {
        return false;
    }
}

// API エンドポイント

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全データ取得
app.get('/api/data', async (req, res) => {
    const data = await loadData();
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'データの読み込みに失敗しました' });
    }
});

// データ保存
app.post('/api/data', async (req, res) => {
    const success = await saveData(req.body);
    if (success) {
        res.json({ success: true, message: 'データを保存しました' });
    } else {
        res.status(500).json({ success: false, error: 'データの保存に失敗しました' });
    }
});

// 進捗取得
app.get('/api/progress/:userId', async (req, res) => {
    const progress = await loadProgress(req.params.userId);
    if (progress) {
        res.json(progress);
    } else {
        res.status(404).json({ error: '進捗が見つかりません' });
    }
});

// 進捗保存
app.post('/api/progress/:userId', async (req, res) => {
    const success = await saveProgress(req.params.userId, req.body);
    if (success) {
        res.json({ success: true, message: '進捗を保存しました' });
    } else {
        res.status(500).json({ success: false, error: '進捗の保存に失敗しました' });
    }
});

// 進捗削除
app.delete('/api/progress/:userId', async (req, res) => {
    const success = await deleteProgress(req.params.userId);
    if (success) {
        res.json({ success: true, message: '進捗を削除しました' });
    } else {
        res.status(404).json({ success: false, error: '進捗が見つかりません' });
    }
});

// データエクスポート
app.get('/api/export', async (req, res) => {
    const data = await loadData();
    if (data) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=elearning_backup_${new Date().toISOString().split('T')[0]}.json`);
        res.send(JSON.stringify(data, null, 2));
    } else {
        res.status(500).json({ error: 'データのエクスポートに失敗しました' });
    }
});

// データインポート
app.post('/api/import', async (req, res) => {
    const success = await saveData(req.body);
    if (success) {
        res.json({ success: true, message: 'データをインポートしました' });
    } else {
        res.status(500).json({ success: false, error: 'データのインポートに失敗しました' });
    }
});

// データクリア
app.delete('/api/data', async (req, res) => {
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
        learningRecords: [],
        lastUpdated: new Date().toISOString()
    };
    
    const success = await saveData(initialData);
    if (success) {
        // 全ての進捗ファイルも削除
        try {
            const files = await fs.readdir(PROGRESS_DIR);
            for (const file of files) {
                await fs.unlink(path.join(PROGRESS_DIR, file));
            }
        } catch (error) {
            console.error('進捗削除エラー:', error);
        }
        
        res.json({ success: true, message: 'データをクリアしました' });
    } else {
        res.status(500).json({ success: false, error: 'データのクリアに失敗しました' });
    }
});

// ルートパス
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
async function startServer() {
    await initializeDataDirectory();
    
    app.listen(PORT, () => {
        console.log(`
🚀 eラーニングシステムが起動しました！
📡 サーバー: http://localhost:${PORT}
💾 データ保存先: ${DATA_DIR}
        `);
    });
}

startServer();
