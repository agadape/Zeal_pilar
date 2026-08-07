import os, re

directory = r'D:\Zeal\Tugu\src\components'
files = ['AnnouncementsView.tsx', 'EventsView.tsx', 'GroupsView.tsx', 'PeopleView.tsx']

for f in files:
    path = os.path.join(directory, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace:
    # <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
    #   <div className="flex items-start justify-center min-h-full py-10 px-4 sm:px-6">
    #     <div className="tugu-card [whatever] relative h-fit">
    #
    # With:
    # <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10 px-4 sm:px-6 flex flex-col items-center">
    #   <div className="tugu-card [whatever] relative shrink-0 my-auto">
    
    pattern = re.compile(
        r'<div className="fixed inset-0 z-\[100\] bg-slate-900/60 backdrop-blur-sm overflow-y-auto">\s*<div className="flex items-start justify-center min-h-full py-10 px-4 sm:px-6">\s*<div className="tugu-card([^"]+)relative h-fit">',
        re.MULTILINE
    )
    
    def repl(m):
        card_classes = m.group(1)
        outer = '<div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10 px-4 sm:px-6 flex flex-col items-center">'
        card = f'<div className="tugu-card{card_classes}relative shrink-0 my-auto">'
        return f'{outer}\n            {card}'
        
    new_content = pattern.sub(repl, content)
    
    # We also need to remove the extra closing </div>!
    # Because we removed one wrapping div, there will be one extra closing </div>.
    # Actually, fixing closing tags via regex is hard.
    # Let's just KEEP the inner div, but make it a transparent passthrough, OR change its classes to be the flex-col container!
    
    pattern2 = re.compile(
        r'<div className="fixed inset-0 z-\[100\] bg-slate-900/60 backdrop-blur-sm overflow-y-auto">\s*<div className="flex items-start justify-center min-h-full py-10 px-4 sm:px-6">\s*<div className="tugu-card([^"]+)relative h-fit">',
        re.MULTILINE
    )
    
    def repl2(m):
        card_classes = m.group(1)
        # Keep the two divs to not break React JSX closing tags!
        outer = '<div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm">'
        inner = '<div className="fixed inset-0 overflow-y-auto py-10 px-4 sm:px-6 flex flex-col items-center">'
        card = f'<div className="tugu-card{card_classes}relative shrink-0 my-auto">'
        return f'{outer}\n            {inner}\n              {card}'
        
    new_content = pattern2.sub(repl2, content)
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(new_content)
print('Done!')
