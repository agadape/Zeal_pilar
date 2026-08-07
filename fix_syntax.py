import os, re

directory = r'D:\Zeal\Tugu\src\components'
files = ['AnnouncementsView.tsx', 'EventsView.tsx', 'GroupsView.tsx', 'PeopleView.tsx']

for f in files:
    path = os.path.join(directory, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace:
    # </div>
    # </div>
    # </div>
    # )}
    # With:
    # </div>
    # </div>
    # )}
    
    pattern = re.compile(
        r'</div>\s*</div>\s*</div>\s*\)}',
        re.MULTILINE
    )
    
    def repl(m):
        return '</div>\n          </div>\n        )}'
        
    new_content = pattern.sub(repl, content)
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(new_content)
print('Done!')
