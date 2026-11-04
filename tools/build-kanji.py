#!/usr/bin/env python3
"""Build offline stroke data and conservative subset mappings from KanjiVG.
Usage: python tools/build-kanji.py /path/to/kanjivg
Derived stroke paths and subset correspondence data: CC BY-SA 3.0.
"""
import csv,json,re,sys,xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[1];SOURCE=Path(sys.argv[1]);OUT=ROOT/'assets/kanji'
counts={line.split('\t')[0]:int(line.split('\t')[1]) for line in (OUT/'joyo-2010.tsv').read_text().splitlines() if line and not line.startswith('#')}
def attr(node,key):return next((v for k,v in node.attrib.items() if k.split('}')[-1]==key),'')
def paths(node):return [p for p in node.iter() if p.tag.endswith('path') and re.search(r'-s\d+$',attr(p,'id'))]
def numbers(node):return sorted(int(attr(p,'id').rsplit('-s',1)[1]) for p in paths(node))
# Relative to that component's own numbered strokes. Only reviewed deletions;
# all component strokes retain their original location and are never rearranged.
RULES={
 '日':[('口',[1,2,4]),('二',[3,4])],
 '目':[('口',[1,2,5]),('日',[1,2,3,5]),('日',[1,2,4,5]),('二',[3,4]),('二',[3,5]),('二',[4,5]),('三',[3,4,5])],
 '田':[('口',[1,2,5]),('日',[1,2,3,5]),('十',[3,4]),('土',[3,4,5])],
 '王':[('工',[1,2,4]),('土',[2,3,4]),('十',[2,3]),('二',[1,3]),('二',[1,4]),('二',[3,4]),('三',[1,3,4])],
 '玉':[('王',[1,2,3,4])], '木':[('十',[1,2])], '大':[('人',[2,3])], '太':[('大',[1,2,3])],
 '天':[('大',[2,3,4])], '夫':[('大',[2,3,4])], '白':[('日',[2,3,4,5])],
 '自':[('目',[2,3,4,5,6])], '中':[('口',[1,2,3])],
 '土':[('十',[1,2]),('二',[1,3])], '士':[('十',[1,2]),('二',[1,3])],
 '三':[('二',[1,2]),('二',[1,3]),('二',[2,3])], '二':[('一',[1]),('一',[2])],
 '正':[('止',[2,3,4,5])], '立':[('二',[2,5])], '生':[('土',[3,4,5])],
 '十':[('一',[1])], '上':[('一',[2]),('一',[3])], '下':[('一',[1])]
}
# Canonical root/group labels are accepted only at their full correct stroke count.
# Radical forms such as 氵, 亻 and 灬 are NOT replaced by 水, 人 or 火.
def stroke_kinds(path):return set(re.sub(r'[a-zA-Z0-9]', '', attr(path,'type')).split('/'))
canonical={}
for c in counts:
 filename=f'{ord(c):05x}'+('-Hyougai' if c=='衷' else '')+'.svg'
 root=ET.parse(SOURCE/'kanji'/filename).getroot();ps=paths(root);ps.sort(key=lambda p:int(attr(p,'id').rsplit('-s',1)[1]));canonical[c]=[stroke_kinds(p) for p in ps]
data={};conflicts=[]
for char,count in counts.items():
 filename=f'{ord(char):05x}'+('-Hyougai' if char=='衷' else '')+'.svg'
 root=ET.parse(SOURCE/'kanji'/filename).getroot();ps=paths(root)
 assert len(ps)==count,(char,count,len(ps))
 ps.sort(key=lambda p:int(attr(p,'id').rsplit('-s',1)[1]));base=[attr(p,'d') for p in ps]
 candidates=defaultdict(set);sources={};queue=[]
 def add(target,ids,method):
  key=tuple(sorted(set(ids)))
  if target not in counts or len(key)!=counts[target] or not key:return
  if any(n<1 or n>count for n in key):return
  canonical_order=all(stroke_kinds(ps[number-1]) & target_kind for number,target_kind in zip(key,canonical[target]))
  if method in ('component','component-parts') and not canonical_order:return
  old=target in candidates[key];candidates[key].add(target)
  if not old:
   if canonical_order:queue.append((target,list(key)))
   sources[(key,target)]=method
 add(char,list(range(1,count+1)),'whole')
 parts=defaultdict(list)
 for g in root.iter():
  if not g.tag.endswith('g'):continue
  element=attr(g,'element');target='口' if element=='囗' else element
  if attr(g,'radicalForm')=='true':continue
  # A common-kanji variant is accepted only if every whole stroke has the canonical type.
  # We never substitute kvg:original for non-kanji radical labels.
  ids=numbers(g)
  if attr(g,'part'):
   parts[target].append(ids);continue
  if attr(g,'partial')=='true':continue
  add(target,ids,'component')
 for target,groups in parts.items():
  if len(groups)>=2:add(target,sorted(set(n for ids in groups for n in ids)),'component-parts')
 for p in ps:
  if attr(p,'type').startswith('㇐'):add('一',[int(attr(p,'id').rsplit('-s',1)[1])],'horizontal')
 index=0
 while index<len(queue):
  component,ids=queue[index];index+=1
  for target,relative in RULES.get(component,[]):
   if max(relative)<=len(ids):add(target,[ids[i-1] for i in relative],'reviewed-rule')
 mappings=[]
 for key,targets in candidates.items():
  if len(targets)>1:
   if key==tuple(range(1,count+1)):targets={char}
   else:conflicts.append([char,list(key),sorted(targets)]);continue
  target=next(iter(targets));mappings.append({'strokes':list(key),'result':target,'source':sources[(key,target)]})
 mappings.sort(key=lambda row:(len(row['strokes']),row['strokes']))
 data[char]={'count':count,'paths':base,'mappings':mappings}
# The user's three explicit examples are stable acceptance fixtures.
for ids,target in [([1,2,3,4],'日'),([5,6,7,8],'月'),([1,2,4],'口')]:assert any(m['strokes']==ids and m['result']==target for m in data['明']['mappings'])
meta={'joyo':len(data),'totalMappings':sum(len(v['mappings']) for v in data.values()),'parentsWithParts':sum(any(len(m['strokes'])<v['count'] and len(m['strokes'])>1 for m in v['mappings']) for v in data.values()),'conflictsExcluded':len(conflicts),'maxStrokes':max(counts.values()),'kanjiVGCommit':'70a0b7ae0c18ceb5cb358274b029cce0234a43bc'}
payload={'meta':meta,'characters':data};(OUT/'strokes.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n')
(ROOT/'rpg-kanji-data.js').write_text('/* KanjiVG-derived paths and mappings, CC BY-SA 3.0. See assets/kanji/README.md. */\n(function(root){const data='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.RPGKanjiData=data;})(typeof window!=="undefined"?window:globalThis);\n')
with (OUT/'stroke-map.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.writer(f);writer.writerow(['元の常用漢字','総画数','選択する画番号','結果の漢字','消費MP','根拠'])
 for char,record in data.items():
  for m in record['mappings']:writer.writerow([char,record['count'],' '.join(map(str,m['strokes'])),m['result'],len(m['strokes']),m['source']])
(OUT/'excluded-conflicts.json').write_text(json.dumps(conflicts,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(meta,ensure_ascii=False));print('data bytes:',(ROOT/'rpg-kanji-data.js').stat().st_size)
