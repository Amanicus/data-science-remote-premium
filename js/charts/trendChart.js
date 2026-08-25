let trendChartInstance = null;

function renderTrendChart(allData) {
    const container = document.getElementById('chart-trend');
    if (!container) return;
    if (trendChartInstance) {
        trendChartInstance.dispose();
    }
    trendChartInstance = echarts.init(container);
    window.__trendChartInstance = trendChartInstance;

    const { years, yearlyPremium, yearlyRemote, yearlyOnsite } = getYearlyTrend(allData);

    const option = {
        title: {
            text: '2020-2025年远程溢价逐年变化',
            left: 'center',
            top: 0,
            textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e3c72' }
        },
        tooltip: { trigger: 'axis' },
        legend: { data: ['远程平均薪资', '非远程平均薪资', '整体溢价率'], top: 28 },
        grid: { top: 80, bottom: 30, left: '8%', right: '8%', containLabel: true },
        xAxis: { type: 'category', data: years, name: '年份' },
        yAxis: [
            {
                type: 'value', name: '薪资 (USD)',
                axisLabel: { formatter: function (v) { return '$' + (v / 1000).toFixed(0) + 'k'; } },
                splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } }
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
                data: yearlyRemote,
                type: 'line',
                smooth: true,
                lineStyle: { color: '#36a2eb', width: 3 },
                symbol: 'circle',
                symbolSize: 8,
                label: { show: true, position: 'top', formatter: function (p) { return '$' + (p.value / 1000).toFixed(0) + 'k'; }, fontSize: 10 }
            },
            {
                name: '非远程平均薪资',
                data: yearlyOnsite,
                type: 'line',
                smooth: true,
                lineStyle: { color: '#ff6384', width: 3, type: 'dashed' },
                symbol: 'diamond',
                symbolSize: 8,
                label: { show: true, position: 'bottom', formatter: function (p) { return '$' + (p.value / 1000).toFixed(0) + 'k'; }, fontSize: 10 }
            },
            {
                name: '整体溢价率',
                data: yearlyPremium,
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                lineStyle: { color: '#e88d4d', width: 3 },
                areaStyle: { opacity: 0.15, color: '#ffb347' },
                symbol: 'roundRect',
                symbolSize: 10,
                label: { show: true, position: 'top', formatter: '{c}%', fontWeight: 'bold', color: '#e87040', fontSize: 11 }
            }
        ]
    };
    trendChartInstance.setOption(option);
}