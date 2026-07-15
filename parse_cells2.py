text = open('sheet1_dump.txt', 'rb').read().decode('utf-8')
text = text.replace('><', '>\n<')
with open('sheet1_lines.txt', 'w', encoding='utf-8') as f:
    f.write(text)
