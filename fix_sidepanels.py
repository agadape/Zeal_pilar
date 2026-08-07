import os, re

directory = r'D:\Zeal\Tugu\src\components'
files = ['AnnouncementsView.tsx', 'EventsView.tsx', 'GroupsView.tsx', 'PeopleView.tsx']

for f in files:
    path = os.path.join(directory, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace:
    # <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
    #   <div className="tugu-card w-full max-w-lg rounded-3xl p-6 border border-slate-200 space-y-6 animate-fade-in bg-white shadow-xl overflow-y-auto max-h-[90vh] w-full custom-scrollbar">
    #
    # With:
    # <div className="fixed inset-0 z-[100] flex justify-end">
    #   <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"></div>
    #   <div className="relative w-full max-w-md sm:max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
    
    pattern = re.compile(
        r'<div className="fixed inset-0 z-\[100\] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">\s*<div className="tugu-card w-full max-w-lg rounded-3xl p-6 border border-slate-200 space-y-6 animate-fade-in bg-white shadow-xl overflow-y-auto max-h-\[90vh\] w-full custom-scrollbar">',
        re.MULTILINE
    )
    
    def repl(m):
        return (
            '<div className="fixed inset-0 z-[100] flex justify-end">\n'
            '          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"></div>\n'
            '          <div className="relative w-full max-w-md sm:max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">'
        )
        
    new_content = pattern.sub(repl, content)
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(new_content)
        
print('Done!')
