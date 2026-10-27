const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,isHan,parseNumber,evaluateRule,buildMask,maskIntersects,GRAVITY,LEVELS}=require('../engine.js');
function glyph(char,size){
 const alpha=new Uint8Array(size*size),put=(x,y)=>{alpha[y*size+x]=255;};
 if(char==='口'||char==='回'){for(let i=10;i<size-10;i++){put(i,10);put(i,size-11);put(10,i);put(size-11,i);}}
 else if(char==='川'){for(let y=10;y<size-10;y++)for(const x of [20,50,80])if(x<size)put(x,y);}
 else for(let x=8;x<size-8;x++)put(x,Math.floor(size/2));
 return buildMask(size,size,alpha);
}
const game=(index=0)=>new Game(index,glyph);
function tick(g,input={},n=1){for(let i=0;i<n;i++)g.step(1/120,input);}
function tap(g){tick(g,{jump:true});tick(g,{});}
function withGeometry(char){const g=game();g.placed=[{id:20,char,x:350,y:230,size:100,mask:glyph(char,100)}];return g;}

test('the field accepts any single Han character before interpreting its meaning',()=>{
 for(const word of ['猫','夢','龍','龘','𠮷','一','〇'])assert(isHan(word));
 for(const word of ['','山川','3','あ','🔥'])assert.equal(isHan(word),false);
 assert.match(evaluateRule('jumps','猫').message,/具体的な回数/);
 assert.match(evaluateRule('jumps','二十三').message,/一文字/);
});
test('numerals are interpreted semantically, including unlisted large and formal numerals',()=>{
 for(const [word,value]of Object.entries({零:0,〇:0,一:1,三:3,十:10,百:100,千:1000,万:10000,萬:10000,億:100000000,兆:1000000000000,壱:1,弐:2,参:3,廿:20,卅:30})){
  const result=evaluateRule('jumps',word);assert(result.ok,word);assert.equal(result.jumpCount,value,word);
 }
 for(const word of ['猫','無','-','3','十十','三四','<script>'])assert.equal(evaluateRule('jumps',word).ok,false,word);
 assert.equal(parseNumber('二十三'),23);
});
test('body sentences produce their meaning without a candidate selector',()=>{
 for(const word of ['軽','重','速','遅','赤','青','細','太','丸','強','弱','長','短'])assert(evaluateRule('body',word).ok,word);
 assert.equal(evaluateRule('body','速').speed,285);assert.equal(evaluateRule('body','赤').color,'#b15d49');
 for(const word of ['猫','三','軽い','夢','大','小',''])assert.equal(evaluateRule('body',word).ok,false,word);
});
test('every stage starts with exactly its one applied input glyph',()=>{
 for(let i=0;i<LEVELS.length;i++){const g=game(i);assert.equal(g.placed.length,1);assert.equal(g.placed[0].char,g.word);assert.equal(g.word,g.level.word);assert(g.rule.ok);}
});
test('applying a word replaces both its effect and the sole glyph atomically',()=>{
 const g=game();assert(g.applyRule('十').ok);assert.equal(g.rules.jumpCount,10);assert.equal(g.word,'十');assert.equal(g.placed.length,1);assert.equal(g.placed[0].char,'十');
 const snapshot={word:g.word,rules:{...g.rules},glyph:g.placed[0],player:{...g.player}};
 assert.equal(g.applyRule('猫').ok,false);assert.equal(g.word,snapshot.word);assert.deepEqual(g.rules,snapshot.rules);assert.equal(g.placed[0],snapshot.glyph);assert.deepEqual(g.player,snapshot.player);
 assert(g.applyRule('三').ok);assert.equal(g.placed.length,1);assert.equal(g.placed[0].char,'三');assert.equal(g.rules.jumpCount,3);
});
test('invalid glyph size, empty font mask and invalid placement never partially apply a rule',()=>{
 const g=game(),before=g.placed[0];assert.equal(g.applyRule('十',999).ok,false);assert.equal(g.placed[0],before);assert.equal(g.word,'三');
 g.makeGlyph=()=>buildMask(100,100,new Uint8Array(10000));assert.equal(g.applyRule('十').ok,false);assert.equal(g.word,'三');assert.equal(g.placed[0],before);
});
test('the sentence input has a fixed stage position, even after changing its glyph',()=>{
 const g=game(),[x,y,size]=g.level.letter;assert.equal(typeof g.moveLetter,'undefined');assert.equal(typeof g.resetLetter,'undefined');
 assert(g.applyRule('十').ok);assert.equal(g.placed.length,1);assert.equal(g.placed[0].x,x);assert.equal(g.placed[0].y,y);assert.equal(g.placed[0].size,size);
});
test('sentence and glyph are locked together during play or after winning',()=>{
 const g=game();g.running=true;assert.equal(g.applyRule('十').ok,false);assert.equal(g.word,'三');
 g.running=false;g.won=true;assert.equal(g.applyRule('百').ok,false);
});
test('collision follows actual pixels and leaves the interior empty',()=>{
 const mask=glyph('口',100);assert.equal(maskIntersects(mask,200,100,{x:230,y:130,w:18,h:30}),false);assert(maskIntersects(mask,200,100,{x:230,y:105,w:18,h:10}));
});
test('one-pixel strokes stop a fast fall without a bounding-box platform',()=>{
 const g=withGeometry('一');g.player.x=385;g.player.y=200;g.player.vy=650;g.running=true;
 tick(g,{},60);assert(g.player.grounded);assert.equal(g.player.surface,'一');assert(g.player.y>249&&g.player.y<=250);
});
test('a traveler in 口 lands on the inner bottom stroke',()=>{
 const g=withGeometry('口');g.player.x=385;g.player.y=260;g.running=true;
 tick(g,{},100);assert(g.player.grounded);assert.equal(g.player.surface,'口');assert(g.player.y>288&&g.player.y<=289);
});
test('the gap between 川 strokes is open all the way through',()=>{
 const g=withGeometry('川');g.player.x=375;g.player.y=215;g.running=true;tick(g,{},60);assert(g.player.y>330);assert.equal(g.player.grounded,false);
});
test('only one airborne jump is allowed and holding does not repeat',()=>{
 const g=game();g.player.x=650;g.player.y=180;g.running=true;tap(g);assert.equal(g.player.jumpsUsed,1);tick(g,{jump:true},20);assert.equal(g.player.jumpsUsed,1);
 tick(g,{});tap(g);assert.equal(g.player.jumpsUsed,1);assert.equal(g.player.airJumpsUsed,1);
});
test('landing never restores the stage budget, and 零 prevents every jump',()=>{
 const g=withGeometry('一');g.player.x=385;g.player.y=200;g.player.jumpsUsed=3;g.running=true;tick(g,{},80);assert.equal(g.jumpsLeft,0);assert(g.player.grounded);
 g.running=false;assert(g.applyRule('零').ok);assert.equal(g.placed[0].char,'零');g.running=true;tick(g,{},5);const before=g.player.y;tap(g);assert.equal(g.player.jumpsUsed,0);assert(g.player.y>=before-.1);
});
test('body rules affect actual movement, gravity, size and color as well as the glyph',()=>{
 const g=game(1);assert(g.applyRule('速').ok);assert.equal(g.placed[0].char,'速');assert.equal(g.rules.speed,285);
 assert(g.applyRule('太').ok);assert.equal(g.player.w,30);assert.equal(g.placed[0].char,'太');
 assert(g.applyRule('赤').ok);assert.equal(g.rules.color,'#b15d49');assert.equal(g.placed[0].char,'赤');
 const positions={};for(const word of ['軽','重']){g.applyRule(word);g.player.x=650;g.player.y=80;g.running=true;tick(g,{},30);positions[word]=g.player.y;g.running=false;}
 assert(positions.軽<positions.重);
});
test('pause, death and retry preserve the one-word rule and glyph',()=>{
 const g=game();const before={...g.player};tick(g,{right:true},100);assert.deepEqual(g.player,before);assert.equal(g.elapsed,0);
 const char=g.word;g.player.x=650;g.player.y=550;g.running=true;tick(g,{},30);assert.equal(g.running,true);assert.equal(g.deaths,1);assert.equal(g.word,char);assert.equal(g.placed.length,1);assert.equal(g.placed[0].char,char);
});
test('goal contact emits a win and stops play',()=>{
 const g=game();g.player.x=920;g.player.y=380;g.running=true;tick(g);assert(g.won);assert.equal(g.lastEvent,'win');assert.equal(g.running,false);
});

