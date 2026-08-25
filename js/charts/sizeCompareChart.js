let sizeCompareChartInstance = null;

function renderSizeCompareChart(data, jobLevel) {
    const container = document.getElementById('chart-size-compare');
    if (!container) return;
    if (sizeCompareChartInstance) {
        sizeCompareChartInstance.dispose();
    }
    sizeCompareChartInstance = echarts.init(container);
    window.__sizeCompareChartInstance = sizeCompareChartInstance;

    // 如果不传 jobLevel，用全部数据
    const breakdown = getSizeBreakdown(data, jobLevel);
    const categories = breakdown.map(d => d.size);
    const remoteData = breakdown.map(d => d.remoteAvg);
    const onsiteData = breakdown.map(d => d.onsiteAvg);

    // 计算各规模的溢价
    const premiumPcts = breakdown.map(d => d.premium);

    const jobDisplay = jobLevel
        ? jobLevel.split('_').slice(1).join(' ') + ' (' + ({ 'EN': '初级', 'MI': '中级', 'SE': '高级', 'EX': '主管' }[jobLevel.split('_')[0]] || '') + ')'
        : '全部岗位';

    const option = {
        title: {
            text: `${jobDisplay}：公司规模对远程溢价影响对比图`,
            left: 'center',
            top: 0,
            textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function (params) {
                let html = `<strong>${params[0].name}</strong>`;
                params.forEach(p => {
                    html += `<br/>${p.seriesName}：$${p.value.toLocaleString()}`;
                });
                return html;
            }
        },
        legend: { data: ['远程平均薪资', '非远程平均薪资', '溢价率'], top: 28 },
        grid: { top: 80, bottom: 40, left: '8%', right: '8%', containLabel: true },
        xAxis: { type: 'category', data: categories },
        yAxis: [
            {
                type: 'value', name: '薪资 (USD)',
                axisLabel: { formatter: v => '$' + (v / 1000).toFixed(0) + 'k' }
            },
            {
                type: 'value', name: '溢价 (%)',
                axisLabel: { formatter: '{value}%' },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '远程平均薪资',
                type: 'bar',
                data: remoteData,
                itemStyle: { color: '#36a2eb', borderRadius: [6, 6, 0, 0] },
                label: { show: true, position: 'inside', formatter: v => '$' + (v.value / 1000).toFixed(0) + 'k', fontSize: 10, color: '#fff' },
                barMaxWidth: 50
            },
            {
                name: '非远程平均薪资',
                type: 'bar',
                data: onsiteData,
                itemStyle: { color: '#ff6384', borderRadius: [6, 6, 0, 0] },
                label: { show: true, position: 'top', formatter: v => '$' + (v.value / 1000).toFixed(0) + 'k', fontSize: 10 },
                barMaxWidth: 50
            },
            {
                name: '溢价率',
                type: 'line',
                yAxisIndex: 1,
                data: premiumPcts,
                lineStyle: { color: '#e88d4d', width: 3 },
                symbol: 'circle',
                symbolSize: 10,
                label: { show: true, position: 'top', formatter: '{c}%', fontWeight: 'bold', fontSize: 11, color: '#e87040' }
            }
        ]
    };
    sizeCompareChartInstance.setOption(option);
}
