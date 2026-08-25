let donutChartInstance = null;

function renderDonutChart(data) {
    const container = document.getElementById('chart-donut');
    if (!container) return;
    if (donutChartInstance) {
        donutChartInstance.dispose();
    }
    donutChartInstance = echarts.init(container);
    window.__donutChartInstance = donutChartInstance;

    const donutData = getCategoryDonutData(data);

    // 空数据提示
    if (donutData.length === 0) {
        donutChartInstance.setOption({
            title: { text: '无数据', left: 'center', top: 0, textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' } },
            graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '当前筛选条件下远程岗位数据量不足\n请尝试选择"全部年份"或调整其他筛选条件', textAlign: 'center', fill: '#999', fontSize: 14, lineHeight: 24 } }
        });
        return;
    }

    // 自定义颜色
    const colorPalette = ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff', '#ff8c42', '#7bc043', '#f0a500', '#a855f7'];

    const option = {
        title: {
            text: '远程岗位类别发布',
            left: 'center',
            top: 0,
            textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1e3c72' }
        },
        tooltip: {
            trigger: 'item',
            formatter: function (p) {
                const d = donutData.find(item => item.name === p.name);
                return `<strong>${p.name}</strong><br/>
                  岗位数量：${p.value} (占比 ${p.percent}%)<br/>
                  远程平均薪资：<b>$${d ? d.avgSalary.toLocaleString() : '--'}</b>`;
            }
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            itemGap: 8,
            textStyle: { fontSize: 11 }
        },
        series: [
            {
                name: '岗位类别',
                type: 'pie',
                radius: ['55%', '78%'],
                center: ['38%', '52%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 3
                },
                label: {
                    show: true,
                    position: 'inside',
                    formatter: '{d}%',
                    fontSize: 10,
                    fontWeight: 'bold'
                },
                emphasis: {
                    label: { fontSize: 16, fontWeight: 'bold' },
                    scaleSize: 10
                },
                data: donutData,
                color: colorPalette
            }
        ]
    };
    donutChartInstance.setOption(option);

    // 点击环形图联动
    donutChartInstance.off('click');
    donutChartInstance.on('click', function (params) {
        if (params.name) {
            window._selectedCategory = params.name;
            if (typeof renderScatterChart === 'function') {
                renderScatterChart(data, params.name);
            }
        }
    });
}
