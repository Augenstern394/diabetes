// 初始化图表
let averageChart, subjectChart, rankChart, distributionChart;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化图表
  averageChart = echarts.init(document.getElementById('averageChart'));
  subjectChart = echarts.init(document.getElementById('subjectChart'));
  rankChart = echarts.init(document.getElementById('rankChart'));
  distributionChart = echarts.init(document.getElementById('distributionChart'));
  
  // 绑定事件
  document.getElementById('refreshBtn').addEventListener('click', fetchData);
  document.getElementById('addStudentBtn').addEventListener('click', openAddStudentModal);
  document.querySelector('.close').addEventListener('click', closeAddStudentModal);
  document.getElementById('addStudentForm').addEventListener('submit', handleAddStudent);
  
  // 点击弹窗外部关闭弹窗
  window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('addStudentModal')) {
      closeAddStudentModal();
    }
  });
  
  // 初始加载数据
  fetchData();
});

// 获取数据
async function fetchData() {
  try {
    showLoading();
    const response = await axios.get('http://localhost:3000/api/scores');
    const { data, stats } = response.data;
    
    // 更新统计数据
    updateStats(stats);
    
    // 渲染表格
    renderStudentTable(data);
    
    // 渲染图表
    renderCharts(data, stats);
    
    hideLoading();
  } catch (error) {
    console.error('获取数据失败:', error);
    alert('获取数据失败，请稍后重试');
    hideLoading();
  }
}

// 更新统计卡片
function updateStats(stats) {
  document.getElementById('overallAvg').textContent = stats.overallAvg;
  document.getElementById('chineseAvg').textContent = stats.chineseAvg;
  document.getElementById('mathAvg').textContent = stats.mathAvg;
  document.getElementById('englishAvg').textContent = stats.englishAvg;
  
  if (stats.topStudent) {
    document.getElementById('topStudent').textContent = 
      `${stats.topStudent.student_name} (${stats.topStudent.average_score}分)`;
  }
}

// 渲染学生表格
function renderStudentTable(students) {
  const tbody = document.getElementById('studentTableBody');
  tbody.innerHTML = '';
  
  students.forEach(student => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${student.class_rank}</td>
      <td>${student.student_name}</td>
      <td class="${getScoreClass(student.Chinese_score)}">${student.Chinese_score}</td>
      <td class="${getScoreClass(student.Math_score)}">${student.Math_score}</td>
      <td class="${getScoreClass(student.English_score)}">${student.English_score}</td>
      <td class="${getScoreClass(student.average_score)}">${student.average_score}</td>
      <td>
        <button class="btn-delete" data-id="${student.student_id}">删除</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // 绑定删除按钮事件
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', handleDeleteStudent);
  });
}

// 根据分数获取CSS类
function getScoreClass(score) {
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-good';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
}

// 渲染所有图表
function renderCharts(data, stats) {
  renderAverageChart(data);
  renderSubjectChart(data);
  renderRankChart(data);
  renderDistributionChart(data);
}

// 渲染平均分图表
function renderAverageChart(data) {
  const option = {
    title: {
      text: '学生平均成绩排名',
      left: 'center',
      textStyle: {
        fontSize: 18,
        color: '#8e44ad'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>平均分: {c}分'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.student_name),
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '平均分',
      min: 0,
      max: 100,
      axisLine: {
        show: true
      }
    },
    series: [{
      name: '平均分',
      type: 'bar',
      data: data.map(item => item.average_score),
      itemStyle: {
        color: function(params) {
          const score = data[params.dataIndex].average_score;
          if (score >= 90) return '#2ecc71';
          if (score >= 80) return '#3498db';
          if (score >= 60) return '#f1c40f';
          return '#e74c3c';
        },
        borderRadius: [4, 4, 0, 0]
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}分'
      },
      markLine: {
        data: [{
          type: 'average',
          name: '班级平均',
          label: {
            formatter: '平均: {c}分'
          },
          lineStyle: {
            color: '#8e44ad'
          }
        }]
      }
    }]
  };
  
  averageChart.setOption(option);
}

// 渲染科目对比图表
function renderSubjectChart(data) {
  const option = {
    title: {
      text: '各科成绩对比',
      left: 'center',
      textStyle: {
        fontSize: 18,
        color: '#3498db'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['语文', '数学', '英语'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.student_name),
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '分数',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '语文',
        type: 'bar',
        data: data.map(item => item.Chinese_score),
        itemStyle: {
          color: '#e74c3c'
        }
      },
      {
        name: '数学',
        type: 'bar',
        data: data.map(item => item.Math_score),
        itemStyle: {
          color: '#3498db'
        }
      },
      {
        name: '英语',
        type: 'bar',
        data: data.map(item => item.English_score),
        itemStyle: {
          color: '#2ecc71'
        }
      }
    ]
  };
  
  subjectChart.setOption(option);
}

