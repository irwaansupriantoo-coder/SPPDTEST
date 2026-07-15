import re
text = open('sheet1_dump.txt', 'rb').read().decode('utf-8')
print('35:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>35</v></c>', text))
