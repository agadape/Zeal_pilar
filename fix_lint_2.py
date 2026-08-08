import os
import re

# Fix page.tsx
page_ts = 'src/app/page.tsx'
with open(page_ts, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused type imports
content = re.sub(r'\bMinistryEvent\b\s*,?', '', content)
content = re.sub(r'\bAnnouncement\b\s*,?', '', content)

# Remove unused API imports
content = re.sub(r'\bfetchEvents\b\s*,?', '', content)
content = re.sub(r'\bsaveEvent\b\s*,?', '', content)
content = re.sub(r'\bdeleteEvent\b\s*,?', '', content)
content = re.sub(r'\bfetchAnnouncements\b\s*,?', '', content)
content = re.sub(r'\bsaveAnnouncement\b\s*,?', '', content)
content = re.sub(r'\bdeleteAnnouncement\b\s*,?', '', content)

# Remove props passed to DashboardView
content = re.sub(r'\s*events=\{events\}\s*', '', content)
content = re.sub(r'\s*announcements=\{announcements\}\s*', '', content)

with open(page_ts, 'w', encoding='utf-8') as f:
    f.write(content)


# Fix DashboardView definition (if it expects events/announcements, we might need to remove them from props there too)
dash_ts = 'src/components/DashboardView.tsx'
with open(dash_ts, 'r', encoding='utf-8') as f:
    dash = f.read()
dash = re.sub(r'events: MinistryEvent\[\];', '', dash)
dash = re.sub(r'announcements: Announcement\[\];', '', dash)
dash = re.sub(r'events,\s*', '', dash)
dash = re.sub(r'announcements,\s*', '', dash)
with open(dash_ts, 'w', encoding='utf-8') as f:
    f.write(dash)


# Fix PeopleView
people_view = 'src/components/PeopleView.tsx'
with open(people_view, 'r', encoding='utf-8') as f:
    pv = f.read()
pv = re.sub(r'\bGroup\b\s*,?', '', pv)
with open(people_view, 'w', encoding='utf-8') as f:
    f.write(pv)


# Fix StatistikaView
stats_view = 'src/components/StatistikaView.tsx'
with open(stats_view, 'r', encoding='utf-8') as f:
    sv = f.read()
sv = re.sub(r'const isStudying = .*?;\n', '', sv)
sv = re.sub(r'const studyStage = .*?;\n', '', sv)
with open(stats_view, 'w', encoding='utf-8') as f:
    f.write(sv)
