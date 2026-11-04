(function(root){'use strict';const D=root.RPGData,cache=new Map();
const shade=(hex,amount)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+amount)).toString(16).padStart(2,'0')).join('');
function enemySprite(enemy){const key=enemy.shape+enemy.color;if(cache.has(key))return cache.get(key);const canvas=document.createElement('canvas');canvas.width=canvas.height=40;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const base=enemy.color,dark=shade(base,-65),light=shade(base,45),outline='#172132';
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};const poly=(points,color,stroke=true)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=outline;c.lineWidth=2;c.stroke();}};
 const eyes=(y=19,gap=8)=>{r(20-gap/2-2,y,3,3,'#fff3c6');r(20+gap/2,y,3,3,'#fff3c6');r(20-gap/2-1,y+1,1,2,outline);r(20+gap/2+1,y+1,1,2,outline);};
 const shape=enemy.shape;
 if(['dragon','drake','griffin','bat','moth'].includes(shape)){
  poly([[16,18],[4,5],[1,23],[8,20],[12,29],[19,25]],dark);poly([[23,18],[36,4],[39,23],[32,20],[28,29],[20,25]],dark);
  for(const x of [5,9,31,35])r(x,14,1,9,base);
  poly([[15,12],[26,10],[29,23],[25,33],[14,33],[10,26]],base);r(15,24,10,7,light);
  if(shape!=='bat'){poly([[14,13],[15,5],[18,10],[24,5],[26,14]],light);r(24,15,7,6,base);r(29,19,3,3,light);r(13,32,5,4,'#e7d8b0');r(24,32,6,4,'#e7d8b0');poly([[12,27],[5,33],[3,27],[7,23]],base);}
  else {r(14,8,4,10,base);r(23,8,4,10,base);r(17,25,2,3,'#fff3c6');r(23,25,2,3,'#fff3c6');}eyes(16,7);
 }else if(shape==='treant'){
  poly([[14,20],[26,18],[26,31],[33,36],[24,35],[20,31],[15,36],[7,36],[13,29]],'#785b42');r(15,22,2,10,'#ae8752');r(23,24,2,10,'#442e31');poly([[14,22],[5,28],[3,25],[9,17]],dark);poly([[25,22],[34,29],[37,23],[29,15]],dark);
  for(const [x,y,w,h]of [[7,7,25,10],[3,13,34,11],[10,3,18,7]])r(x,y,w,h,dark);r(7,10,26,9,base);r(11,5,15,6,light);eyes(18,10);r(18,25,6,2,outline);
 }else if(['golem','knight','imp'].includes(shape)){
  r(10,12,20,19,outline);r(12,13,16,16,base);r(8,29,9,7,dark);r(23,29,9,7,dark);r(4,15,7,15,dark);r(29,15,7,15,dark);r(12,4,16,13,dark);r(13,6,14,8,base);r(14,6,4,3,light);
  if(shape==='knight'){r(12,11,16,3,outline);r(19,4,3,10,light);poly([[3,19],[12,17],[12,29],[7,33],[3,29]],base);r(33,8,2,24,'#e8d5a2');r(30,23,8,2,light);}else {eyes(10,7);r(17,21,7,7,light);r(19,23,3,3,'#fff3c6');}
  if(shape==='imp'){poly([[12,8],[8,1],[17,5]],light);poly([[25,8],[32,1],[23,5]],light);poly([[29,25],[36,30],[35,22],[39,27],[37,34],[29,32]],base);}
 }else if(['serpent','wolf'].includes(shape)){
  if(shape==='serpent'){poly([[5,31],[8,24],[26,24],[30,29],[25,34],[13,34],[14,30],[22,29],[18,27],[8,29]],dark);poly([[21,28],[15,20],[16,11],[23,7],[30,12],[28,22]],base);r(20,18,5,9,light);r(22,12,10,5,base);r(24,13,3,2,'#fff3c6');r(31,17,5,1,'#eb8b8f');}
  else {poly([[9,20],[21,14],[31,18],[33,29],[27,30],[26,24],[17,26],[13,34],[8,34],[10,26],[4,22]],base);poly([[20,16],[19,6],[24,10],[31,5],[32,16]],dark);r(22,12,11,8,base);r(25,15,3,2,'#fff3c6');r(31,18,5,3,dark);r(25,20,2,3,'#fff3c6');poly([[10,22],[2,16],[4,28],[12,28]],dark);}
 }else if(['crab','scarab'].includes(shape)){
  for(const y of [18,24,30]){r(4,y,9,2,dark);r(27,y,9,2,dark);}poly([[10,16],[15,9],[25,9],[30,16],[29,30],[20,35],[11,30]],base);r(13,16,5,12,light);r(20,12,2,20,dark);
  if(shape==='crab'){poly([[5,22],[1,12],[4,8],[7,14],[11,9],[13,13],[10,22]],base);poly([[29,22],[27,12],[31,9],[33,14],[37,8],[39,12],[35,22]],base);r(15,7,2,9,dark);r(24,7,2,9,dark);r(14,7,4,3,'#fff3c6');r(23,7,4,3,'#fff3c6');}else {poly([[16,10],[13,4],[18,8],[22,8],[27,4],[24,11]],light);eyes(12,7);}
 }else if(['mushroom','jelly','wraith'].includes(shape)){
  if(shape==='mushroom'){r(14,17,13,17,dark);r(15,19,11,14,'#ddd1a5');poly([[3,17],[8,6],[17,2],[27,5],[36,17],[33,21],[6,21]],base);r(12,8,4,4,light);r(24,12,6,4,light);eyes(23,5);}
  else if(shape==='jelly'){for(let x=10;x<=28;x+=6){r(x,22,2,13,dark);r(x+(x%4?2:-2),33,3,3,base);}poly([[5,20],[8,10],[15,5],[25,5],[33,12],[35,22],[28,26],[11,26]],base);r(12,9,12,3,light);eyes(18,9);}
  else {poly([[7,34],[11,13],[17,6],[26,7],[31,15],[33,34],[27,30],[22,36],[16,31]],dark);r(15,13,13,11,base);eyes(16,7);poly([[13,23],[5,20],[1,27],[11,29]],base);poly([[28,23],[36,20],[39,27],[30,29]],base);r(18,25,7,3,outline);}
 }else {poly([[3,31],[4,22],[8,16],[13,12],[27,12],[33,18],[37,29],[34,35],[7,35]],base);r(9,18,7,3,light);r(7,27,3,3,light);r(12,34,18,2,dark);eyes(24,10);r(17,30,8,2,dark);}
 cache.set(key,canvas);return canvas;
}
function drawEnemy(ctx,enemy,x,y,size,clock=0){const sprite=enemySprite(enemy);ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,Math.round(x-size/2),Math.round(y-size+Math.sin(clock*2)*3),size,size);}
function human(ctx,x,y,color,appearance='warrior',scale=1,frame=0,direction='down'){
 const key=`person:${color}:${appearance}:${frame%2}:${direction}`;let sprite=cache.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=16;sprite.height=24;const c=sprite.getContext('2d'),r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};const outline='#171b2a',hair='#493249',skin='#f4c895',light=shade(color,35),dark=shade(color,-45);
 r(4,2,8,1,outline);r(2,3,12,6,outline);r(3,3,10,4,hair);r(4,6,8,6,skin);r(3,8,1,3,'#ce916a');r(12,8,1,3,'#ce916a');
 if(direction==='up'){r(3,4,10,7,hair);r(5,10,6,2,hair);}else{r(direction==='left'?4:6,8,1,2,outline);if(direction==='down')r(10,8,1,2,outline);r(7,11,3,1,'#c78464');}
 r(4,12,8,7,outline);r(2,13,2,6,outline);r(12,13,2,6,outline);r(3,13,2,4,color);r(11,13,2,4,dark);r(5,12,6,6,color);r(5,12,2,5,light);r(4,18,8,2,'#6b4938');r(7,18,2,2,'#f6dc87');r(4,20,3,3-(frame%2),outline);r(9,20,3,2+(frame%2),outline);
 if(appearance==='warrior'){r(4,13,8,2,'#c4d3d4');r(5,15,6,2,'#859daa');r(13,13,1,8,'#e5e0bf');}else if(appearance==='mage'){r(1,5,14,2,color);r(5,0,6,5,color);r(6,0,2,3,light);r(13,13,1,10,'#9b7448');r(12,12,3,2,'#b5ebdf');}else if(appearance==='ranger'){r(2,3,12,2,color);r(10,0,2,4,'#e9d28a');}cache.set(key,sprite);}
 const w=Math.round(16*scale),h=Math.round(24*scale);ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,Math.round(x-w/2),Math.round(y-h+3*scale),w,h);
}
function tile(ctx,id,x,y,size,world,tx=0,ty=0){const key=`tile:${id}:${world.id}:${(tx+ty)%2}`;let sprite=cache.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=16;const c=sprite.getContext('2d'),r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},grass=world.id===3?'#bd9a5e':world.id===2?'#6d5544':world.id===4?'#40445e':'#3c824b';r(0,0,16,16,grass);
 if(id===0||id===9){for(const [a,b]of [[2,4],[10,11],[6,14]]){r(a,b,1,2,'#2a613e');r(a+1,b+1,1,1,'#74a95b');}if(id===9){r(8,6,1,4,'#a9c76d');r(6,5,5,2,'#e9bc83');r(8,4,1,4,'#fff0ae');}}
 else if(id===1){r(6,10,4,6,'#624234');for(const [a,b,w,h]of [[5,0,6,2],[3,2,10,3],[1,5,14,5],[3,10,10,3]])r(a,b,w,h,'#173a32');r(4,3,8,3,'#3c7650');r(2,6,11,3,'#2b6545');r(4,4,2,2,'#75a65d');r(7,9,6,2,'#438257');}
 else if(id===2){r(0,0,16,16,'#285b91');r(1,3,5,1,'#6aabd0');r(9,10,6,1,'#6aabd0');r(4,14,4,1,'#3e7eb2');}
 else if(id===3||id===4||id===10){r(0,0,16,16,id===4?'#c5aa6d':'#b69a68');r(2,3,2,1,'#d4bd87');r(10,11,3,1,'#947b53');r(6,8,1,1,'#d9be87');if(id===10){r(0,1,16,2,'#62473a');r(0,8,16,1,'#70503a');r(0,14,16,2,'#62473a');r(3,0,1,16,'#8e6b43');}}
 else if(id===5){r(2,8,12,7,'#2b2e3f');r(4,5,9,8,'#707889');r(5,5,5,2,'#abb5b5');r(2,10,6,3,'#555e70');}
 else if(id===6){r(0,0,16,16,'#74352f');r(1,2,7,2,'#f1a448');r(9,8,6,3,'#d56b36');r(4,13,5,2,'#f8d06a');}
 else if(id===7){r(0,0,16,16,'#8b694e');r(0,0,16,1,'#4c3d36');r((tx%2)*8,0,1,16,'#4c3d36');r(2,5,9,1,'#9e7954');r(6,12,8,1,'#72563f');}
 else if(id===8){r(0,0,16,16,'#454b61');r(1,1,14,5,'#8a92a2');r(1,2,13,1,'#afb3b6');r(0,7,16,1,'#252a3d');r(1,9,6,5,'#69788b');r(9,9,6,5,'#69788b');r(7,8,2,8,'#252a3d');r(0,15,16,1,'#252a3d');}cache.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,Math.round(x),Math.round(y),Math.round(size),Math.round(size));}
