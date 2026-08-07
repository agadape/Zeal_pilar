import os, re
directory = r'D:\Zeal\Tugu\src\components'
files = ['AnnouncementsView.tsx', 'EventsView.tsx', 'GroupsView.tsx', 'PeopleView.tsx']
for f in files:
    path = os.path.join(directory, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    pattern = re.compile(
        r'(<div className="fixed inset-0 z-\[100\] bg-slate-900/60 backdrop-blur-sm)">\s*<div className="flex items-center justify-center min-h-screen p-4 sm:p-6">\s*(<div className="tugu-card [^"]+ relative)',
        re.MULTILINE
    )
    
    def repl(m):
        outer = m.group(1) + ' overflow-y-auto">'
        # We replace items-center min-h-screen with min-h-full py-10
        inner = '<div className="flex items-start justify-center min-h-full py-10 px-4 sm:px-6">'
        card = m.group(2) + ' h-fit'
        return f'{outer}\n          {inner}\n            {card}'
        
    new_content = pattern.sub(repl, content)
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(new_content)
print('Done!')
