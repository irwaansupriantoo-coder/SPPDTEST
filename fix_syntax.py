with open('src/app/utils/exportKwitansiDalamDaerah.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = """      // Hide row 6 entirely if kegiatan doesn't need overflow
      if (!kegNeedsOverflow) {
        sheet1 = sheet1.replace(
          /(<row r="6")/,
          '$1 hidden="1"      // Hide row 8 entirely if sub kegiatan doesn\'t need overflow
      if (!subNeedsOverflow) {
        sheet1 = sheet1.replace(
          /(<row r="8")/,
          '$1 hidden="1"'
        );
      }`;\n        });\n      }"""

new_str = """      // Hide row 6 entirely if kegiatan doesn't need overflow
      if (!kegNeedsOverflow) {
        sheet1 = sheet1.replace(
          /(<row r="6")/,
          '$1 hidden="1"'
        );
      }

      // Hide row 8 entirely if sub kegiatan doesn't need overflow
      if (!subNeedsOverflow) {
        sheet1 = sheet1.replace(
          /(<row r="8")/,
          '$1 hidden="1"'
        );
      }"""

if old_str in content:
    content = content.replace(old_str, new_str)
    with open('src/app/utils/exportKwitansiDalamDaerah.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("String not found")
