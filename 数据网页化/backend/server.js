const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(cors()); // 解决跨域问题

// 连接 MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // 替换为你的用户名
  password: 'root', // 替换为你的密码
  database: 'hospital'
});

// 提供数据的 API 接口
app.get('/data', (req, res) => {
  // 第一个查询：病种统计
  const diseaseQuery = 'SELECT dis_class, COUNT(*) as num, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM door), 2) AS percentage FROM door GROUP BY dis_class ORDER BY num DESC';
  
  // 第二个查询：医生收入统计
  const doctorQuery = 'SELECT doc_name, SUM(money) as money, COUNT(*) as number FROM door GROUP BY doc_name ORDER BY money DESC';

  // 使用Promise.all并行执行两个查询
  Promise.all([
    new Promise((resolve, reject) => {
      connection.query(diseaseQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      connection.query(doctorQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
  .then(([diseaseStats, doctorStats]) => {
    res.json({
      diseaseStatistics: diseaseStats,
      doctorEarnings: doctorStats
    });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  });
});

// 启动服务
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});