import os, re

directory = r'D:\Zeal\Tugu\src\components'
files = ['AnnouncementsView.tsx', 'EventsView.tsx', 'GroupsView.tsx', 'PeopleView.tsx']

for f in files:
    path = os.path.join(directory, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace:
    # <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm">
    #   <div className="fixed inset-0 overflow-y-auto py-10 px-4 sm:px-6 flex flex-col items-center">
    #     <div className="tugu-card [whatever] shrink-0 my-auto">
    #
    # With:
    # <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
    #   <div className="tugu-card [whatever] overflow-y-auto max-h-[90vh] custom-scrollbar">
    
    pattern = re.compile(
        r'<div className="fixed inset-0 z-\[100\] bg-slate-900/60 backdrop-blur-sm">\s*<div className="fixed inset-0 overflow-y-auto py-10 px-4 sm:px-6 flex flex-col items-center">\s*<div className="tugu-card([^"]+)relative shrink-0 my-auto">',
        re.MULTILINE
    )
    
    def repl(m):
        card_classes = m.group(1).replace('relative shrink-0 my-auto', '').strip()
        outer = '<div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">'
        card = f'<div className="tugu-card {card_classes} overflow-y-auto max-h-[90vh] w-full custom-scrollbar">'
        return f'{outer}\n            {card}'
        
    new_content = pattern.sub(repl, content)
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(new_content)
        
print('Done!')
