const {Game}=require('../engine.js');
const {test}=require('node:test');
const assert=require('node:assert/strict');
function tick(g,input,n=1){for(let i=0;i<n;i++){g.step(1/120,input);if(g.lastEvent&&g.lastEvent!=='win')throw Error(g.lastEvent);}}
function settle(g){tick(g,{},200)}
function walk(g,x){for(let i=0;i<1500&&!g.won;i++){const d=x-g.player.x;if(Math.abs(d)<2&&Math.abs(g.player.vx)<5)return;tick(g,{right:d>2,left:d< -2});}if(!g.won)throw Error('walk failed '+JSON.stringify(g.player));}
function hop(g,x){tick(g,{jump:true});for(let i=0;i<1200&&!g.won;i++){const d=x-g.player.x;tick(g,{right:d>2,left:d< -2});if(g.player.grounded&&i>15&&Math.abs(d)<4)return;}if(!g.won)throw Error('hop failed '+JSON.stringify(g.player));}
function place(g,x,y,w){assert.equal(g.place(x,y,w).ok,true,`${x},${y} ${w}`)}

test('level 1 has a playable solution within its ink budget', () => {
const g=new Game(0);for(const x of [6,8,10,12])place(g,x,8,'木');g.running=true;settle(g);walk(g,210);for(const x of [310,410,510,610,720])hop(g,x);walk(g,905);assert(g.won);

});

test('level 2 has a playable solution within its ink budget', () => {
const g2=new Game(1);place(g2,9,7,'火');place(g2,9,6,'水');place(g2,14,6,'水');g2.running=true;settle(g2);walk(g2,410);hop(g2,510);walk(g2,650);hop(g2,730);walk(g2,905);assert(g2.won);

});

test('level 3 has a playable solution within its ink budget', () => {
const g3=new Game(2);place(g3,5,7,'風');place(g3,7,3,'木');place(g3,9,3,'木');place(g3,11,3,'木');g3.running=true;settle(g3);walk(g3,200);
// Ride the updraft to the top, then move to the first high platform.
tick(g3,{jump:true,right:true}); for(let i=0;i<500&&g3.player.y>50;i++)tick(g3,{right:g3.player.x<260});

walk(g3,360);settle(g3);hop(g3,460);hop(g3,560);hop(g3,670);walk(g3,905);assert(g3.won);

});

test('level 4 has a playable solution within its ink budget', () => {
const g4=new Game(3);place(g4,7,7,'火');place(g4,7,6,'水');place(g4,4,7,'風');for(const x of [6,8,10])place(g4,x,4,'木');place(g4,15,2,'水');g4.running=true;settle(g4);walk(g4,165);tick(g4,{jump:true,right:true});for(let i=0;i<500&&g4.player.y>50;i++)tick(g4,{right:g4.player.x<210});
for(let i=0;i<500&&g4.player.y>50;i++)tick(g4,{});
walk(g4,310);settle(g4);hop(g4,410);hop(g4,510);hop(g4,620);walk(g4,710);hop(g4,790);walk(g4,905);assert(g4.won);

});

test('placement validates characters, boundaries, terrain, goal and ink; removal refunds ink',()=>{
 const g=new Game();
 assert.equal(g.place(4,4,'山').ok,false);
 for(const [x,y] of [[-1,4],[20,4],[2,0],[2,9],[0,8],[18,7],[1,7]])assert.equal(g.place(x,y,'木').ok,false);
 for(let x=4;x<10;x++)place(g,x,4,'木');
 assert.equal(g.remaining,0);assert.equal(g.place(10,4,'木').ok,false);
 assert.equal(g.place(4,4,'木').ok,true);assert.equal(g.remaining,1);
 g.running=true;assert.equal(g.place(10,4,'木').ok,false);assert.equal(g.remove(5,4),false);
});
test('fire burns connected wood and vines, water extinguishes connected flames',()=>{
 const g=new Game(1);place(g,9,7,'火');
 for(let y=0;y<8;y++)assert.equal(g.at(10,y),undefined);
 assert.equal(g.at(9,7),'火');place(g,9,6,'水');assert.equal(g.at(9,7),undefined);
 place(g,14,6,'水');assert.equal(g.at(14,7),undefined);assert.equal(g.at(15,7),undefined);
 const h=new Game();place(h,6,5,'木');place(h,7,5,'木');place(h,5,5,'火');
 assert.equal(h.at(6,5),undefined);assert.equal(h.at(7,5),undefined);
});
test('fire melts ice into water, which puts out the fire',()=>{
 const g=new Game();place(g,6,5,'氷');place(g,5,5,'火');
 assert.equal(g.at(6,5),'水');assert.equal(g.at(5,5),undefined);
});
test('fire and falling reset the traveler, pause play and preserve placements',()=>{
 const g=new Game();place(g,3,7,'火');g.running=true;
 for(let i=0;i<300&&g.running;i++)g.step(1/120,{right:true});
 assert.equal(g.deaths,1);assert.equal(g.running,false);assert.equal(g.at(3,7),'火');
 g.remove(3,7);place(g,8,5,'木');g.running=true;
 for(let i=0;i<1000&&g.running;i++)g.step(1/120,{right:true});
 assert.equal(g.deaths,2);assert.equal(g.running,false);assert.equal(g.at(8,5),'木');
});
test('ice increases running speed and retains momentum after releasing movement',()=>{
 function slide(type){const g=new Game();g.placed.set('2,7',type);g.player.x=110;g.player.y=314;g.running=true;tick(g,{},3);tick(g,{right:true},8);const vx=g.player.vx;tick(g,{},8);return {vx,remaining:g.player.vx};}
 const ice=slide('氷'),wood=slide('木');assert(ice.remaining>0);assert.equal(wood.remaining,0);
 const g=new Game();g.player.grounded=true;g.player.surface='氷';g.player.vx=280;g.running=true;g.step(1/120,{right:true});assert(g.player.vx>200);
});
test('paused games do not move or advance elapsed time',()=>{
 const g=new Game();const before={...g.player};tick(g,{right:true,jump:true},120);assert.deepEqual(g.player,before);assert.equal(g.elapsed,0);
});

test('jumping from ice retains speed in the air and travels farther',()=>{
 function distance(type,speed){const g=new Game();g.placed.set('2,7',type);g.player.x=110;g.player.y=314;g.running=true;tick(g,{},3);g.player.vx=speed;tick(g,{jump:true,right:true});tick(g,{right:true},30);return g.player.x-110;}
 assert(distance('氷',300)>distance('木',200)+20);
});
