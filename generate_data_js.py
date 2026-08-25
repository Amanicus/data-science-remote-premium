import os
import pandas as pd
import json

# 获取当前脚本所在目录
script_dir = os.path.dirname(os.path.abspath(__file__))

# 读取已经清洗好的数据（注意文件在 data/ 子目录下）
df_front = pd.read_csv(os.path.join(script_dir, 'data', 'cleaned_remote_onsite.csv'))

# 选择需要传到前端的列
front_cols = ['work_year', 'experience_level', 'job_title', 'job_level', 
              'is_remote', 'salary_in_usd', 'company_size']
df_front_selected = df_front[front_cols]

# 转换为字典列表
front_data = df_front_selected.to_dict(orient='records')

# 同时读取溢价表
premium_df = pd.read_csv(os.path.join(script_dir, 'data', 'premium_by_job_level.csv'))
premium_data = premium_df.to_dict(orient='records')

# 写入 data.js，放在 data 文件夹下
data_dir = os.path.join(script_dir, 'data')
os.makedirs(data_dir, exist_ok=True)

# 生成 data.js 文件内容
js_content = "// 自动生成的数据文件，请勿手动编辑\n"
js_content += "// 生成来源：cleaned_remote_onsite.csv + premium_by_job_level.csv\n\n"
js_content += "const rawData = " + json.dumps(front_data, indent=2, default=str) + ";\n\n"
js_content += "const premiumData = " + json.dumps(premium_data, indent=2, default=str) + ";\n"

with open(os.path.join(data_dir, 'data.js'), 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"✅ data.js 生成成功！共 {len(front_data)} 条记录，{len(premium_data)} 条溢价数据。")