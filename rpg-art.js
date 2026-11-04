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
function human(ctx,x,y,color,appearance='warrior',scale=1,frame=0){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};r(-5,-20,10,8,'#e5c49d');r(-6,-23,12,5,appearance==='mage'?'#765a9e':'#4b4561');r(-5,-12,10,11,color);r(-7,-10,3,8,shade(color,-30));r(4,-10,3,8,shade(color,-30));r(-5,-1,4,3+(frame%2), '#30384d');r(1,-1,4,4-(frame%2),'#30384d');r(2,-18,2,2,'#323444');if(appearance==='mage'){r(-7,-25,14,3,color);r(-3,-30,7,5,color);r(7,-14,2,18,'#b2a47b');r(6,-17,4,4,'#9edce4');}else if(appearance==='ranger'){r(-6,-24,12,4,color);r(-2,-28,3,5,'#e5d7a1');}else if(appearance==='warrior'){r(-5,-13,10,3,'#a9bdc3');r(7,-14,2,16,'#dfdfc8');}ctx.restore();}
function tile(ctx,id,x,y,size,world,tx=0,ty=0){const n=world.id,colors=world.colors;const r=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a*size/32,y+b*size/32,w*size/32,h*size/32);};const grass=n===3?'#aa915f':n===2?'#655147':n===4?'#424257':colors[0];r(0,0,32,32,grass);
 const dot=(tx*19+ty*37)%20;
 if(id===0||id===9){r(4+dot,8,2,3,shade(grass,12));r(8,22,3,2,shade(grass,-12));if(id===9){r(15,10,2,9,'#779065');r(12,10,7,3,n===4?'#ac98ca':'#d4b68a');}}
 else if(id===1){r(12,20,8,12,'#5a443c');r(3,10,26,15,n===4?'#34364b':'#284b3a');r(7,3,19,12,n===4?'#514967':'#3c6546');r(10,5,6,3,n===4?'#655675':'#64885a');}
 else if(id===2){r(0,0,32,32,n===4?'#343c62':'#2a5b73');r(dot,8,12,2,'#5a91a2');r(4,25,13,2,'#376e84');}
 else if(id===3||id===10){r(0,0,32,32,n===1?'#a3926a':'#9a8c6d');r(3,7,7,2,'#b2a17e');r(18,20,8,3,'#82785f');if(id===10){r(0,4,32,2,'#5a4d42');r(0,15,32,2,'#5a4d42');r(0,27,32,2,'#5a4d42');}}
 else if(id===4){r(0,0,32,32,'#aa915f');r(3,10,18,2,'#bea476');r(12,25,15,2,'#9c8557');}
 else if(id===5){r(4,17,24,14,'#484653');r(8,10,19,14,'#69636b');r(9,10,9,4,'#858083');}
 else if(id===6){r(0,0,32,32,'#743a36');r(3,5,13,4,'#d68b4f');r(17,18,10,5,'#b95f40');r(7,26,8,3,'#e5aa63');}
 else if(id===7){r(0,0,32,32,n===3?'#776c58':n===4?'#494257':'#4c5458');r(0,0,32,1,'#697177');r(0,0,1,32,'#697177');r(12,12,4,3,'#ffffff07');}
 else if(id===8){r(0,0,32,32,n===3?'#a08b62':n===4?'#3e354f':'#444955');r(0,2,32,8,shade(n===3?'#a08b62':n===4?'#3e354f':'#444955',20));r(0,11,32,2,'#292d3d');r(15,13,2,19,'#292d3d');r(0,28,32,2,'#292d3d');}
}
function marker(ctx,entity,x,y,size,project,flags={}){const color=D.ELEMENTS[D.WORLDS[project.maps.find(m=>m.entities.includes(entity))?.world||0].element].color;ctx.save();ctx.translate(x,y);const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 if(entity.kind==='npc'||entity.kind==='healer'){const char=project.characters.find(c=>c.id===entity.character);human(ctx,0,8,char?.color||'#97b6b0',char?.appearance||'scholar',size/32);}
 else if(entity.kind==='merchant'){r(-10,-13,20,19,'#83654d');r(-13,-18,26,7,'#b9a06b');r(-4,-3,8,10,'#3c3d48');}
 else if(entity.kind==='chest'){r(-11,-8,22,16,'#5c413c');r(-10,-10,20,8,'#ba9156');r(-10,0,20,6,'#9c6e47');r(-2,-3,4,7,'#ead195');}
 else if(entity.kind==='gather'){r(-2,-5,3,14,'#789765');r(-10,-5,9,5,'#87b581');r(1,-10,9,5,'#add29a');}
 else if(entity.kind==='boss'){const enemy=project.enemies.find(e=>e.id===entity.enemy);if(enemy)drawEnemy(ctx,enemy,0,16,44);}
 else if(entity.kind==='portal'){r(-12,-24,5,34,'#77818c');r(7,-24,5,34,'#77818c');r(-12,-25,24,5,'#a0b6bd');r(-5,-18,10,26,color);r(-3,-15,6,20,'#d4e5d6');}
 else {r(-10,-8,20,18,'#646977');r(-8,-12,16,5,'#8d9b9c');const active=!entity.doneFlag||!flags[entity.doneFlag];r(-4,-23,8,12,active?color:'#a7cab8');r(-2,-26,4,4,active?'#f4e6b4':'#cde9d7');}
 ctx.restore();}
