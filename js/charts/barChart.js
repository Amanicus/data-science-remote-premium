
let barChartInstance = null;

function renderBarChart(data) {
    const container = document.getElementById('chart-bar');
    if (!container) return;
    if (barChartInstance) {
        barChartInstance.dispose();
    }
    barChartInstance = echarts.init(container);
    window.__barChartInstance = barChartInstance;

    const topJobs = getPremiumRanking(data, 10);

    // 空数据提示
    if (topJobs.length === 0) {
        barChartInstance.setOption({
            title: {
                text: '无数据',
                left: 'center', top: 0,
                textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e3c72' }
            },
            graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: '当前筛选条件下样本量不足，无法计算有效溢价\n请尝试选择"全部年份"或调整其他筛选条件',
                    textAlign: 'center',
                    fill: '#999',
                    fontSize: 14,
                    lineHeight: 24
                }
            }
        });
        return;
    }

    const jobNames = topJobs.map(item => {
        const parts = item.job.split('_');
        const levelName = { 'EN': '初级', 'MI': '中级', 'SE': '高级', 'EX': '主管' }[parts[0]] || parts[0];
        return parts.slice(1).join(' ') + ' (' + levelName + ')';
    });
    const premiums = topJobs.map(item => item.premium.toFixed(1));

    // 颜色映射：溢价越高越暖
    const colors = premiums.map(p => {
        const val = parseFloat(p);
        if (val >= 40) return '#d9363e';
        if (val >= 30) return '#e87040';
        return '#ff8c42';
    });

    const option = {
        title: {
            text: '历年前10名高溢价岗位',
            left: 'center',
            top: 0,
            textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e3c72' }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                const idx = params[0].dataIndex;
                const job = topJobs[idx];
                return `<strong>${jobNames[idx]}</strong><br/>
                  远程溢价率：<b style="color:#e87040">${job.premium.toFixed(1)}%</b><br/>
                  远程平均薪资：$${job.remoteAvg.toLocaleString()}<br/>
                  非远程平均薪资：$${job.onsiteAvg.toLocaleString()}`;
            }
        },
        grid: { left: '3%', right: '8%', top: 50, bottom: 20, containLabel: true },
        xAxis: { type: 'value', name: '溢价 (%)', nameLocation: 'middle', nameGap: 30 },
        yAxis: {
            type: 'category',
            data: jobNames.reverse(),
            axisLabel: { fontSize: 11, rotate: 0 },
            name: '',
            inverse: false
        },
        series: [{
            name: '溢价率',
            type: 'bar',
            data: premiums.reverse().map((p, i) => ({
                value: p,
                itemStyle: { color: colors.reverse()[i], borderRadius: [0, 8, 8, 0] },
                _jobLevel: topJobs.reverse()[i].job
            })),
            label: { show: true, position: 'right', formatter: '{c}%', fontWeight: 'bold' },
            barMaxWidth: 35
        }]
    };
    barChartInstance.setOption(option);

    // 图表联动：点击柱状图更新其他图表
    barChartInstance.off('click');
    barChartInstance.on('click', function (params) {
        if (params.data && params.data._jobLevel) {
            window._selectedJobLevel = params.data._jobLevel;
            refreshLinkedCharts(data);
        }
    });
}

// 供外部调用的刷新联动图表
function refreshLinkedCharts(sourceData) {
    if (typeof renderRadarChart === 'function') {
        renderRadarChart(sourceData, window._selectedJobLevel);
    }
    if (typeof renderSizeCompareChart === 'function') {
        renderSizeCompareChart(sourceData, window._selectedJobLevel);
    }
}

