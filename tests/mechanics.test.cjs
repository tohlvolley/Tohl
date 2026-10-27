const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,LEVELS,evaluateStageRule,validateStage,buildMask}=require('../engine.js');
const {encodeStage,decodeStage,StageStore}=require('../editor.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function stage(extra={}){return {...clone(LEVELS[0]),ruleKind:'none',word:'任',baseJumps:6,...extra};}
function mask(word,size){const a=new Uint8Array(size*size);for(let x=0;x<size;x++)a[Math.floor(size/2)*size+x]=255;return buildMask(size,size,a);}
function custom(extra={}){return stage({ruleKind:'custom',ruleText:'重力の向きが［字］になる。',word:'上',bindings:[{word:'上',property:'gravityDirection',value:'up'}],...extra});}
function tick(g,input={},n=1){for(let i=0;i<n;i++)g.step(1/120,input);}
function load(source){const g=new Game(0,mask),result=g.loadCustom(source);assert.equal(result.ok,true,result.message);return g;}
test('a rule-free slot accepts arbitrary Han characters and keeps base movement rules',()=>{
 const g=load(stage());g.prepareInput();assert.equal(g.placed.length,0);
 assert.equal(g.applyRule('森').ok,true);assert.equal(g.rules.jumpCount,6);assert.equal(g.rules.speed,185);assert.equal(g.placed[0].char,'森');
 assert.equal(g.applyRule('ab').ok,false);assert.equal(g.word,'森');
});
test('large glyphs can cover the stage and overlap terrain while spawn collision is rejected atomically',()=>{
 const g=load(stage({letter:[0,-500,2000]}));g.prepareInput();
 assert.equal(g.applyRule('森').ok,true);assert.equal(g.placed[0].size,2000);
 assert(g.solidAt({x:500,y:499,w:10,h:2}));
 const blocked=load(stage({letter:[0,-600,2000]}));blocked.prepareInput();
 assert.equal(blocked.applyRule('森').ok,false);assert.equal(blocked.placed.length,0);
 assert.equal(validateStage(stage({letter:[0,0,2001]})).ok,false);
});
test('creator bindings compose effects, support wildcard and numerals, and reject ambiguous or unsafe values',()=>{
 const source=custom({bindings:[{word:'*',property:'speed',value:250},{word:'上',property:'gravityDirection',value:'up'},{word:'上',property:'speed',value:300}]});
 const r=evaluateStageRule(source,'上');assert.equal(r.speed,300);assert.equal(r.gravityDirection,'up');assert.equal(r.sentence,'重力の向きが上になる。');
 assert.equal(evaluateStageRule(custom(),'下').ok,false);
 const number=custom({word:'三',ruleText:'［字］回ジャンプできる。',bindings:[{word:'*',property:'jumpCount',value:'$number'}]});
 assert.equal(evaluateStageRule(number,'七').jumpCount,7);assert.equal(evaluateStageRule(number,'森').ok,false);
 for(const bindings of [[{word:'上',property:'speed',value:-1}],[{word:'上',property:'constructor',value:1}],[{word:'上',property:'gravityDirection',value:'north'}],[{word:'上',property:'color',value:'red'}],[{word:'上',property:'speed',value:300},{word:'上',property:'speed',value:400}]])assert.equal(validateStage(custom({bindings})).ok,false);
});
test('all four authored gravity directions affect motion and jumping opposes gravity',()=>{
 for(const [word,direction,axis,sign] of [['上','up','vy',-1],['下','down','vy',1],['左','left','vx',-1],['右','right','vx',1]]){
  const g=load(custom({word,bindings:[{word,property:'gravityDirection',value:direction}]}));
  g.player.x=500;g.player.y=100;g.placed=[];g.running=true;tick(g);assert.equal(Math.sign(g.player[axis]),sign,direction);
  tick(g,{jump:true});assert.equal(Math.sign(g.player[axis]),-sign,direction);assert.equal(g.player.jumpsUsed,1);
 }
});
test('crumbling floors accumulate ridden time, pause freezes their timer, and retry restores them',()=>{
 const g=load(stage({regions:[{x:700,y:420,w:300,h:80}],objects:[{type:'crumble',x:0,y:420,w:300,h:80,delay:0.2}]}));
 g.running=true;tick(g,{},12);assert(g.objects[0].used>0);assert(!g.objects[0].broken);
 const used=g.objects[0].used;g.running=false;tick(g,{},60);assert.equal(g.objects[0].used,used);
 g.running=true;tick(g,{},30);assert(g.objects[0].broken);assert(g.player.y>390);
 g.respawn();assert.equal(g.objects[0].broken,false);assert.equal(g.objects[0].used,0);
});
test('vines support climbing, holding and jumping off without replenishing jumps',()=>{
 const g=load(stage({objects:[{type:'vine',x:50,y:100,w:50,h:320}]}));g.running=true;
 tick(g,{up:true},60);assert(g.player.y<330);assert.equal(g.player.jumpsUsed,0);
 const y=g.player.y;tick(g,{},60);assert.equal(g.player.y,y);
 tick(g,{jump:true});assert.equal(g.player.climbing,false);assert.equal(g.player.jumpsUsed,1);assert(g.player.vy<0);
});
test('touching spikes restarts automatically with the same word and rule',()=>{
 const g=load(stage({objects:[{type:'spike',x:100,y:395,w:50,h:25}]}));g.running=true;for(let i=0;i<120&&!g.deaths;i++)tick(g,{right:true});
 assert.equal(g.running,true);assert.equal(g.deaths,1);assert.equal(g.player.x,g.level.start[0]);assert.equal(g.lastEvent,'restart');assert.match(g.lastFailure,/トゲ/);assert.equal(g.word,'任');assert.equal(g.placed.length,1);
});
test('creator rules and objects round-trip through files and browser stage assignments',()=>{
 const source=custom({objects:[{type:'crumble',x:350,y:400,w:50,h:25,delay:2},{type:'vine',x:550,y:100,w:50,h:200},{type:'spike',x:800,y:395,w:50,h:25}]});
 const checked=validateStage(source);assert(checked.ok);const file=decodeStage(encodeStage(source).text);assert(file.ok);assert.deepEqual(file.level.bindings,checked.level.bindings);assert.deepEqual(file.level.objects,checked.level.objects);
 const data=new Map(),store=new StageStore({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)});assert(store.assign(0,source).ok);assert.deepEqual(store.assigned(0).objects,checked.level.objects);
 for(const objects of [[{type:'unknown',x:1,y:1,w:25,h:25}],[{type:'crumble',x:1,y:1,w:25,h:25,delay:-1}],[{type:'vine',x:990,y:100,w:50,h:50}]])assert.equal(validateStage(stage({objects})).ok,false);
});

