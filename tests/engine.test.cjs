const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,isHan,parseNumber,buildMask,maskIntersects,GRAVITY}=require('../engine.js');
function glyph(char,size){
 const alpha=new Uint8Array(size*size),put=(x,y)=>{alpha[y*size+x]=255;};
 if(char==='口'||char==='回')for(let i=10;i<size-10;i++){put(i,10);put(i,size-11);put(10,i);put(size-11,i);}
 else if(char==='川'){for(let y=10;y<size-10;y++)for(const x of [20,50,80])if(x<size)put(x,y);}
 else for(let x=8;x<size-8;x++)put(x,Math.floor(size/2));
 return buildMask(size,size,alpha);
}
const game=()=>new Game(0,glyph);
function tick(g,input={},n=1){for(let i=0;i<n;i++)g.step(1/120,input);}
function tap(g){tick(g,{jump:true});tick(g,{});}

test('arbitrary Han characters, including supplementary characters, are accepted',()=>{
 for(const word of ['山','猫','夢','龍','龘','𠮷','一','〇'])assert.equal(isHan(word),true,word);
 for(const word of ['','山川','a','3','あ','🔥','<script>'])assert.equal(isHan(word),false,word);
 const g=game();g.placed=[];assert.equal(g.place(300,200,'猫',100).ok,true);
 assert.equal(g.place(500,200,'𠮷',100).ok,true);assert.equal(g.place(600,200,'<',100).ok,false);
});
test('kanji numerals produce their real number of jumps',()=>{
 for(const [word,value]of Object.entries({零:0,〇:0,一:1,二:2,三:3,九:9,十:10,十一:11,二十三:23,百:100,千二百三十四:1234,九千九百九十九:9999,二〇二六:2026,壱:1,弐:2,参:3}))assert.equal(parseNumber(word),value,word);
 for(const word of ['','山','3','-1','1.5','十十','百千','一二十','一万','〇十','<img>'])assert.equal(parseNumber(word),null,word);
});
test('collision follows ink pixels; a character’s empty interior is traversable',()=>{
 const mask=glyph('口',100);
 assert.equal(maskIntersects(mask,200,100,{x:230,y:130,w:18,h:30}),false);
 assert.equal(maskIntersects(mask,200,100,{x:230,y:105,w:18,h:10}),true);
 assert.equal(maskIntersects(mask,200,100,{x:190,y:120,w:8,h:20}),false);
 assert.equal(maskIntersects(mask,200,100,{x:289,y:140,w:10,h:10}),true);
});
test('one-pixel horizontal strokes stop a falling character without a bounding box',()=>{
 const g=game();g.placed=[];g.place(300,250,'一',100);g.player.x=335;g.player.y=235;g.player.vy=650;g.running=true;
 tick(g,{},60);assert(g.player.grounded);assert.equal(g.player.surface,'一');assert(g.player.y>269&&g.player.y<=270);
});
test('a traveler inside 口 lands on its inner bottom, not on the outer bounding rectangle',()=>{
 const g=game();g.placed=[];g.place(300,250,'口',100);g.player.x=335;g.player.y=280;g.running=true;
 tick(g,{},100);assert(g.player.grounded);assert.equal(g.player.surface,'口');assert(g.player.y>308&&g.player.y<=309);
});
test('the empty gap between 川 strokes is open all the way through',()=>{
 const g=game();g.placed=[];g.place(300,250,'川',100);g.player.x=325;g.player.y=235;g.running=true;
 tick(g,{},60);assert(g.player.y>350);assert.equal(g.player.grounded,false);
});
test('三 allows exactly three presses before landing; holding jump does not repeat',()=>{
 const g=game();g.placed=[];g.setRules('三','軽');g.player.x=400;g.player.y=200;g.running=true;
 tap(g);assert.equal(g.player.jumpsUsed,1);tick(g,{jump:true},20);assert.equal(g.player.jumpsUsed,2);
 tick(g,{});tap(g);assert.equal(g.player.jumpsUsed,3);tick(g,{},10);const before=g.player.vy;
 tap(g);assert.equal(g.player.jumpsUsed,3);assert(g.player.vy>before);assert.equal(g.jumpsLeft,0);
});
test('landing on a glyph restores jumps, and zero prevents all jumping',()=>{
 const g=game();g.placed=[];g.place(300,250,'一',100);g.setRules('三','並');g.player.x=335;g.player.y=230;g.player.jumpsUsed=3;g.running=true;
 tick(g,{},80);assert.equal(g.jumpsLeft,3);assert(g.player.grounded);
 g.running=false;g.setRules('零','並');g.running=true;tick(g,{},5);const before=g.player.y;tap(g);assert.equal(g.player.jumpsUsed,0);assert(g.player.y>=before-.1);
});
test('rules change atomically only in placement mode and retain placed letters',()=>{
 const g=game(),count=g.placed.length;assert.equal(g.setRules('二十三','重').ok,true);assert.equal(g.rules.jumpCount,23);assert.equal(g.rules.gravity,'重');assert.equal(g.placed.length,count);
 assert.equal(g.setRules('十','無').ok,false);assert.equal(g.rules.jumpCount,23);
 assert.equal(g.setRules('猫','軽').ok,false);assert.equal(g.rules.gravity,'重');
 g.running=true;assert.equal(g.setRules('一','軽').ok,false);
});
test('the gravity rule changes falling speed',()=>{
 const positions={};for(const gravity of Object.keys(GRAVITY)){const g=game();g.placed=[];g.setRules('一',gravity);g.player.x=400;g.player.y=100;g.running=true;tick(g,{},30);positions[gravity]=g.player.y;}
 assert(positions.軽<positions.並);assert(positions.並<positions.重);
});
test('placement checks actual ink against terrain, traveler and goal; removal refunds budget',()=>{
 const g=game();g.placed=[];assert.equal(g.place(0,400,'一',100).ok,false);assert.equal(g.place(-1,100,'一',100).ok,false);
 assert.equal(g.place(900,300,'口',100).ok,false);assert.equal(g.place(100,100,'一',99).ok,false);
 for(let i=0;i<g.level.budget;i++)assert(g.place(250+i*50,150,'一',100).ok);
 assert.equal(g.remaining,0);assert.equal(g.place(700,250,'山',100).ok,false);assert(g.remove(g.placed[0].id));assert.equal(g.remaining,1);
 g.running=true;assert.equal(g.remove(g.placed[0].id),false);
});
test('falling preserves letters and rules; pause freezes movement and elapsed time',()=>{
 const g=game(),count=g.placed.length;g.setRules('三','軽');const before={...g.player};tick(g,{right:true,jump:true},100);assert.deepEqual(g.player,before);assert.equal(g.elapsed,0);
 g.player.x=700;g.player.y=550;g.running=true;tick(g,{},30);assert.equal(g.running,false);assert.equal(g.deaths,1);assert.equal(g.placed.length,count);assert.equal(g.rules.jumpCount,3);
});
test('goal contact emits a win and stops play',()=>{
 const g=game();g.player.x=920;g.player.y=380;g.running=true;tick(g);assert(g.won);assert.equal(g.lastEvent,'win');assert.equal(g.running,false);
});
