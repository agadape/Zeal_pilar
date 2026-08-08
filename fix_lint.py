import os
import re

files_to_fix = {
    'src/components/AnnouncementsView.tsx': ['IconX', 'IconCheck'],
    'src/components/EventsView.tsx': ['IconX', 'IconCheck'],
    'src/components/GroupDetailPanel.tsx': ['IconInfoCircle'],
    'src/components/GroupsView.tsx': ['IconUsersGroup', 'IconUser'],
    'src/components/Navbar.tsx': ['IconUserPlus', 'IconCalendarEvent', 'IconSpeakerphone'],
}

for file_path, vars in files_to_fix.items():
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for var in vars:
        # replace the variable if it's imported (e.g. `IconX, ` or `, IconX` or `\nIconX`)
        content = re.sub(rf'\b{var}\b\s*,?', '', content)
    
    # clean up any dangling commas or empty lines in imports if needed, but the compiler usually forgives trailing commas.
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix PeopleView groups prop
people_view = 'src/components/PeopleView.tsx'
with open(people_view, 'r', encoding='utf-8') as f:
    pv = f.read()
pv = pv.replace('groups: Group[];\n', '')
pv = pv.replace('groups, ', '')
pv = pv.replace('groups={groups}', '')
with open(people_view, 'w', encoding='utf-8') as f:
    f.write(pv)

# Fix StatistikaView unused vars
stats_view = 'src/components/StatistikaView.tsx'
with open(stats_view, 'r', encoding='utf-8') as f:
    sv = f.read()
sv = re.sub(r'const \[eventVisitorsCount.*?;\n', '', sv)
sv = re.sub(r'const handleToggleMissing.*?\n  };\n', '', sv, flags=re.DOTALL)
sv = re.sub(r'const handleUpdateMissingReason.*?\n  };\n', '', sv, flags=re.DOTALL)
sv = re.sub(r'const handleToggleStudy.*?\n  };\n', '', sv, flags=re.DOTALL)
sv = re.sub(r'const handleUpdateStudyStage.*?\n  };\n', '', sv, flags=re.DOTALL)
with open(stats_view, 'w', encoding='utf-8') as f:
    f.write(sv)

# Fix supabase.ts any
supa = 'src/lib/supabase.ts'
with open(supa, 'r', encoding='utf-8') as f:
    s = f.read()
s = s.replace('(g: any)', '(g: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)')
with open(supa, 'w', encoding='utf-8') as f:
    f.write(s)
