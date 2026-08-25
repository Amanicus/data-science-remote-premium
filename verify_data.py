import pandas as pd

df = pd.read_csv('data/cleaned_remote_onsite.csv')

print('=== 基础统计 ===')
print('总行数:', len(df))
print('远程(Remote):', len(df[df['is_remote']=='Remote']))
print('非远程(Onsite):', len(df[df['is_remote']=='Onsite']))
print()

# ====== 1. 柱状图：溢价率TOP10 ======
print('=== 柱状图：溢价率TOP10 ===')
df['job_level'] = df['experience_level'] + '_' + df['job_title']
grouped = df.groupby(['job_level','is_remote']).agg(mean_salary=('salary_in_usd','mean'), count=('salary_in_usd','count')).reset_index()
# pivot
remote_df = grouped[grouped['is_remote']=='Remote'].set_index('job_level')
onsite_df = grouped[grouped['is_remote']=='Onsite'].set_index('job_level')
merged = remote_df.join(onsite_df, lsuffix='_remote', rsuffix='_onsite', how='inner')
merged = merged[(merged['count_onsite']>=1) & (merged['count_remote']>=1)]
merged['premium'] = (merged['mean_salary_remote'] - merged['mean_salary_onsite']) / merged['mean_salary_onsite'] * 100
top10 = merged.sort_values('premium', ascending=False).head(10)
print(top10[['mean_salary_remote','mean_salary_onsite','premium']].round(1))
print()

# ====== 2. AI岗位在前10中的占比 ======
print('=== AI/ML岗位在前10中的占比 ===')
def get_category(job_level):
    title = job_level.split('_',1)[1].lower()
    ai_kw = ['ai ','ai engineer','artificial intelligence']
    ml_kw = ['machine learning','ml engineer','nlp']
    if any(k in title for k in ai_kw):
        return 'AI工程师'
    if any(k in title for k in ml_kw):
        return '机器学习工程师'
    return '其他'
    
top10_cats = [get_category(j) for j in top10.index]
print('AI工程师:', top10_cats.count('AI工程师'))
print('ML工程师:', top10_cats.count('机器学习工程师'))
print('AI+ML合计:', top10_cats.count('AI工程师')+top10_cats.count('机器学习工程师'), '/10')
print('最高溢价:', top10['premium'].max().round(1), '%')
print()

# ====== 3. 对比图：TOP5远程vs非远程差距 ======
print('=== 对比图：TOP5远程vs非远程差距 ===')
top5 = top10.head(5)
for idx, row in top5.iterrows():
    gap = row['mean_salary_remote'] - row['mean_salary_onsite']
    print(f"  {idx}: remote=${row['mean_salary_remote']:,.0f}, onsite=${row['mean_salary_onsite']:,.0f}, gap=${gap:,.0f}")
print()

# ====== 4. 趋势图：逐年溢价 ======
print('=== 趋势图：逐年溢价 ===')
yearly_remote = df[df['is_remote']=='Remote'].groupby('work_year')['salary_in_usd'].mean()
yearly_onsite = df[df['is_remote']=='Onsite'].groupby('work_year')['salary_in_usd'].mean()
yearly = pd.DataFrame({'remote':yearly_remote, 'onsite':yearly_onsite})
yearly['premium'] = (yearly['remote'] - yearly['onsite']) / yearly['onsite'] * 100
print(yearly.round(1))
print()

# ====== 5. 环形图：远程岗位类别分布 ======
print('=== 环形图：远程岗位类别分布 ===')
def get_job_category(job_title):
    title = str(job_title).lower()
    if any(k in title for k in ['ai ','ai engineer','artificial intelligence']):
        return 'AI工程师'
    if any(k in title for k in ['machine learning','ml engineer','nlp']):
        return '机器学习工程师'
    if any(k in title for k in ['data scientist','data science']):
        return '数据科学家'
    if any(k in title for k in ['data engineer','data architect','etl']):
        return '数据工程师'
    if any(k in title for k in ['data analyst','business analyst','bi ']):
        return '数据分析师'
    if any(k in title for k in ['research','researcher']):
        return '研究科学家'
    if any(k in title for k in ['analytics','insight']):
        return '分析经理'
    if any(k in title for k in ['director','head ','lead','principal']):
        return '数据主管/总监'
    if any(k in title for k in ['software','developer','devops','cloud']):
        return '软件/云工程师'
    return '其他数据岗'

remote_df = df[df['is_remote']=='Remote'].copy()
remote_df['category'] = remote_df['job_title'].map(get_job_category)
cat_counts = remote_df['category'].value_counts()
total = cat_counts.sum()
ai_ml_total = 0
for cat in cat_counts.index:
    pct = cat_counts[cat]/total*100
    print(f"  {cat}: {cat_counts[cat]:,} ({pct:.1f}%)")
    if cat in ['AI工程师','机器学习工程师']:
        ai_ml_total += cat_counts[cat]
print(f"  AI+ML合计: {ai_ml_total} ({ai_ml_total/total*100:.1f}%)")
print(f"  数据分析师: {cat_counts.get('数据分析师',0)} ({cat_counts.get('数据分析师',0)/total*100:.1f}%)")
print()

# ====== 6. 公司规模对比 ======
print('=== 公司规模：远程vs非远程平均薪资 ===')
for size in ['S','M','L']:
    r = df[(df['is_remote']=='Remote')&(df['company_size']==size)]['salary_in_usd'].mean()
    o = df[(df['is_remote']=='Onsite')&(df['company_size']==size)]['salary_in_usd'].mean()
    p = (r-o)/o*100
    sname = {'S':'小型','M':'中型','L':'大型'}
    print(f"  {sname[size]}: remote=${r:,.0f}, onsite=${o:,.0f}, premium={p:.1f}%")
print()

# ====== 7. 散点图：高级vs初级溢价差异 ======
print('=== 各经验级别的平均溢价 ===')
for lvl in ['EN','MI','SE','EX']:
    lvl_name = {'EN':'初级','MI':'中级','SE':'高级','EX':'主管'}
    subset = merged[merged.index.str.startswith(lvl+'_')]
    if len(subset) > 0:
        print(f"  {lvl_name[lvl]}: 平均溢价 {subset['premium'].mean():.1f}%, 岗位数 {len(subset)}")