function marker(ctx,entity,x,y,size,project,flags={}){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size/16,size/16);const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 if(entity.kind==='npc'||entity.kind==='healer'||entity.kind==='merchant'){const char=project.characters.find(c=>c.id===entity.character);human(ctx,0,6,char?.color||'#c5a66a',char?.appearance||'scholar',.8);if(entity.character==='story_king'){r(-4,-13,8,2,'#f2ce64');r(-4,-16,2,3,'#f2ce64');r(-1,-16,2,3,'#f2ce64');r(2,-16,2,3,'#f2ce64');}}
 else if(entity.kind==='chest'){r(-6,-3,12,9,'#242539');r(-5,-4,10,4,'#bd8c4b');r(-5,1,10,4,'#8c553c');r(-1,-1,2,4,'#f7da83');}
 else if(entity.kind==='gather'){r(-1,-3,2,8,'#84ba59');r(-5,-3,4,2,'#b2d372');r(1,-6,4,3,'#67a660');}
 else if(entity.kind==='boss'){const enemy=project.enemies.find(e=>e.id===entity.enemy);if(enemy)drawEnemy(ctx,enemy,0,8,24);}
 else if(entity.kind==='portal'){if(!entity.touch){r(-6,-7,12,14,'#c1bca2');r(-4,-5,8,12,'#34374e');r(-2,-4,4,10,'#8194bd');}}
 else{const done=flags[entity.doneFlag];r(-3,-7,6,12,done?'#6eab8c':'#bab9ae');r(-4,-9,8,3,'#d6d6b1');r(-1,-6,2,6,done?'#d9e9a0':'#9faacc');}ctx.restore();}