test('ground jump plus one air jump is the limit; landing restores only the air allowance',()=>{
 const g=load(stage());g.running=true;tick(g,{},2);
 tick(g,{jump:true});assert.equal(g.player.jumpsUsed,1);assert.equal(g.player.airJumpsUsed,0);
 tick(g,{});tick(g,{jump:true});assert.equal(g.player.jumpsUsed,2);assert.equal(g.player.airJumpsUsed,1);
 tick(g,{});tick(g,{jump:true});assert.equal(g.player.jumpsUsed,2);
 tick(g,{},150);assert(g.player.grounded);assert.equal(g.player.airJumpsUsed,0);assert.equal(g.jumpsLeft,4);
 tick(g,{jump:true});assert.equal(g.player.jumpsUsed,3);
});
test('depth gravity falls onto existing building faces and supports four-way movement and jumps',()=>{
 const {citySurfaceAt,depthProjection,evaluateRule}=require('../engine.js');
 assert.equal(evaluateRule('重力の向きが［字］になる。','奥').gravityDirection,'back');
 const source=custom({word:'奥',bindings:[{word:'奥',property:'gravityDirection',value:'back'}]}),g=load(source);
 const before=depthProjection(g.player);g.running=true;tick(g,{},90);assert(g.player.grounded);assert.equal(g.player.surface,'ビル側面');assert(citySurfaceAt(g.level,g.player.depth.x,g.player.depth.y));
 assert(depthProjection(g.player).scale<before.scale);assert(depthProjection(g.player).y<before.y);
 let y=g.player.depth.y;tick(g,{up:true},12);assert(g.player.depth.y<y);assert.equal(g.player.jumpsUsed,0);
 tick(g,{down:true},30);assert(g.player.depth.y>y-1);assert.equal(g.player.jumpsUsed,0);
 tick(g,{jump:true});assert(g.player.depth.z>0);assert.equal(g.player.jumpsUsed,1);
 tick(g,{});tick(g,{jump:true});assert.equal(g.player.jumpsUsed,2);tick(g,{});tick(g,{jump:true});assert.equal(g.player.jumpsUsed,2);
});
test('depth mode ignores foreground terrain and hazards, falls through building gaps, and resets on failure',()=>{
 const g=load(custom({word:'奥',bindings:[{word:'奥',property:'gravityDirection',value:'back'}]}));g.running=true;tick(g,{},90);
 g.player.depth.x=80;g.player.depth.y=340;g.player.grounded=false;g.player.depth.z=0;g.player.depth.vz=0;
 for(let i=0;i<120&&!g.deaths;i++)tick(g);assert.equal(g.deaths,1);assert.equal(g.running,true);assert.equal(g.word,'奥');assert.equal(g.player.depth.entry,0);
 const wall=load(custom({word:'奥',bindings:[{word:'奥',property:'gravityDirection',value:'back'}]}));wall.running=true;tick(wall,{},90);
 wall.level.regions.push({x:0,y:300,w:300,h:200});wall.objects.push({type:'spike',x:0,y:300,w:300,h:200});tick(wall,{},20);assert.equal(wall.deaths,0);assert(wall.player.grounded);
});
test('ten default stages include a black stage six; count changes preserve hidden assignments',()=>{
 const {defaultStage}=require('../engine.js');assert.equal(LEVELS.length,10);assert.equal(defaultStage(5).background,'black');assert.equal(defaultStage(19).title,'STAGE 20');
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},store=new StageStore(storage);
 assert.equal(store.count(),10);assert(store.assign(9,stage()).ok);assert(store.setCount(3).ok);assert.equal(store.count(),3);assert(store.assigned(9));assert(store.setCount(12).ok);assert.equal(store.count(),12);assert(store.assigned(9));
 assert.equal(store.setCount(0).ok,false);assert.equal(store.setCount(101).ok,false);assert.equal(store.setCount(1.5).ok,false);assert.equal(store.count(),12);
 const black=decodeStage(encodeStage(stage({background:'black'})).text);assert.equal(black.level.background,'black');
});

