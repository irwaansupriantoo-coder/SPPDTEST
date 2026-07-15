import re
text = open('sheet1_dump.txt', 'rb').read().decode('utf-8')
cells = re.findall(r'<c r="[A-Z0-9]+".*?>.*?</c>', text)
with open('cells.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(cells))
