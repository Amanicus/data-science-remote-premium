// 全局数据存储
let currentRawData = [];

// 初始化数据：从全局变量 rawData 复制
function initData() {
    currentRawData = [...rawData];
}

// 根据年份和公司规模过滤数据
function filterData(year, companySize) {
    let filtered = [...currentRawData];
    if (year !== 'all') {
        filtered = filtered.filter(d => d.work_year === Number(year));
    }
    if (companySize !== 'all') {
        filtered = filtered.filter(d => d.company_size === companySize);
    }
    return filtered;
}

// 计算 KPI
function calculateKPI(filteredData) {
    const stats = getJobLevelStats(filteredData);
    const remoteTotal = filteredData.filter(d => d.is_remote === 'Remote').reduce((s, d) => s + d.salary_in_usd, 0);
    const remoteCount = filteredData.filter(d => d.is_remote === 'Remote').length;
    const onsiteTotal = filteredData.filter(d => d.is_remote === 'Onsite').reduce((s, d) => s + d.salary_in_usd, 0);
    const onsiteCount = filteredData.filter(d => d.is_remote === 'Onsite').length;

    const avgRemote = remoteCount ? remoteTotal / remoteCount : 0;
    const avgOnsite = onsiteCount ? onsiteTotal / onsiteCount : 0;
    const premiumOverall = avgOnsite > 0 ? ((avgRemote - avgOnsite) / avgOnsite * 100) : 0;

    const jobLevels = [...new Set(filteredData.map(d => d.job_level))];
    let highPremiumCount = 0;
    let topPremiumJob = '';
    let topPremiumValue = -Infinity;

    jobLevels.forEach(job => {
        const remoteAvg = getAvgFromStats(stats, job, true);
        const onsiteAvg = getAvgFromStats(stats, job, false);
        const premium = onsiteAvg > 0 ? (remoteAvg - onsiteAvg) / onsiteAvg * 100 : 0;
        if (premium >= 20) highPremiumCount++;
        if (premium > topPremiumValue) {
            topPremiumValue = premium;
            topPremiumJob = job;
        }
    });

    return {
        avgRemote: Math.round(avgRemote),
        avgOnsite: Math.round(avgOnsite),
        premiumOverall: premiumOverall.toFixed(1),
        highPremiumCount: highPremiumCount,
        topPremiumJob,
        topPremiumValue
    };
}

// 获取用于条形图的溢价排行数据
function getPremiumRanking(filteredData, topN = 10) {
    const stats = getJobLevelStats(filteredData);
    const jobLevels = [...new Set(filteredData.map(d => d.job_level))];
    const jobPremium = [];
    jobLevels.forEach(job => {
        const remoteSalaries = filteredData.filter(d => d.job_level === job && d.is_remote === 'Remote');
        const onsiteSalaries = filteredData.filter(d => d.job_level === job && d.is_remote === 'Onsite');
        const remoteCount = remoteSalaries.length;
        const onsiteCount = onsiteSalaries.length;
        if (onsiteCount < 1 || remoteCount < 1) return;

        const remoteAvg = getAvgFromStats(stats, job, true);
        const onsiteAvg = getAvgFromStats(stats, job, false);
        if (onsiteAvg > 0) {
            const premium = (remoteAvg - onsiteAvg) / onsiteAvg * 100;
            jobPremium.push({
                job,
                premium,
                remoteAvg,
                onsiteAvg,
                remoteCount,
                onsiteCount
            });
        }
    });
    jobPremium.sort((a, b) => b.premium - a.premium);
    return jobPremium.slice(0, topN);
}

// 获取逐年溢价趋势
function getYearlyTrend(allData) {
    const years = [...new Set(allData.map(d => d.work_year))].sort();
    const yearlyPremium = [];
    const yearlyRemote = [];
    const yearlyOnsite = [];
    years.forEach(year => {
        const yearData = allData.filter(d => d.work_year === year);
        const remoteAvg = yearData.filter(d => d.is_remote === 'Remote').reduce((s, item) => s + item.salary_in_usd, 0) / (yearData.filter(d => d.is_remote === 'Remote').length || 1);
        const onsiteAvg = yearData.filter(d => d.is_remote === 'Onsite').reduce((s, item) => s + item.salary_in_usd, 0) / (yearData.filter(d => d.is_remote === 'Onsite').length || 1);
        const premium = onsiteAvg > 0 ? (remoteAvg - onsiteAvg) / onsiteAvg * 100 : 0;
        yearlyPremium.push(premium);
        yearlyRemote.push(Math.round(remoteAvg));
        yearlyOnsite.push(Math.round(onsiteAvg));
    });
    return { years, yearlyPremium, yearlyRemote, yearlyOnsite };
}


// 通用：按 job_level + is_remote 分组统计薪资平均值和数量
function getJobLevelStats(data) {
    const groups = {};
    data.forEach(d => {
        const key = d.job_level + '|' + d.is_remote;
        if (!groups[key]) groups[key] = { sum: 0, count: 0 };
        groups[key].sum += d.salary_in_usd;
        groups[key].count += 1;
    });
    return groups;
}