function battleScene(ctx,world,enemy,clock){const {width:w,height:h}=ctx.canvas;const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,world.id===3?'#6d6959':world.id===4?'#202039':'#263c4e');sky.addColorStop(1,world.colors[0]);ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 ctx.fillStyle=world.colors[2];for(let i=0;i<12;i++){const x=i*w/11,y=h*.45+(i*37%60);ctx.fillRect(x,y,w/9,h-y);ctx.fillRect(x+12,y-35,w/18,35);}ctx.fillStyle=world.colors[1];ctx.beginPath();ctx.ellipse(w/2,h*.86,w*.43,h*.16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151e2b55';ctx.beginPath();ctx.ellipse(w/2,h*.82,enemy.boss?115:85,16,0,0,Math.PI*2);ctx.fill();drawEnemy(ctx,enemy,w/2,h*.86,enemy.boss?260:210,clock);}
function portrait(ctx,character,speaker){
 const w=ctx.canvas.width,h=ctx.canvas.height;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#202b40';ctx.fillRect(0,0,w,h);ctx.fillStyle='#35445a';ctx.fillRect(12,12,w-24,h-24);
 const royal=/王|姫/.test(speaker),princess=/姫/.test(speaker);const color=character?.color||'#9eb9c1';human(ctx,w/2,h*.78,color,character?.appearance||'scholar',4,0);
 if(royal){ctx.fillStyle='#e8c86b';const x=w/2;ctx.fillRect(x-24,h*.78-108,48,10);for(let i=0;i<3;i++)ctx.fillRect(x-24+i*20,h*.78-120,8,14);}
 if(!character&&/魔王|古樹|海蛇|飛竜|グリフォン/.test(speaker)){ctx.fillStyle='#202b40';ctx.fillRect(0,0,w,h);drawEnemy(ctx,{shape:'dragon',color:'#9b73bb'},w/2,h*.92,h*.8);}
 if(princess){ctx.fillStyle='#f6d4e4';ctx.fillRect(w/2-14,h*.78-50,28,34);}
}
function building(ctx,b,x,y,size){const w=b.w*size,h=b.h*size;ctx.fillStyle='#15202b88';ctx.fillRect(x+5,y+8,w,h);ctx.fillStyle=b.color;ctx.fillRect(x,y+size*.7,w,h-size*.7);ctx.fillStyle=shade(b.color,-35);ctx.beginPath();ctx.moveTo(x-5,y+size);ctx.lineTo(x+w/2,y-12);ctx.lineTo(x+w+5,y+size);ctx.closePath();ctx.fill();ctx.fillStyle='#debe84';for(let i=0;i<b.w-1;i++){ctx.fillRect(x+12+i*size,y+size*1.25,12,16);ctx.fillStyle='#debe84';}ctx.fillStyle='#2c2530';ctx.fillRect(x+w/2-9,y+h-26,18,26);ctx.fillStyle='#f0dfba';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(b.label,x+w/2,y+h+14);ctx.textAlign='start';}
root.RPGArt={portrait,building,shade,enemySprite,drawEnemy,human,tile,marker,battleScene};
})(window);
