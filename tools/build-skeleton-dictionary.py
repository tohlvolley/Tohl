#!/usr/bin/env python3
"""Build a <=7-letter kana index from an unmodified jmdict-simplified JSON release."""
import argparse, hashlib, json, re, unicodedata
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--output',default='assets/skeleton/dictionary.json');a=p.parse_args()
raw=Path(a.source).read_bytes();data=json.loads(raw)
def hira(text):
 text=unicodedata.normalize('NFC',text)
 return ''.join(chr(ord(c)-0x60) if '\u30a1'<=c<='\u30f6' else c for c in text)
words=sorted({hira(k['text']) for entry in data['words'] for k in entry['kana'] if 2<=len(hira(k['text']))<=7 and re.fullmatch('[ぁ-ゖー]+',hira(k['text']))})
result={'format':'kana-skeleton-jmdict','version':1,'dictionary':'JMdict / EDRDG','dictionaryDate':data['dictDate'],'release':'3.6.2+20261102210542','source':'https://github.com/scriptin/jmdict-simplified/releases/tag/3.6.2%2B20261102210542','upstream':'https://www.edrdg.org/jmdict/j_jmdict.html','license':'https://www.edrdg.org/edrdg/licence.html','sourceSha256':hashlib.sha256(raw).hexdigest(),'wordCount':len(words),'words':words}
Path(a.output).write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='words'},ensure_ascii=False))
