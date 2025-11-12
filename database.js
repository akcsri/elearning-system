const { Pool } = require('pg');

// PostgreSQL接続設定
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
        rejectUnauthorized: false
    }
});

// データベーステーブルの作成
async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('📊 データベースを初期化しています...');
        
        // テーブル作成
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                department VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                slides JSONB,
                quiz JSONB,
                passing_score INTEGER DEFAULT 70,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS learning_records (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                passed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                answers JSONB,
                time_spent INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER,
                current_slide INTEGER DEFAULT 0,
                quiz_started BOOLEAN DEFAULT FALSE,
                quiz_answers JSONB,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, course_id)
            );
        `);

        // デフォルトユーザーを確認・作成
        const userCheck = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCheck.rows[0].count) === 0) {
            console.log('デフォルトユーザーを作成しています...');
            const defaultUsers = [
                { username: 'admin', password: 'admin123', name: '管理者', email: 'admin@example.com', role: 'admin', department: 'オペレーションズ部' },
                { username: 'user1', password: 'user1123', name: '前田 拓', email: 'taku.maeda@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user2', password: 'user2123', name: '藤森 義明', email: 'yoshiaki.fujimori@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user3', password: 'user3123', name: '村上 昌克', email: 'masakatsu.murakami@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user4', password: 'user4123', name: '横山 健一', email: 'kenichi.yokoyama@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user5', password: 'user5123', name: '大塚 弘樹', email: 'hiroki.otsuka@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user6', password: 'user6123', name: '脇野 尚志', email: 'hisashi.wakino@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user7', password: 'user7123', name: '松林 明', email: 'akira.matsubayashi@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user8', password: 'user8123', name: '上野 祐一郎', email: 'yuichiro.ueno@csri-japan.com', role: 'user', department: 'インベストメント部' },
                { username: 'user9', password: 'user9123', name: '金子 明彦', email: 'akihiko.kaneko2@csri-japan.com', role: 'user', department: 'オペレーションズ部' },
                { username: 'user10', password: 'user10123', name: '川端 真至', email: 'shinji.kawahata@csri-japan.com', role: 'user', department: 'オペレーションズ部' }
            ];

            for (const user of defaultUsers) {
                await client.query(
                    'INSERT INTO users (username, password, name, email, role, department) VALUES ($1, $2, $3, $4, $5, $6)',
                    [user.username, user.password, user.name, user.email, user.role, user.department]
                );
            }
            
            console.log('✅ デフォルトユーザーを作成しました');
        }

        console.log('✅ データベースの初期化が完了しました');
        
    } catch (error) {
        console.error('❌ データベース初期化エラー:', error);
        throw error;
    } finally {
        client.release();
    }
}

// データベース操作関数

// 全ユーザー取得
async function getUsers() {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    return result.rows;
}

// ユーザー取得（ID）
async function getUserById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
}

// ユーザー取得（ユーザー名）
async function getUserByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
}

// ユーザー作成
async function createUser(userData) {
    const { username, password, name, email, role = 'user', department } = userData;
    const result = await pool.query(
        'INSERT INTO users (username, password, name, email, role, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [username, password, name, email, role, department]
    );
    return result.rows[0];
}

// ユーザー更新
async function updateUser(id, userData) {
    const { username, password, name, email, role, department } = userData;
    const result = await pool.query(
        'UPDATE users SET username = $1, password = $2, name = $3, email = $4, role = $5, department = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
        [username, password, name, email, role, department, id]
    );
    return result.rows[0];
}

// ユーザー削除
async function deleteUser(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
}

// 全コース取得
async function getCourses() {
    const result = await pool.query('SELECT * FROM courses ORDER BY id');
    // slidesをslideImagesにマッピング
    return result.rows.map(course => ({
        ...course,
        slideImages: course.slides || []
    }));
}

// コース取得（ID）
async function getCourseById(id) {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (result.rows[0]) {
        // slidesをslideImagesにマッピング
        return {
            ...result.rows[0],
            slideImages: result.rows[0].slides || []
        };
    }
    return null;
}

// コース作成
async function createCourse(courseData) {
    const { title, description, slideImages, slides, quiz = [], passing_score = 70 } = courseData;
    // slideImagesまたはslidesのどちらかを使用
    const slidesData = slideImages || slides || [];
    const result = await pool.query(
        'INSERT INTO courses (title, description, slides, quiz, passing_score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, description, JSON.stringify(slidesData), JSON.stringify(quiz), passing_score]
    );
    // 返す際はslideImagesフィールドも含める
    return {
        ...result.rows[0],
        slideImages: result.rows[0].slides || []
    };
}

// コース更新
async function updateCourse(id, courseData) {
    const { title, description, slideImages, slides, quiz, passing_score } = courseData;
    // slideImagesまたはslidesのどちらかを使用
    const slidesData = slideImages || slides || [];
    const result = await pool.query(
        'UPDATE courses SET title = $1, description = $2, slides = $3, quiz = $4, passing_score = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [title, description, JSON.stringify(slidesData), JSON.stringify(quiz), passing_score, id]
    );
    // 返す際はslideImagesフィールドも含める
    return {
        ...result.rows[0],
        slideImages: result.rows[0].slides || []
    };
}

// コース削除
async function deleteCourse(id) {
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    return true;
}

// 🔧 修正: 学習記録取得（全て） - JOINでユーザーとコース情報を含める
async function getLearningRecords() {
    const result = await pool.query(`
        SELECT 
            lr.id,
            lr.user_id as "userId",
            lr.course_id as "courseId",
            lr.score,
            lr.passed,
            lr.completed_at as "completedAt",
            lr.answers,
            lr.time_spent as "timeSpent",
            u.name as "userName",
            u.department as "userDept",
            c.title as "courseTitle",
            CASE 
                WHEN lr.passed = true THEN 'completed'
                ELSE 'failed'
            END as status,
            lr.score as "correctCount",
            CASE 
                WHEN c.quiz IS NOT NULL THEN jsonb_array_length(c.quiz)
                ELSE 10
            END as "totalQuestions",
            lr.completed_at as "completedDate"
        FROM learning_records lr
        LEFT JOIN users u ON lr.user_id = u.id
        LEFT JOIN courses c ON lr.course_id = c.id
        ORDER BY lr.completed_at DESC
    `);
    return result.rows;
}

// 🔧 修正: 学習記録取得（ユーザーID） - JOINでユーザーとコース情報を含める
async function getLearningRecordsByUserId(userId) {
    const result = await pool.query(`
        SELECT 
            lr.id,
            lr.user_id as "userId",
            lr.course_id as "courseId",
            lr.score,
            lr.passed,
            lr.completed_at as "completedAt",
            lr.answers,
            lr.time_spent as "timeSpent",
            u.name as "userName",
            u.department as "userDept",
            c.title as "courseTitle",
            CASE 
                WHEN lr.passed = true THEN 'completed'
                ELSE 'failed'
            END as status,
            lr.score as "correctCount",
            CASE 
                WHEN c.quiz IS NOT NULL THEN jsonb_array_length(c.quiz)
                ELSE 10
            END as "totalQuestions",
            lr.completed_at as "completedDate"
        FROM learning_records lr
        LEFT JOIN users u ON lr.user_id = u.id
        LEFT JOIN courses c ON lr.course_id = c.id
        WHERE lr.user_id = $1
        ORDER BY lr.completed_at DESC
    `, [userId]);
    return result.rows;
}

// 学習記録作成
async function createLearningRecord(recordData) {
    const { user_id, course_id, score, passed, answers = [], time_spent = 0 } = recordData;
    const result = await pool.query(
        'INSERT INTO learning_records (user_id, course_id, score, passed, answers, time_spent) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user_id, course_id, score, passed, JSON.stringify(answers), time_spent]
    );
    return result.rows[0];
}

// 進捗取得
async function getProgress(userId, courseId) {
    const result = await pool.query(
        'SELECT * FROM progress WHERE user_id = $1 AND course_id = $2',
        [userId, courseId]
    );
    return result.rows[0];
}

// 進捗保存
async function saveProgress(userId, progressData) {
    const { course_id, current_slide, quiz_started, quiz_answers, expires_at } = progressData;
    
    const result = await pool.query(
        `INSERT INTO progress (user_id, course_id, current_slide, quiz_started, quiz_answers, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, course_id)
         DO UPDATE SET 
            current_slide = $3,
            quiz_started = $4,
            quiz_answers = $5,
            expires_at = $6,
            updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, course_id, current_slide, quiz_started, JSON.stringify(quiz_answers || []), expires_at]
    );
    
    return result.rows[0];
}

