
// 初始化图表
const diseaseChart = echarts.init(document.getElementById('diseaseChart'));
const salaryChart = echarts.init(document.getElementById('salaryChart'));

// 从后端获取数据
fetch('http://localhost:3000/data')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // if (!Array.isArray(data) || data.length === 0) {
        //   throw new Error('No data received or data format is incorrect');
        // }

        const chartData = data.diseaseStatistics;
        const salarys = data.doctorEarnings;
        // 设置图表选项
        diseaseChart.setOption({
            title: {
                text: '病种人数与占比分析',
                left: 'center',
                textStyle: {
                    fontSize: 18,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: params => {
                    const disease = params[0].name;
                    const count = params[0].value;
                    const percentage = params[1].value;
                    return `
                <div style="font-weight:bold;margin-bottom:5px">${disease}</div>
                <div>人数: ${count.toLocaleString()}</div>
                <div>占比: ${percentage}%</div>
              `;
                }
            },
            legend: {
                data: ['人数', '占比'],
                top: 30
            },
            grid: {
                top: 80,
                bottom: 100,
                left: 60,
                right: 60
            },
            xAxis: {
                type: 'category',
                data: chartData.map(item => item.dis_class),
                axisLabel: {
                    rotate: 30,
                    interval: 0
                },
                axisTick: {
                    alignWithLabel: true
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '人数',
                    min: 0,
                    axisLine: {
                        show: true
                    },
                    axisLabel: {
                        formatter: '{value}'
                    }
                },
                {
                    type: 'value',
                    name: '占比(%)',
                    min: 0,
                    max: 100,
                    axisLabel: {
                        formatter: '{value}%'
                    }
                }
            ],
            series: [
                {
                    name: '人数',
                    type: 'bar',
                    barWidth: '40%',
                    data: chartData.map(item => item.num),
                    itemStyle: {
                        color: '#5470C6',
                        borderRadius: [4, 4, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        formatter: '{c}'
                    }
                },
                {
                    name: '占比',
                    type: 'line',
                    smooth: true,
                    yAxisIndex: 1,
                    data: chartData.map(item => item.percentage),
                    itemStyle: {
                        color: '#EE6666'
                    },
                    lineStyle: {
                        width: 3
                    },
                    symbolSize: 8,
                    label: {
                        show: true,
                        formatter: '{c}%',
                        position: 'top'
                    }
                }
            ],
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    bottom: 30,
                    height: 20,
                    start: 0,
                    end: 100
                }
            ]
        });

        salaryChart.setOption({
            title: {
                text: '医生工资表',
                left: 'center',
                textStyle: {
                    fontSize: 18,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: params => {
                    const docname = params[0].name;
                    const salary = params[0].value;
                    const number = params[1].value;
                    return `
                <div style="font-weight:bold;margin-bottom:5px">${docname}</div>
                <div>人数: ${salary.toLocaleString()}</div>
                <div>占比: ${number}</div>
              `;
                }
            },
            legend: {
                data: ['工资', '人数'],
                top: 30
            },
            grid: {
                top: 80,
                bottom: 100,
                left: 60,
                right: 60
            },
            xAxis: {
                type: 'category',
                data: salarys.map(item => item.doc_name),
                axisLabel: {
                    rotate: 30,
                    interval: 0
                },
                axisTick: {
                    alignWithLabel: true
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '工资',
                    min: 0,
                    axisLine: {
                        show: true
                    },
                    axisLabel: {
                        formatter: '{value}'
                    }
                },
                {
                    type: 'value',
                    name: '人数',
                    min: 0,
                    max: 100,
                    axisLabel: {
                        formatter: '{value}'
                    }
                }
            ],
            series: [
                {
                    name: '工资',
                    type: 'bar',
                    barWidth: '40%',
                    data: salarys.map(item => item.money),
                    itemStyle: {
                        color: '#5470C6',
                        borderRadius: [4, 4, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        formatter: '{c}'
                    }
                },
                {
                    name: '人数',
                    type: 'line',
                    smooth: true,
                    yAxisIndex: 1,
                    data: salarys.map(item => item.number),
                    itemStyle: {
                        color: '#EE6666'
                    },
                    lineStyle: {
                        width: 3
                    },
                    symbolSize: 8,
                    label: {
                        show: true,
                        formatter: '{c}',
                        position: 'top'
                    }
                }
            ],
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    bottom: 30,
                    height: 20,
                    start: 0,
                    end: 100
                }
            ]
        });
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        diseaseChart.setOption({
            title: {
                text: '数据加载失败',
                subtext: error.message,
                left: 'center',
                top: 'center'
            }
        });
    });

// 窗口大小变化时重新调整图表大小
window.addEventListener('resize', function () {
    diseaseChart.resize();
    salaryChart.resize();
});
