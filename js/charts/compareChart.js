let compareChartInstance = null;

function renderCompareChart(data) {
    const container = document.getElementById('chart-compare');
    if (!container) return;
    if (compareChartInstance) {
        compareChartInstance.dispose();
    }
    compareChartInstance = echarts.init(container);
    window.__compareChartInstance = compareChartInstance;

    const topJobs = getPremiumRanking(data, 5);

    // 空数据提示
    if (topJobs.length === 0) {
        compareChartInstance.setOption({
            title: { text: '无数据', left: 'center', top: 0, textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' } },
            graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '当前筛选条件下样本量不足，无法计算有效溢价\n请尝试选择"全部年份"或调整其他筛选条件', textAlign: 'center', fill: '#999', fontSize: 14, lineHeight: 24 } }
        });
        return;
    }

    const jobNames = topJobs.map(item => {
        const parts = item.job.split('_');
        const levelName = { 'EN': '初级', 'MI': '中级', 'SE': '高级', 'EX': '主管' }[parts[0]] || parts[0];
        return parts.slice(1).join(' ') + '\n(' + levelName + ')';
    });
    const remoteSalaries = topJobs.map(item => item.remoteAvg);
    const onsiteSalaries = topJobs.map(item => item.onsiteAvg);

    const option = {
        title: {
            text: 'TOP5远程vs非远程差距最大的岗位',
            left: 'center',
            top: 0,
            textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' }
        },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['远程平均薪资', '非远程平均薪资'], top: 28 },
        grid: { top: 80, bottom: 20, left: '8%', right: '4%', containLabel: true },
        xAxis: { type: 'category', data: jobNames, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', name: '薪资 (USD)', axisLabel: { formatter: function (v) { return '$' + (v / 1000).toFixed(0) + 'k'; } } },
        series: [
            {
                name: '远程平均薪资', type: 'bar', data: remoteSalaries,
                itemStyle: { color: '#36a2eb', borderRadius: [6, 6, 0, 0] },
                label: { show: true, position: 'top', formatter: function (p) { return '$' + (p.value / 1000).toFixed(0) + 'k'; }, fontSize: 10 }
            },
            {
                name: '非远程平均薪资', type: 'bar', data: onsiteSalaries,
                itemStyle: { color: '#ff6384', borderRadius: [6, 6, 0, 0] },
                label: { show: true, position: 'top', formatter: function (p) { return '$' + (p.value / 1000).toFixed(0) + 'k'; }, fontSize: 10 }
            }
        ]
    };
    compareChartInstance.setOption(option);
}