import re
with open('app.js', encoding='utf-8') as f:
    js = f.read()
ids = re.findall(r"document\.getElementById\('([^']+)'\)", js)
with open('index.html', encoding='utf-8') as f:
    html = f.read()
missing = [i for i in ids if f'id="{i}"' not in html]
print('Missing IDs:', missing)
