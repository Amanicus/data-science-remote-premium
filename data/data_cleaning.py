import pandas as pd
import numpy as np

# ==================== 1. 加载数据 ====================
df = pd.read_csv('salaries.csv')

print("数据集形状（行, 列）：", df.shape)
print("\n前5行：")
print(df.head())
print("\n列名：", df.columns.tolist())
print("\n数据类型：")
print(df.dtypes)
print("\n缺失值统计：")
print(df.isnull().sum())

# ==================== 2. 数据探索与异常值初步检查 ====================
print("\n" + "="*50)
print("remote_ratio 取值分布：")
print(df['remote_ratio'].value_counts())

print("\nexperience_level 分布：")
print(df['experience_level'].value_counts())

print("\nsalary_in_usd 描述性统计：")
print(df['salary_in_usd'].describe())

# 找出薪资极低和极高的值
low_salary = df[df['salary_in_usd'] < 10000]
high_salary = df[df['salary_in_usd'] > 500000]
print(f"\n薪资低于1万美元的记录数：{len(low_salary)}")
print(f"薪资高于50万美元的记录数：{len(high_salary)}")

# ==================== 3. 缺失值处理（此数据集无缺失，但记录方法） ====================
if df.isnull().sum().sum() > 0:
    for col in df.columns:
        if df[col].dtype in ['int64', 'float64']:
            df[col].fillna(df[col].median(), inplace=True)
        else:
            df[col].fillna(df[col].mode()[0], inplace=True)
    print("缺失值已填充。")
else:
    print("没有缺失值，无需处理。")

# ==================== 4. 异常值处理 ====================
original_len = len(df)
df = df[(df['salary_in_usd'] >= 10000) & (df['salary_in_usd'] <= 500000)]
print(f"删除了 {original_len - len(df)} 条异常薪资记录。")

# ==================== 5. 字段类型转换 ====================
df['work_year'] = df['work_year'].astype(int)

def remote_category(ratio):
    if ratio == 100:
        return 'Remote'
    elif ratio == 0:
        return 'Onsite'
    else:
        return 'Hybrid'

df['is_remote'] = df['remote_ratio'].apply(remote_category)
print("\nis_remote 分布：")
print(df['is_remote'].value_counts())

# ==================== 6. 字段衍生 ====================
df['job_level'] = df['experience_level'] + '_' + df['job_title']
print("\n前10个 job_level 示例：")
print(df['job_level'].head(10))

# 薪资档次（可选）
df['salary_band'] = pd.cut(df['salary_in_usd'], 
                           bins=[0, 80000, 120000, 180000, 1000000], 
                           labels=['Low (<80k)', 'Mid (80-120k)', 'High (120-180k)', 'Very High (>180k)'])

# ==================== 7. 筛选出用于对比的数据（去掉混合模式） ====================
df_compare = df[df['is_remote'].isin(['Remote', 'Onsite'])].copy()
print(f"\n用于对比的数据行数：{len(df_compare)}")

# ==================== 8. 聚合统计（计算每个岗位-级别下的远程与非远程平均薪资及溢价） ====================
grouped = df_compare.groupby(['job_level', 'is_remote'])['salary_in_usd'].agg(['mean', 'count']).reset_index()
pivot = grouped.pivot(index='job_level', columns='is_remote', values='mean').reset_index()
pivot.columns = ['job_level', 'avg_salary_onsite', 'avg_salary_remote']
pivot = pivot.dropna().copy()
pivot['premium_pct'] = (pivot['avg_salary_remote'] - pivot['avg_salary_onsite']) / pivot['avg_salary_onsite'] * 100

# 添加样本量信息
count_onsite = grouped[grouped['is_remote']=='Onsite'][['job_level', 'count']].rename(columns={'count':'count_onsite'})
count_remote = grouped[grouped['is_remote']=='Remote'][['job_level', 'count']].rename(columns={'count':'count_remote'})
pivot = pivot.merge(count_onsite, on='job_level', how='left')
pivot = pivot.merge(count_remote, on='job_level', how='left')

# 筛选样本量足够的岗位
pivot = pivot[(pivot['count_onsite'] >= 5) & (pivot['count_remote'] >= 5)]
pivot = pivot.sort_values('premium_pct', ascending=False)

high_premium = pivot[pivot['premium_pct'] >= 20]
print(f"\n溢价超过20%的岗位数量：{len(high_premium)}")
print(high_premium[['job_level', 'avg_salary_onsite', 'avg_salary_remote', 'premium_pct']])

# ==================== 9. 按年份计算溢价趋势 ====================
yearly_grouped = df_compare.groupby(['work_year', 'job_level', 'is_remote'])['salary_in_usd'].mean().reset_index()
yearly_pivot = yearly_grouped.pivot_table(index=['work_year', 'job_level'], columns='is_remote', values='salary_in_usd').reset_index()
yearly_pivot.columns = ['work_year', 'job_level', 'avg_onsite', 'avg_remote']
yearly_pivot = yearly_pivot.dropna()
yearly_pivot['premium_pct'] = (yearly_pivot['avg_remote'] - yearly_pivot['avg_onsite']) / yearly_pivot['avg_onsite'] * 100

print("\n2025年溢价最高的5个岗位：")
print(yearly_pivot[yearly_pivot['work_year']==2025].sort_values('premium_pct', ascending=False).head())

# ==================== 10. 保存清洗后的数据 ====================
df.to_csv('cleaned_salaries_full.csv', index=False)
df_compare.to_csv('cleaned_remote_onsite.csv', index=False)
pivot.to_csv('premium_by_job_level.csv', index=False)

print("\n数据保存完成！")

# 生成用于前端的数据文件（包含所有必要字段）
import json

# 读取 cleaned_remote_onsite.csv（只含 Remote 和 Onsite）
df_front = pd.read_csv('cleaned_remote_onsite.csv')

# 选择需要传到前端的列
front_cols = ['work_year', 'experience_level', 'job_title', 'job_level', 
              'is_remote', 'salary_in_usd', 'company_size']
df_front_selected = df_front[front_cols]

# 转换为字典列表
front_data = df_front_selected.to_dict(orient='records')

# 同时读取溢价表（用于静态展示，但为了联动，我们可以不用它，改用前端动态计算）
premium_df = pd.read_csv('premium_by_job_level.csv')
premium_data = premium_df.to_dict(orient='records')

# 写入 data.js
with open('data.js', 'w', encoding='utf-8') as f:
    f.write('// 自动生成的数据文件\n')
    f.write('const rawData = ' + json.dumps(front_data, ensure_ascii=False) + ';\n')
    f.write('const premiumData = ' + json.dumps(premium_data, ensure_ascii=False) + ';\n')

print("已生成 data.js，包含字段：", front_cols)