// 渲染排名图表
function renderRankChart(data) {
  const option = {
    title: {
      text: '学生排名变化',
      left: 'center',
      textStyle: {
        fontSize: 18,
        color: '#e67e22'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map((_, index) => `第${index + 1}名`),
      name: '排名'
    },
    yAxis: {
      type: 'value',
      inverse: true,
      name: '排名',
      min: 1,
      max: data.length,
      interval: 1
    },
    series: [{
      name: '学生排名',
      type: 'line',
      data: data.map((item, index) => ({
        value: index + 1,
        name: item.student_name
      })),
      symbol: 'circle',
      symbolSize: 8,
      label: {
        show: true,
        formatter: '{b}'
      },
      lineStyle: {
        width: 0
      },
      emphasis: {
        lineStyle: {
          width: 3
        }
      }
    }]
  };
  
  rankChart.setOption(option);
}

// 渲染分数分布图表
function renderDistributionChart(data) {
  // 计算分数段分布
  const ranges = [
    { name: '90-100', min: 90, max: 100 },
    { name: '80-89', min: 80, max: 89 },
    { name: '70-79', min: 70, max: 79 },
    { name: '60-69', min: 60, max: 69 },
    { name: '0-59', min: 0, max: 59 }
  ];
  
  const chineseData = calculateScoreDistribution(data.map(item => item.Chinese_score), ranges);
  const mathData = calculateScoreDistribution(data.map(item => item.Math_score), ranges);
  const englishData = calculateScoreDistribution(data.map(item => item.English_score), ranges);
  
  const option = {
    title: {
      text: '分数段分布',
      left: 'center',
      textStyle: {
        fontSize: 18,
        color: '#16a085'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['语文', '数学', '英语'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ranges.map(r => r.name)
    },
    yAxis: {
      type: 'value',
      name: '人数'
    },
    series: [
      {
        name: '语文',
        type: 'bar',
        data: chineseData,
        itemStyle: {
          color: '#e74c3c'
        }
      },
      {
        name: '数学',
        type: 'bar',
        data: mathData,
        itemStyle: {
          color: '#3498db'
        }
      },
      {
        name: '英语',
        type: 'bar',
        data: englishData,
        itemStyle: {
          color: '#2ecc71'
        }
      }
    ]
  };
  
  distributionChart.setOption(option);
}

// 计算分数段分布
function calculateScoreDistribution(scores, ranges) {
  return ranges.map(range => {
    return scores.filter(score => score >= range.min && score <= range.max).length;
  });
}

// 打开添加学生弹窗
function openAddStudentModal() {
  document.getElementById('addStudentModal').style.display = 'block';
}

// 关闭添加学生弹窗
function closeAddStudentModal() {
  document.getElementById('addStudentModal').style.display = 'none';
  document.getElementById('addStudentForm').reset();
}

// 处理添加学生
async function handleAddStudent(e) {
  e.preventDefault();
  
  const studentName = document.getElementById('studentName').value;
  const chineseScore = document.getElementById('chineseScore').value;
  const mathScore = document.getElementById('mathScore').value;
  const englishScore = document.getElementById('englishScore').value;
  
  try {
    showLoading();
    await axios.post('http://localhost:3000/api/scores', {
      student_name: studentName,
      Chinese_score: chineseScore,
      Math_score: mathScore,
      English_score: englishScore
    });
    
    closeAddStudentModal();
    fetchData();
    alert('学生添加成功');
  } catch (error) {
    console.error('添加学生失败:', error);
    alert('添加学生失败，请稍后重试');
    hideLoading();
  }
}

// 处理删除学生
async function handleDeleteStudent(e) {
  const studentId = e.target.getAttribute('data-id');
  
  if (!confirm('确定要删除这个学生吗？')) {
    return;
  }
  
  try {
    showLoading();
    await axios.delete(`http://localhost:3000/api/scores/${studentId}`);
    fetchData();
    alert('学生删除成功');
  } catch (error) {
    console.error('删除学生失败:', error);
    alert('删除学生失败，请稍后重试');
    hideLoading();
  }
}

// 显示加载状态
function showLoading() {
  document.body.style.cursor = 'wait';
}

// 隐藏加载状态
function hideLoading() {
  document.body.style.cursor = 'default';
}

// 窗口大小变化时重新调整图表大小
window.addEventListener('resize', function() {
  averageChart.resize();
  subjectChart.resize();
  rankChart.resize();
  distributionChart.resize();
});