function battleScene(ctx,world,enemy,clock){const w=ctx.canvas.width,h=ctx.canvas.height;ctx.fillStyle=world.id===4?'#15152c':'#20334e';ctx.fillRect(0,0,w,h);ctx.fillStyle=world.colors[2];for(let i=0;i<12;i++){const x=i*80,y=170+i*19%60;ctx.fillRect(x,y,80,h-y);ctx.fillRect(x+16,y-24,48,24);}ctx.fillStyle=world.colors[0];ctx.fillRect(0,h*.62,w,h*.38);ctx.fillStyle=world.colors[1];for(let y=Math.round(h*.68);y<h;y+=24)for(let x=(y%48?0:24);x<w;x+=64)ctx.fillRect(x,y,24,4);drawEnemy(ctx,enemy,w/2,h*.87,enemy.boss?240:200,clock);}
function portrait(ctx,character,speaker){
 const w=ctx.canvas.width,h=ctx.canvas.height;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#202b40';ctx.fillRect(0,0,w,h);ctx.fillStyle='#35445a';ctx.fillRect(12,12,w-24,h-24);
 const royal=/王|姫/.test(speaker),princess=/姫/.test(speaker);const color=character?.color||'#9eb9c1';human(ctx,w/2,h*.78,color,character?.appearance||'scholar',4,0);
 if(royal){ctx.fillStyle='#e8c86b';const x=w/2;ctx.fillRect(x-24,h*.78-80,48,10);for(let i=0;i<3;i++)ctx.fillRect(x-24+i*20,h*.78-92,8,14);}
 if(!character&&/魔王|古樹|海蛇|飛竜|グリフォン/.test(speaker)){ctx.fillStyle='#202b40';ctx.fillRect(0,0,w,h);drawEnemy(ctx,{shape:'dragon',color:'#9b73bb'},w/2,h*.92,h*.8);}
 if(princess){ctx.fillStyle='#f6d4e4';ctx.fillRect(w/2-14,h*.78-33,28,34);}
}
function building(ctx,b,x,y,size){const w=b.w*16,h=b.h*16,key=`house:${b.w}:${b.h}:${b.color}`;let sprite=cache.get(key);if(!sprite){sprite=document.createElement('canvas');sprite.width=w;sprite.height=h;const c=sprite.getContext('2d'),r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};r(0,0,w,h,'#191c2e');r(1,Math.floor(h*.45),w-2,Math.ceil(h*.55)-1,'#c6b48a');for(let yy=Math.floor(h*.5);yy<h;yy+=6){r(1,yy,w-2,1,'#9a896e');for(let xx=yy%12?5:13;xx<w;xx+=16)r(xx,yy,1,6,'#9a896e');}const roof=Math.floor(h*.55);for(let yy=0;yy<roof;yy+=2){const inset=Math.max(0,Math.floor((roof-yy)/6));r(inset,yy,w-inset*2,2,'#202338');if(yy<roof-2)r(inset+1,yy,w-inset*2-2,1,shade(b.color,yy%6===0?25:-10));}for(let xx=8;xx<w-8;xx+=24){r(xx,h-22,9,10,'#222c43');r(xx+1,h-21,7,8,'#e4cb7b');r(xx+4,h-21,1,8,'#65523d');r(xx+1,h-17,7,1,'#65523d');}const door=Math.floor(b.w/2)*16;r(door,h-16,16,16,'#272339');r(door+2,h-14,12,14,'#46312b');r(door+11,h-8,2,2,'#ebcc75');cache.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,Math.round(x),Math.round(y),b.w*size,b.h*size);ctx.fillStyle='#f2e1b0';ctx.font=`${Math.max(7,Math.round(size*.45))}px Journey,monospace`;ctx.textAlign='center';ctx.fillText(b.label,Math.round(x+b.w*size/2),Math.round(y+b.h*size+7));ctx.textAlign='start';}
function furniture(ctx,f,x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size/16,size/16);const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};if(f.kind==='rug'){r(0,0,16,16,'#613246');r(1,1,14,14,'#af5353');r(3,3,10,10,'#98424d');r(1,1,14,1,'#dfb676');r(1,14,14,1,'#dfb676');}else if(f.kind==='bed'){r(1,0,14,16,'#382e38');r(2,2,12,13,'#ded7bc');r(3,3,10,4,'#f7edc9');r(2,8,12,7,'#647da5');r(3,9,3,5,'#8eabbb');}else if(f.kind==='table'){r(2,3,12,12,'#382d31');r(1,1,14,11,'#a07145');r(2,2,12,1,'#d4a468');r(7,3,1,8,'#79583c');}else{r(1,0,14,16,'#3a2e32');for(let yy=2;yy<16;yy+=7){r(2,yy,3,5,'#a65e51');r(6,yy,2,5,'#d0ac65');r(9,yy,4,5,'#618e8a');r(2,yy+5,12,1,'#a0784d');}}ctx.restore();}
root.RPGArt={portrait,building,furniture,shade,enemySprite,drawEnemy,human,tile,marker,battleScene};
})(window);
