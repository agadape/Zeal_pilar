import re

page_ts = 'src/app/page.tsx'
with open(page_ts, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\s*groups=\{groups\}\s*', '\n', content, count=1) # only in PeopleView

with open(page_ts, 'w', encoding='utf-8') as f:
    f.write(content)

stats_view = 'src/components/StatistikaView.tsx'
with open(stats_view, 'r', encoding='utf-8') as f:
    sv = f.read()
sv = re.sub(r'const \[studyProgresses.*?;\n', '', sv)
sv = re.sub(r'setStudyProgresses\(\[\]\);\n', '', sv)
with open(stats_view, 'w', encoding='utf-8') as f:
    f.write(sv)
