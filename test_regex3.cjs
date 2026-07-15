const flat = "Maksud/Tujuan : Perjalanan Dinas Dalam Daerah untuk verifikasi dan Validasi Permohonan Proposal di Kampung Batu Putih dan Koordinasi Kegiatan Pelatihan di Kecamatan Biduk-Biduk Tempat Berangkat : Tanjung Redeb";

const markers = [
    { key: 'untuk', regex: /(?:Untuk|UNTUK|Keperluan|KEPERLUAN|Maksud|MAKSUD)(?:\s*\/\s*(?:Tujuan|TUJUAN))?(?:\s*[:：;\|])?\s*/g },
    { key: 'tempat_berangkat', regex: /(?:Tempat\s*Berangkat|Berangkat\s*dari|Tempat\s*Asal)(?:\s*[:：;\|])?\s*/gi }
];

const found = [];
for (const mk of markers) {
  const regex = new RegExp(mk.regex.source, 'g' + (mk.regex.ignoreCase ? 'i' : ''));
  let m;
  while ((m = regex.exec(flat)) !== null) {
    found.push({ key: mk.key, matchStart: m.index, valueStart: m.index + m[0].length });
  }
}
found.sort((a, b) => a.matchStart - b.matchStart);

const fieldMap = {};
for (let i = 0; i < found.length; i++) {
  const entry = found[i];
  const valueEnd = (i + 1 < found.length) ? found[i + 1].matchStart : flat.length;
  const value = flat.substring(entry.valueStart, valueEnd).trim();
  if (!fieldMap[entry.key]) fieldMap[entry.key] = [];
  fieldMap[entry.key].push(value);
}

console.log(fieldMap['untuk']);
