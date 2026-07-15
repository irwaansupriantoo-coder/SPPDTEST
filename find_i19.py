import re
text = open('sheet1_dump.txt', 'rb').read().decode('utf-8')
print('I19:', re.findall(r'<c r="I19".*?</c>', text))
print('E19:', re.findall(r'<c r="E19".*?</c>', text))
