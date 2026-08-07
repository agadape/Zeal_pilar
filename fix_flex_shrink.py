import os, re

directory = r'D:\Zeal\Tugu\src\components'
files = ['AnnouncementsView.tsx', 'EventsView.tsx', 'GroupsView.tsx', 'PeopleView.tsx']

for f in files:
    path = os.path.join(directory, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace:
    # <div className="relative w-full max-w-md sm:max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
    #
    # With:
    # <div className="relative w-full max-w-md sm:max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 animate-slide-in-right overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
    
    pattern = re.compile(
        r'<div className="relative w-full max-w-md sm:max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">',
        re.MULTILINE
    )
    
    def repl(m):
        return '<div className="relative w-full max-w-md sm:max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 animate-slide-in-right overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">'
        
    new_content = pattern.sub(repl, content)
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(new_content)
        
print('Done!')
