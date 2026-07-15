import zipfile
z = zipfile.ZipFile('public/Kwitansi_Dalam_Daerah.xlsx')
with open('sheet1_dump.txt', 'wb') as f:
  f.write(z.read('xl/worksheets/sheet1.xml'))
with open('drawing1_dump.txt', 'wb') as f:
  f.write(z.read('xl/drawings/drawing1.xml'))