// 進捗削除
async function deleteProgress(userId, courseId = null) {
    if (courseId) {
        await pool.query('DELETE FROM progress WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
    } else {
        await pool.query('DELETE FROM progress WHERE user_id = $1', [userId]);
    }
    return true;
}

// 期限切れの進捗を削除
async function cleanupExpiredProgress() {
    const result = await pool.query('DELETE FROM progress WHERE expires_at < CURRENT_TIMESTAMP');
    return result.rowCount;
}

// データエクスポート（既存のJSON形式互換）
async function exportData() {
    const users = await getUsers();
    const courses = await getCourses();
    const learningRecords = await getLearningRecords();
    
    return {
        users,
        courses,
        learningRecords,
        lastUpdated: new Date().toISOString()
    };
}

// データインポート（既存のJSON形式互換）
async function importData(data) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 既存データをクリア
        await client.query('TRUNCATE users, courses, learning_records, progress RESTART IDENTITY CASCADE');
        
        // ユーザーをインポート
        if (data.users && data.users.length > 0) {
            for (const user of data.users) {
                await client.query(
                    'INSERT INTO users (username, password, name, email, role, department) VALUES ($1, $2, $3, $4, $5, $6)',
                    [user.username, user.password, user.name, user.email, user.role || 'user', user.department]
                );
            }
        }
        
        // コースをインポート
        if (data.courses && data.courses.length > 0) {
            for (const course of data.courses) {
                await client.query(
                    'INSERT INTO courses (title, description, slides, quiz, passing_score) VALUES ($1, $2, $3, $4, $5)',
                    [course.title, course.description, JSON.stringify(course.slides || []), JSON.stringify(course.quiz || []), course.passing_score || 70]
                );
            }
        }
        
        // 学習記録をインポート
        if (data.learningRecords && data.learningRecords.length > 0) {
            for (const record of data.learningRecords) {
                await client.query(
                    'INSERT INTO learning_records (user_id, course_id, score, passed, answers, time_spent, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [record.userId || record.user_id, record.courseId || record.course_id, record.score, record.passed, JSON.stringify(record.answers || []), record.timeSpent || record.time_spent || 0, record.completedAt || record.completed_at || new Date()]
                );
            }
        }
        
        await client.query('COMMIT');
        return true;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('インポートエラー:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    initializeDatabase,
    getUsers,
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser,
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getLearningRecords,
    getLearningRecordsByUserId,
    createLearningRecord,
    getProgress,
    saveProgress,
    deleteProgress,
    cleanupExpiredProgress,
    exportData,
    importData
};