test('top-edge ground and arbitrary spike angles survive validation and file round trips',()=>{
 const source=stage({regions:[...stage().regions,{x:350,y:0,w:50,h:25}],objects:[{type:'spike',x:500,y:0,w:25,h:75,angle:137}]});
 const checked=validateStage(source);assert(checked.ok,checked.message);
 const file=decodeStage(encodeStage(source).text);assert(file.ok);assert.equal(file.level.objects[0].angle,137);assert.equal(file.level.regions[2].y,0);
 assert.equal(validateStage(stage({objects:[{type:'spike',x:500,y:0,w:25,h:25,angle:360}]})).ok,false);
});
test('spike collision follows the rotated triangles and leaves empty corners safe',()=>{
 const {spikeIntersects,spikeTriangles}=require('../engine.js');
 for(const angle of [0,45,90,137,180,270,359]){const o={x:100,y:100,w:25,h:25,angle};assert(spikeIntersects({x:110,y:110,w:4,h:4},o));for(const t of spikeTriangles(o))for(const [x,y] of t)assert(x>=100-1e-8&&x<=125+1e-8&&y>=100-1e-8&&y<=125+1e-8);}
 const up={x:100,y:100,w:25,h:25,angle:0};assert.equal(spikeIntersects({x:100,y:100,w:3,h:3},up),false);assert(spikeIntersects({x:111,y:100,w:3,h:3},up));
 const right={...up,angle:90};assert.equal(spikeIntersects({x:122,y:100,w:3,h:3},right),false);assert(spikeIntersects({x:122,y:111,w:3,h:3},right));
 assert.equal(spikeTriangles({x:0,y:0,w:75,h:25}).length,3);
});

test('tile erasing cuts one cell out of all overlapping ground without changing the rest',()=>{
 const {eraseCell,StageDocument}=require('../editor.js');
 const source=stage({regions:[{x:0,y:400,w:300,h:100},{x:700,y:420,w:300,h:80},{x:50,y:400,w:100,h:100}]});
 const doc=new StageDocument(source),result=eraseCell(doc.data,{x:112,y:437});assert(result.ok);
 doc.change(d=>{d.regions=result.regions;d.objects=result.objects;});
 const solid=(rects,x,y)=>rects.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
 for(let y=400;y<500;y++)for(let x=0;x<300;x++)assert.equal(solid(doc.data.regions,x,y),!(x>=100&&x<125&&y>=425&&y<450));
 assert(doc.undo());assert.deepEqual(doc.data,source);assert(doc.redo());assert(!solid(doc.data.regions,110,435));
});
test('erasing a cell preserves rotated spike pixels and collision outside the erased cell, including unaligned old maps',()=>{
 const {eraseCell}=require('../editor.js');const {spikeIntersects}=require('../engine.js');
 const spike={type:'spike',x:170,y:395,w:100,h:40,angle:137},source=stage({objects:[spike]});
 const result=eraseCell(source,{x:212,y:412});assert(result.ok);assert(result.objects.length>1);
 for(let y=395;y<435;y++)for(let x=170;x<270;x++){
  const r={x:x+.2,y:y+.2,w:.6,h:.6},cut=x>=200&&x<225&&y>=400&&y<425;
  assert.equal(result.objects.some(o=>spikeIntersects(r,o)),!cut&&spikeIntersects(r,spike),`${x},${y}`);
 }
 const saved=decodeStage(encodeStage({...source,objects:result.objects}).text);assert(saved.ok);assert(saved.level.objects.every(o=>Array.isArray(o.tileBounds)));
});
