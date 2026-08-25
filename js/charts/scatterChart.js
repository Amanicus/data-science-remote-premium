let scatterChartInstance = null;

function renderScatterChart(data, categoryFilter) {
    const container = document.getElementById('chart-scatter');
    if (!container) return;
    if (scatterChartInstance) {
        scatterChartInstance.dispose();
    }
    scatterChartInstance = echarts.init(container);
    window.__scatterChartInstance = scatterChartInstance;

    let scatterData = getScatterCompareData(data);

    // 如果有点击环形图传入的类别过滤
    if (categoryFilter) {
        scatterData = scatterData.filter(d => getJobCategory(d.job.split('_').slice(1).join(' ')) === categoryFilter);
    }

    // 空数据提示
    if (scatterData.length === 0) {
        const emptyText = categoryFilter
            ? `${categoryFilter}岗位：当前筛选条件下样本量不足，无法生成散点图\n请尝试选择"全部年份"或调整其他筛选条件`
            : '当前筛选条件下样本量不足，无法生成散点图\n请尝试选择"全部年份"或调整其他筛选条件';
        scatterChartInstance.setOption({
            title: {
                text: categoryFilter
                    ? `${categoryFilter}'无数据'`
                    : '无数据',
                left: 'center', top: 0,
                textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' }
            },
            graphic: {
                type: 'text', left: 'center', top: 'middle',
                style: { text: emptyText, textAlign: 'center', fill: '#999', fontSize: 14, lineHeight: 24 }
            }
        });
        return;
    }

    const levelMap = { 'EN': '初级', 'MI': '中级', 'SE': '高级', 'EX': '主管' };
    const levelColors = { 'EN': '#4bc0c0', 'MI': '#ffce56', 'SE': '#ff8c42', 'EX': '#e87040' };

    // 按经验级别分组
    const groups = {};
    scatterData.forEach(d => {
        if (!groups[d.expLevel]) groups[d.expLevel] = [];
        groups[d.expLevel].push([d.onsiteAvg, d.remoteAvg, d.totalCount, d.job, d.premium]);
    });

    const series = Object.keys(groups).map(level => ({
        name: levelMap[level] || level,
        type: 'scatter',
        data: groups[level],
        symbolSize: function (data) {
            return Math.max(12, Math.min(40, Math.sqrt(data[2]) * 2));
        },
        itemStyle: {
            color: levelColors[level] || '#888',
            shadowBlur: 6,
            shadowColor: 'rgba(0,0,0,0.15)',
            opacity: 0.85
        },
        emphasis: {
            scale: 1.5,
            label: { show: true, formatter: function (p) { return p.data[3].split('_').slice(1).join(' '); }, position: 'top', fontSize: 10 }
        }
    }));

    const option = {
        title: {
            text: categoryFilter
                ? `${categoryFilter}岗位溢价分布图`
                : '岗位溢价分布图',
            left: 'center',
            top: 0,
            textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' }
        },
        tooltip: {
            formatter: function (p) {
                const d = p.data;
                return `<strong>${d[3]}</strong><br/>
                  非远程平均：$${d[0].toLocaleString()}<br/>
                  远程平均：$${d[1].toLocaleString()}<br/>
                  溢价率：<b style="color:#e87040">${d[4]}%</b><br/>
                  样本量：${d[2]}`;
            }
        },
        legend: { data: Object.values(levelMap), top: 28 },
        grid: { top: 80, bottom: 40, left: '10%', right: '5%', containLabel: true },
        xAxis: {
            type: 'value',
            name: '非远程平均薪资 (USD)',
            axisLabel: { formatter: v => '$' + (v / 1000).toFixed(0) + 'k' },
            splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } }
        },
        yAxis: {
            type: 'value',
            name: '远程平均薪资 (USD)',
            axisLabel: { formatter: v => '$' + (v / 1000).toFixed(0) + 'k' },
            splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } }
        },
        // 添加 y=x 参考线
        series: [
            {
                type: 'line',
                data: [[80000, 80000], [300000, 300000]],
                symbol: 'none',
                lineStyle: { color: '#ccc', type: 'dashed', width: 1 },
                silent: true,
                name: '等溢价线'
            },
            ...series
        ]
    };
    scatterChartInstance.setOption(option);
}
