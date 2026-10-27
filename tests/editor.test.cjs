const{test}=require('node:test');const assert=require('node:assert/strict');
const{LEVELS,Game,validateStage,buildMask}=require('../engine.js');
const{StageDocument,StageStore,encodeStage,decodeStage}=require('../editor.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const valid=()=>clone(LEVELS[0]);
const storage=()=>{const map=new Map();return{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v)};};
const glyph=(c,size)=>{const a=new Uint8Array(size*size);for(let x=0;x<size;x++)a[Math.floor(size/2)*size+x]=255;return buildMask(size,size,a);};
test('built-in stages also satisfy authoring validation',()=>{for(const level of LEVELS)assert(validateStage(level,glyph).ok,level.title);});
test('stage documents support terrain edits, undo and redo without changing source levels',()=>{
 const original=valid(),doc=new StageDocument(original);doc.change(d=>d.regions.push({x:350,y:400,w:100,h:50}));assert.equal(doc.data.regions.length,3);assert.equal(original.regions.length,2);
 assert(doc.undo());assert.equal(doc.data.regions.length,2);assert(doc.redo());assert.equal(doc.data.regions.length,3);doc.undo();doc.change(d=>d.title='別の編集');assert.equal(doc.redo(),false);
});
test('invalid terrain, coordinates, rule words and unsupported formats are rejected',()=>{
 for(const edit of [d=>d.regions=[],d=>d.regions[0].w=1001,d=>d.regions[0].x=-1,d=>d.start=[400,420],d=>d.goal=[600,250],d=>d.letter=[-200,200,180],d=>d.letter=[400,500,200],d=>d.word='猫',d=>d.baseJumps=Infinity,d=>d.title='']){
  const level=valid();edit(level);assert.equal(validateStage(level).ok,false,JSON.stringify(level));
 }
 assert.equal(decodeStage('bad json').ok,false);assert.equal(decodeStage(JSON.stringify({format:'kotonoha-stage',version:2,stage:valid()})).ok,false);assert.equal(decodeStage('a'.repeat(100001)).ok,false);
});
test('export/import preserves the map and fixed rule slot and strips untrusted metadata',()=>{
 const level=valid();level.title='<test> 自作';level.untrusted={script:'ignore me'};const encoded=encodeStage(level);assert(encoded.ok);const decoded=decodeStage(encoded.text);assert(decoded.ok);assert.deepEqual(decoded.level.regions,level.regions);assert.deepEqual(decoded.level.letter,level.letter);assert.equal(decoded.level.title,level.title);assert.equal(decoded.level.untrusted,undefined);
});
test('save, update, reload, delete and restore preserve other authored stages',()=>{
 const memory=storage(),store=new StageStore(memory);const a=store.save({...valid(),title:'A'}),b=store.save({...valid(),title:'B'});assert(a.ok&&b.ok);assert.notEqual(a.record.id,b.record.id);
 assert(store.save({...valid(),title:'A改'},a.record.id).ok);const restoredStore=new StageStore(memory);assert.deepEqual(restoredStore.read().records.map(r=>r.stage.title),['A改','B']);
 const deleted=store.remove(a.record.id);assert(deleted.ok);assert.equal(store.read().records.length,1);assert(store.restore(deleted.record).ok);assert.equal(store.read().records.length,2);
});
test('storage failures and corrupt records never silently overwrite prior data',()=>{
 const full=new StageStore({getItem:()=>null,setItem:()=>{throw Error('quota');}});assert.equal(full.save(valid()).ok,false);
 const memory=storage(),store=new StageStore(memory);memory.setItem(store.key,'invalid JSON');assert.equal(store.read().ok,false);assert.equal(store.save(valid()).ok,false);assert.equal(memory.getItem(store.key),'invalid JSON');
});
test('invalid imports and custom stages preserve the running game',()=>{
 const game=new Game(0,glyph),before={word:game.word,player:{...game.player},glyph:game.placed[0]};assert.equal(game.loadCustom({...valid(),word:'猫'}).ok,false);assert.equal(game.word,before.word);assert.deepEqual(game.player,before.player);assert.equal(game.placed[0],before.glyph);
});
test('playtesting has independent geometry and does not mutate the authoring draft',()=>{
 const source=valid(),doc=new StageDocument(source),game=new Game(0,glyph);assert(game.loadCustom(doc.data).ok);assert.equal(game.index,-1);assert(game.applyRule('十').ok);assert.equal(doc.data.word,'三');assert.equal(game.word,'十');game.level.regions[0].w=200;assert.equal(doc.data.regions[0].w,300);
});
test('custom stage glyph geometry is checked before it can be saved for play',()=>{
 const source=valid();source.letter=[150,300,180];assert.equal(validateStage(source,glyph).ok,true); // its midline is above the floor
 source.letter=[150,310,180];source.regions[0].y=390;source.regions[0].h=110;source.start[1]=390;
 assert.equal(validateStage(source,glyph).ok,false);
});

test('a body-size rule cannot embed a reset traveler in a ceiling',()=>{
 const source=clone(LEVELS[1]);source.regions.push({x:50,y:375,w:100,h:20});const game=new Game(0,glyph);assert(game.loadCustom(source).ok);const before=game.word;assert.equal(game.applyRule('長').ok,false);assert.equal(game.word,before);assert.equal(game.player.h,30);
 const high=valid();high.ruleKind='body';high.word='長';high.start=[65,40];high.regions[0]={x:0,y:40,w:300,h:460};assert.equal(validateStage(high).ok,false);
});

test('custom rule text survives save and assignment and unsupported sentences are rejected',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const store=new StageStore(storage),source=JSON.parse(JSON.stringify(LEVELS[0]));
  source.ruleText='合計［字］回ジャンプできる。';
  assert.equal(store.assign(2,source).ok,true);
  assert.equal(new StageStore(storage).assigned(2).ruleText,source.ruleText);
  assert.equal(new StageStore(storage).assigned(1),null);
  const game=new Game(0);game.loadCustom(store.assigned(2));
  assert.equal(game.rules.jumpCount,3);
  assert.equal(game.rule.sentence,'合計三回ジャンプできる。');
  source.ruleText='空が［字］になる。';
  assert.equal(store.assign(2,source).ok,false);
  assert.equal(store.assigned(2).ruleText,'合計［字］回ジャンプできる。');
  assert.equal(store.assign(2,null).ok,true);
  assert.equal(store.assigned(2),null);
});