// 从分组统计中提取某个 job_level 的远程/非远程平均值
function getAvgFromStats(stats, jobLevel, isRemote) {
    const key = jobLevel + '|' + (isRemote ? 'Remote' : 'Onsite');
    const entry = stats[key];
    return entry && entry.count > 0 ? entry.sum / entry.count : 0;
}

// ==================== 新增：岗位类别映射 ====================
function getJobCategory(jobTitle) {
    const title = (jobTitle || '').toLowerCase();
    if (title.includes('ai ') || title.includes('ai engineer') || title.includes('artificial intelligence')) return 'AI工程师';
    if (title.includes('machine learning') || title.includes('ml engineer') || title.includes('nlp')) return '机器学习工程师';
    if (title.includes('data scientist') || title.includes('data science')) return '数据科学家';
    if (title.includes('data engineer') || title.includes('data architect') || title.includes('etl')) return '数据工程师';
    if (title.includes('data analyst') || title.includes('business analyst') || title.includes('bi ')) return '数据分析师';
    if (title.includes('research') || title.includes('researcher')) return '研究科学家';
    if (title.includes('analytics') || title.includes('insight')) return '分析经理';
    if (title.includes('director') || title.includes('head ') || title.includes('lead') || title.includes('principal')) return '数据主管/总监';
    if (title.includes('software') || title.includes('developer') || title.includes('devops') || title.includes('cloud')) return '软件/云工程师';
    return '其他数据岗';
}

// 新增：获取岗位类别分布（供环形图使用）
function getCategoryDonutData(filteredData) {
    const remoteData = filteredData.filter(d => d.is_remote === 'Remote');
    const onsiteData = filteredData.filter(d => d.is_remote === 'Onsite');

    // 按类别聚合远程数据
    const catMap = {};
    remoteData.forEach(d => {
        const cat = getJobCategory(d.job_title);
        if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 };
        catMap[cat].total += d.salary_in_usd;
        catMap[cat].count += 1;
    });

    const categories = Object.keys(catMap);
    // 按人数排序
    categories.sort((a, b) => catMap[b].count - catMap[a].count);

    const result = categories.map(cat => ({
        name: cat,
        value: catMap[cat].count,
        avgSalary: Math.round(catMap[cat].total / catMap[cat].count)
    }));

    return result;
}

// 新增：获取散点图数据（远程 vs 非远程，按岗位级别）
function getScatterCompareData(filteredData) {
    const jobLevels = [...new Set(filteredData.map(d => d.job_level))];
    const levelMap = { 'EN': '初级', 'MI': '中级', 'SE': '高级', 'EX': '主管' };
    const scatterData = [];

    jobLevels.forEach(job => {
        const remoteSalaries = filteredData.filter(d => d.job_level === job && d.is_remote === 'Remote').map(d => d.salary_in_usd);
        const onsiteSalaries = filteredData.filter(d => d.job_level === job && d.is_remote === 'Onsite').map(d => d.salary_in_usd);

        if (remoteSalaries.length >= 1 && onsiteSalaries.length >= 1) {
            const remoteAvg = remoteSalaries.reduce((a, b) => a + b, 0) / remoteSalaries.length;
            const onsiteAvg = onsiteSalaries.reduce((a, b) => a + b, 0) / onsiteSalaries.length;
            const premium = (remoteAvg - onsiteAvg) / onsiteAvg * 100;
            const expLevel = job.split('_')[0];
            scatterData.push({
                job,
                remoteAvg: Math.round(remoteAvg),
                onsiteAvg: Math.round(onsiteAvg),
                premium: parseFloat(premium.toFixed(1)),
                totalCount: remoteSalaries.length + onsiteSalaries.length,
                expLevel,
                expLevelName: levelMap[expLevel] || expLevel
            });
        }
    });

    return scatterData;
}

// 新增：获取公司规模薪资对比（按指定岗位级别，供联动使用）
function getSizeBreakdown(filteredData, jobLevel) {
    const sizes = ['S', 'M', 'L'];
    const sizeNames = { 'S': '小型', 'M': '中型', 'L': '大型' };
    const result = [];

    let targetData = filteredData;
    if (jobLevel) {
        targetData = filteredData.filter(d => d.job_level === jobLevel);
    }

    sizes.forEach(size => {
        const remoteAvg = targetData.filter(d => d.company_size === size && d.is_remote === 'Remote').reduce((s, d) => s + d.salary_in_usd, 0) / (targetData.filter(d => d.company_size === size && d.is_remote === 'Remote').length || 1);
        const onsiteAvg = targetData.filter(d => d.company_size === size && d.is_remote === 'Onsite').reduce((s, d) => s + d.salary_in_usd, 0) / (targetData.filter(d => d.company_size === size && d.is_remote === 'Onsite').length || 1);
        const premium = onsiteAvg > 0 ? ((remoteAvg - onsiteAvg) / onsiteAvg * 100) : 0;
        const count = targetData.filter(d => d.company_size === size && d.is_remote === 'Remote').length;
        result.push({ size: sizeNames[size], remoteAvg: Math.round(remoteAvg), onsiteAvg: Math.round(onsiteAvg), premium: parseFloat(premium.toFixed(1)), count });
    });

    return result;
}
