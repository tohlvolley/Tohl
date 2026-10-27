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
test('touching spikes resets position and terrain and stops the attempt',()=>{
 const g=load(stage({objects:[{type:'spike',x:100,y:395,w:50,h:25}]}));g.running=true;tick(g,{right:true},120);
 assert.equal(g.running,false);assert.equal(g.deaths,1);assert.equal(g.player.x,g.level.start[0]);assert.match(g.lastEvent,/トゲ/);
});
test('creator rules and objects round-trip through files and browser stage assignments',()=>{
 const source=custom({objects:[{type:'crumble',x:350,y:400,w:50,h:25,delay:2},{type:'vine',x:550,y:100,w:50,h:200},{type:'spike',x:800,y:395,w:50,h:25}]});
 const checked=validateStage(source);assert(checked.ok);const file=decodeStage(encodeStage(source).text);assert(file.ok);assert.deepEqual(file.level.bindings,checked.level.bindings);assert.deepEqual(file.level.objects,checked.level.objects);
 const data=new Map(),store=new StageStore({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)});assert(store.assign(0,source).ok);assert.deepEqual(store.assigned(0).objects,checked.level.objects);
 for(const objects of [[{type:'unknown',x:1,y:1,w:25,h:25}],[{type:'crumble',x:1,y:1,w:25,h:25,delay:-1}],[{type:'vine',x:990,y:100,w:50,h:50}]])assert.equal(validateStage(stage({objects})).ok,false);
});