test('two jumps separated by a landing still consume two stage jumps',()=>{
 const g=game();g.running=true;tap(g);tick(g,{},120);assert(g.player.grounded);assert.equal(g.jumpsLeft,2);
 tap(g);tick(g,{},120);assert(g.player.grounded);assert.equal(g.jumpsLeft,1);
 tap(g);tick(g,{},120);assert.equal(g.jumpsLeft,0);const before=g.player.y;tap(g);assert(g.player.y>=before-.1);assert.equal(g.jumpsLeft,0);
});
test('changing a kanji resets the traveler and budget; reaffirming it does not',()=>{
 const g=game();g.player.x=400;g.player.y=150;g.player.jumpsUsed=2;assert(g.applyRule('十').ok);
 assert.equal(g.player.x,g.level.start[0]);assert.equal(g.player.y,g.level.start[1]-g.player.h);assert.equal(g.jumpsLeft,10);
 g.player.x=450;g.player.jumpsUsed=3;assert(g.applyRule('十').ok);assert.equal(g.player.x,450);assert.equal(g.jumpsLeft,7);
 const snapshot={...g.player};assert.equal(g.applyRule('猫').ok,false);assert.deepEqual(g.player,snapshot);
});
test('retry and a new attempt refill the stage budget',()=>{
 const g=game();g.player.jumpsUsed=3;g.respawn();assert.equal(g.jumpsLeft,3);g.player.jumpsUsed=2;g.player.x=650;g.player.y=558;g.player.vy=650;g.running=true;tick(g,{},3);assert.equal(g.jumpsLeft,3);assert.equal(g.deaths,1);
});
test('sentence text outside the glyph is never a physical platform',()=>{
 const g=game(),[x,y,size]=g.level.letter;
 assert.equal(g.solidAt({x:x-80,y:y+size/2,w:15,h:15}),null);
 assert.equal(g.solidAt({x:x+size+15,y:y+size/2,w:15,h:15}),null);
});

test('entering a stage clears its input and physical glyph until a valid word is applied',()=>{
 const game=new Game(0,glyph);game.prepareInput();
 assert.equal(game.word,'');assert.equal(game.placed.length,0);assert.equal(game.running,false);
 assert.equal(game.applyRule('').ok,false);assert.equal(game.placed.length,0);
 assert.equal(game.applyRule('三').ok,true);assert.equal(game.placed.length,1);assert.equal(game.word,'三');assert.equal(game.jumpsLeft,3);
});
