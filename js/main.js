document.addEventListener('DOMContentLoaded', function () {
    // 初始化数据
    initData();

    // 初始化筛选器下拉选项（年份）
    const years = [...new Set(rawData.map(d => d.work_year))].sort();
    const yearSelect = document.getElementById('year-filter');
    years.forEach(y => {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    });

    // 默认渲染
    updateDashboard();

    // 监听筛选器变化
    document.getElementById('year-filter').addEventListener('change', updateDashboard);
    document.getElementById('size-filter').addEventListener('change', updateDashboard);
});

function updateDashboard() {
    const year = document.getElementById('year-filter').value;
    const companySize = document.getElementById('size-filter').value;
    const filtered = filterData(year, companySize);

    // 更新 KPI
    const kpi = calculateKPI(filtered);
    document.getElementById('kpi-remote-avg').innerHTML = `🏠 远程平均薪资: $${kpi.avgRemote.toLocaleString()}`;
    document.getElementById('kpi-onsite-avg').innerHTML = `🏢 非远程平均薪资: $${kpi.avgOnsite.toLocaleString()}`;
    document.getElementById('kpi-premium').innerHTML = `📈 整体溢价: ${kpi.premiumOverall}%`;
    document.getElementById('kpi-high-count').innerHTML = `🏆 高溢价岗位数: ${kpi.highPremiumCount}`;

    // 更新图表
    renderBarChart(filtered);
    renderCompareChart(filtered);
    renderScatterChart(filtered);
    renderDonutChart(filtered);
    renderRadarChart(filtered);
    renderSizeCompareChart(filtered);
    // 趋势图使用全部原始数据（不受筛选器影响，以显示整体趋势），也可以传入筛选后的但可能年份不连续
    // 为了故事性，趋势图展示整体市场趋势（不随筛选器改变）
    renderTrendChart(currentRawData);
}