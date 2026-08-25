let radarChartInstance = null;

function renderRadarChart(data, jobLevel) {
    const container = document.getElementById('chart-radar');
    if (!container) return;
    if (radarChartInstance) {
        radarChartInstance.dispose();
    }
    radarChartInstance = echarts.init(container);
    window.__radarChartInstance = radarChartInstance;

    const breakdown = getSizeBreakdown(data, jobLevel);

    const indicator = [
        { name: '小型公司', max: 160000 },
        { name: '中型公司', max: 160000 },
        { name: '大型公司', max: 160000 }
    ];

    const remoteValues = breakdown.map(d => d.remoteAvg);
    const onsiteValues = breakdown.map(d => d.onsiteAvg);
    const premiumValues = breakdown.map(d => d.premium * 1000); // 放大以便雷达图显示

    // 更新 max
    const allVals = [...remoteValues, ...onsiteValues];
    const globalMax = Math.max(...allVals, 80000);
    indicator.forEach(ind => { ind.max = Math.ceil(globalMax * 1.3 / 10000) * 10000; });

    const jobDisplay = jobLevel
        ? jobLevel.split('_').slice(1).join(' ') + ' (' + ({ 'EN': '初级', 'MI': '中级', 'SE': '高级', 'EX': '主管' }[jobLevel.split('_')[0]] || '') + ')'
        : '全部岗位';

    const option = {
        title: {
            text: `${jobDisplay}：不同公司规模下远程/非远程溢价对比`,
            left: 'center',
            top: 0,
            textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' }
        },
        tooltip: {},
        legend: { data: ['远程', '非远程'], bottom: 0 },
        radar: {
            center: ['50%', '55%'],
            radius: '65%',
            indicator: indicator,
            axisName: { fontSize: 11 }
        },
        series: [{
            type: 'radar',
            data: [
                {
                    value: remoteValues,
                    name: '远程',
                    lineStyle: { color: '#36a2eb', width: 2 },
                    areaStyle: { color: 'rgba(54,162,235,0.25)' },
                    itemStyle: { color: '#36a2eb' },
                    symbol: 'circle',
                    symbolSize: 6
                },
                {
                    value: onsiteValues,
                    name: '非远程',
                    lineStyle: { color: '#ff6384', width: 2 },
                    areaStyle: { color: 'rgba(255,99,132,0.15)' },
                    itemStyle: { color: '#ff6384' },
                    symbol: 'diamond',
                    symbolSize: 6
                }
            ]
        }]
    };
    radarChartInstance.setOption(option);
}
