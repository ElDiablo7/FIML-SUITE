import os

d = r'C:\\Users\\anyth\\Documents\\GitHub\\FIML-SUITE\\modules'
files = [f for f in os.listdir(d) if f.endswith('.html')]
changes = 0
for f in files:
    fp = os.path.join(d, f)
    with open(fp, 'r', encoding='utf-8') as file:
        content = file.read()
    if r'\n' in content:
        new_content = content.replace(r'\n        <button class="builder-btn"', '\n        <button class="builder-btn"')
        if new_content != content:
            with open(fp, 'w', encoding='utf-8') as file:
                file.write(new_content)
            changes += 1

d2 = r'C:\\Users\\anyth\\Documents\\GitHub\\FIML-SUITE\\frontend-deploy-staging\\modules'
if os.path.exists(d2):
    files2 = [f for f in os.listdir(d2) if f.endswith('.html')]
    for f in files2:
        fp = os.path.join(d2, f)
        with open(fp, 'r', encoding='utf-8') as file:
            content = file.read()
        if r'\n' in content:
            new_content = content.replace(r'\n        <button class="builder-btn"', '\n        <button class="builder-btn"')
            if new_content != content:
                with open(fp, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                changes += 1

print(f'Fixed {changes} files')
