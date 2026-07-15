import re
text = open('sheet1_dump.txt', 'rb').read().decode('utf-8')
print('36:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>36</v></c>', text))
print('42:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>42</v></c>', text))
print('17:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>17</v></c>', text))
print('18:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>18</v></c>', text))
print('19:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>19</v></c>', text))
print('20:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>20</v></c>', text))
print('23:', re.findall(r'<c r="[A-Z0-9]+"[^>]*><v>23</v></c>', text))
