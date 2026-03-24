import os, re
d = r'C:\\Users\\anyth\\Documents\\GitHub\\FIML-SUITE\\modules'
files = [f for f in os.listdir(d) if f.endswith('.html')]
changes = 0
for f in files:
    fp = os.path.join(d, f)
    with open(fp, 'r', encoding='utf-8') as file:
        content = file.read()
    if 'export chat' in content.lower():
        continue
    def repl(m):
        btn_id = m.group(1)
        pref = btn_id.replace('-brain-clear', '')
        return f'<button class="builder-btn" id="{btn_id}">Clear conversation</button>\\n        <button class="builder-btn" id="{pref}-brain-export">Export chat</button>'
    new_content, count = re.subn(r'<button class="builder-btn" id="([a-zA-Z0-9_-]+-brain-clear)">Clear conversation</button>', repl, content)
    if count > 0:
        with open(fp, 'w', encoding='utf-8') as file:
            file.write(new_content)
        changes += 1

# Also check frontend-deploy-staging/modules?
d2 = r'C:\\Users\\anyth\\Documents\\GitHub\\FIML-SUITE\\frontend-deploy-staging\\modules'
if os.path.exists(d2):
    files2 = [f for f in os.listdir(d2) if f.endswith('.html')]
    for f in files2:
        fp = os.path.join(d2, f)
        with open(fp, 'r', encoding='utf-8') as file:
            content = file.read()
        if 'export chat' in content.lower():
            continue
        new_content, count = re.subn(r'<button class="builder-btn" id="([a-zA-Z0-9_-]+-brain-clear)">Clear conversation</button>', repl, content)
        if count > 0:
            with open(fp, 'w', encoding='utf-8') as file:
                file.write(new_content)
            changes += 1

print(f'Updated {changes} files')
