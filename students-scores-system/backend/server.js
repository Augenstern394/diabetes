const express = require('express');
const mysql = require('mysql2/promise'); // 使用promise版本
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('成功连接到MySQL数据库');
    connection.release();
  } catch (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
}

// 提供学生成绩数据
app.get('/api/scores', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        student_name, 
        Chinese_score,
        Math_score,
        English_score,
        average_score       
      FROM student_scores
      ORDER BY average_score DESC
    `);
    
    // 计算统计数据
    const stats = {
      totalStudents: rows.length,
      chineseAvg: calculateAverage(rows.map(r => r.Chinese_score)),
      mathAvg: calculateAverage(rows.map(r => r.Math_score)),
      englishAvg: calculateAverage(rows.map(r => r.English_score)),
      overallAvg: calculateAverage(rows.map(r => r.average_score)),
      topStudent: rows[0] || null
    };
    
    res.json({ success: true, data: rows, stats });
  } catch (err) {
    console.error('获取数据失败:', err);
    res.status(500).json({ success: false, message: '获取数据失败' });
  }
});

// 添加新学生成绩
app.post('/api/scores', async (req, res) => {
  const { student_name, Chinese_score, Math_score, English_score } = req.body;
  
  if (!student_name || !Chinese_score || !Math_score || !English_score) {
    return res.status(400).json({ success: false, message: '缺少必要字段' });
  }
  
  const average_score = (Number(Chinese_score) + Number(Math_score) + Number(English_score)) / 3;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO student_scores (student_name, Chinese_score, Math_score, English_score, average_score) VALUES (?, ?, ?, ?, ?)',
      [student_name, Chinese_score, Math_score, English_score, average_score]
    );
    
    // 更新排名
    await updateClassRanks();
    
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('添加数据失败:', err);
    res.status(500).json({ success: false, message: '添加数据失败' });
  }
});

// 更新班级排名
async function updateClassRanks() {
  try {
    // 获取按平均分排序的学生列表
    const [students] = await pool.query(
      'SELECT student_id FROM student_scores ORDER BY average_score DESC'
    );
    
    // 更新每个学生的排名
    for (let i = 0; i < students.length; i++) {
      await pool.query(
        'UPDATE student_scores SET class_rank = ? WHERE student_id = ?',
        [i + 1, students[i].student_id]
      );
    }
  } catch (err) {
    console.error('更新排名失败:', err);
  }
}

// 计算平均值
function calculateAverage(numbers) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  return (sum / numbers.length).toFixed(2);
}

// 初始化数据库表
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_scores (
        student_id INT AUTO_INCREMENT PRIMARY KEY,
        student_name VARCHAR(50) NOT NULL,
        Chinese_score DECIMAL(5,2) NOT NULL,
        Math_score DECIMAL(5,2) NOT NULL,
        English_score DECIMAL(5,2) NOT NULL,
        average_score DECIMAL(5,2) NOT NULL,
        class_rank INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 插入示例数据（如果表为空）
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM student_scores');
    if (rows[0].count === 0) {
      const sampleData = [
        ['张三', 85, 92, 78],
        ['李四', 78, 88, 85],
        ['王五', 92, 76, 90],
        ['赵六', 65, 82, 70],
        ['钱七', 88, 95, 93],
        ['孙八', 72, 68, 75],
        ['周九', 95, 90, 88],
        ['吴十', 81, 79, 82]
      ];
      
      for (const data of sampleData) {
        const average = (data[1] + data[2] + data[3]) / 3;
        await pool.query(
          'INSERT INTO student_scores (student_name, Chinese_score, Math_score, English_score, average_score) VALUES (?, ?, ?, ?, ?)',
          [...data, average]
        );
      }
      
      await updateClassRanks();
      console.log('已插入示例数据');
    }
  } catch (err) {
    console.error('初始化数据库失败:', err);
  }
}

// 启动服务器
async function startServer() {
  await testConnection();
  await initDatabase();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

startServer();