import re

page_ts = 'src/app/page.tsx'
with open(page_ts, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('stats={stats}onNavigate={setActiveTab}', 'groups={groups} stats={stats} onNavigate={setActiveTab}')

with open(page_ts, 'w', encoding='utf-8') as f:
    f.write(content)

stats_view = 'src/components/StatistikaView.tsx'
with open(stats_view, 'r', encoding='utf-8') as f:
    sv = f.read()
sv = re.sub(r'\bStudyProgress\b\s*,?', '', sv)
with open(stats_view, 'w', encoding='utf-8') as f:
    f.write(sv)
