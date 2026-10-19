'use strict';
const {Game,WORDS,LEVELS,CELL,COLS,ROWS}=window.Kotonoha;
const $=selector=>document.querySelector(selector);
const canvas=$('#world'),ctx=canvas.getContext('2d');
const game=new Game();
let selected='木',hover=null,clock=0,previous=0,accumulator=0,completed=new Set(),composition=false,jumpQueued=false;
const input={left:false,right:false,jump:false};
try{const saved=JSON.parse(localStorage.getItem('kotonoha-completed')||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<LEVELS.length));}catch{}
function tell(text,error=false){$('#notice').textContent=text;$('#notice').classList.toggle('error',error);}
function clearInput(){jumpQueued=false;input.left=false;input.right=false;input.jump=false;document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('pressed'));}
function updateUI(){
  const level=game.level;
  $('#stage-number').textContent=level.chapter;$('#stage-title').textContent=level.title;
  $('#scene-kicker').textContent=level.kicker;$('#ink-left').textContent=game.remaining;
  $('#level-hint').textContent=level.hint;
  $('#mode-tag').textContent=game.won?'クリア':game.running?'旅の途中':'配置モード';
  $('#play').textContent=game.running?'Ⅱ 配置に戻る':'▶ 旅をはじめる';
  $('#play').disabled=game.won;$('#reset').disabled=game.running||game.won;
  $('#retry').disabled=game.won;
  $('#win-panel').hidden=!game.won;
  document.querySelectorAll('.chapter').forEach((b,i)=>{b.classList.toggle('active',i===game.index);b.classList.toggle('complete',completed.has(i));b.setAttribute('aria-current',i===game.index?'step':'false');});
}
function selectWord(word){
  if(!WORDS[word]){tell('この文字はまだ使えません。「木・火・水・風・氷」から一文字を選んでください。',true);return;}
  selected=word;
  $('#word').value=word;
  $('#rule-symbol').textContent=word;$('#rule-symbol').style.color=WORDS[word].color;
  $('#rule-title').textContent=WORDS[word].title;$('#rule-description').textContent=WORDS[word].description;
  document.querySelectorAll('.word-card').forEach(b=>{b.classList.toggle('selected',b.dataset.word===word);b.setAttribute('aria-pressed',String(b.dataset.word===word));});
  tell(`「${word}」を選びました。配置モードで点線のマスをクリック。`);
}
for(const [word,rule] of Object.entries(WORDS)){
  const button=document.createElement('button');button.className='word-card';button.type='button';button.dataset.word=word;button.title=rule.description;
  const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=word;small.textContent=rule.name;
  button.append(strong,small);button.addEventListener('click',()=>selectWord(word));$('#palette').append(button);
}
LEVELS.forEach((level,index)=>{
  const button=document.createElement('button');button.className='chapter';button.textContent=['一','二','三','四'][index];button.title=`${level.chapter}：${level.title}`;button.setAttribute('aria-label',button.title);
  button.addEventListener('click',()=>loadLevel(index));$('#chapters').append(button);
});
function loadLevel(index){clearInput();game.load(index);hover=null;updateUI();tell(game.level.hint);}
$('#word').addEventListener('compositionstart',()=>composition=true);
$('#word').addEventListener('compositionend',()=>composition=false);
$('#word').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||composition||e.keyCode===229))e.preventDefault();});
$('#word-form').addEventListener('submit',e=>{e.preventDefault();if(composition)return;selectWord($('#word').value.trim());});
$('#play').addEventListener('click',()=>{
  if(game.won)return;
  game.running=!game.running;clearInput();updateUI();
  tell(game.running?'← → で移動、Space でジャンプ。朱色の門を目指そう。':'時間を止めました。文字を置き直して、道を考えよう。');
  if(game.running)canvas.focus({preventScroll:true});
});
$('#retry').addEventListener('click',()=>{game.respawn();game.running=false;clearInput();updateUI();tell('旅人をスタートへ戻しました。文字と仕掛けの変化は残っています。');});
$('#reset').addEventListener('click',()=>loadLevel(game.index));
$('#next-level').addEventListener('click',()=>loadLevel((game.index+1)%LEVELS.length));
$('#replay').addEventListener('click',()=>loadLevel(game.index));
function pointerCell(event){const rect=canvas.getBoundingClientRect();return {x:Math.floor((event.clientX-rect.left)/rect.width*COLS),y:Math.floor((event.clientY-rect.top)/rect.height*ROWS)};}
canvas.addEventListener('pointermove',e=>{hover=pointerCell(e);});
canvas.addEventListener('pointerleave',()=>hover=null);
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  if(game.running){tell('文字を置くには「配置に戻る」で時間を止めてください。');return;}
  const {x,y}=pointerCell(e);const result=game.place(x,y,selected);tell(result.message,!result.ok);updateUI();
});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();const {x,y}=pointerCell(e);if(game.remove(x,y)){tell('文字を回収しました。');updateUI();}});
const keyControls={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump'};
document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select')||e.isComposing||$('#help').open)return;
  const control=keyControls[e.key];if(!control)return;
  // Keep Space/Enter available for focused native buttons.
  if(e.key===' '&&e.target.closest('button'))return;
  e.preventDefault();if(game.running){input[control]=true;if(control==='jump')jumpQueued=true;}
});
document.addEventListener('keyup',e=>{const control=keyControls[e.key];if(control)input[control]=false;});
window.addEventListener('blur',()=>{clearInput();if(game.running){game.running=false;updateUI();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();game.running=false;updateUI();}});
for(const button of document.querySelectorAll('[data-control]')){
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(game.running){input[button.dataset.control]=true;if(button.dataset.control==='jump')jumpQueued=true;}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{input[button.dataset.control]=false;});
}
function openHelp(){clearInput();game.running=false;updateUI();$('#help').showModal();}
$('#help-open').addEventListener('click',openHelp);
for(const id of ['#help-close','#help-start'])$(id).addEventListener('click',()=>$('#help').close());
function rect(x,y,w,h,fill,r=0){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function text(value,x,y,size,color,font='serif'){ctx.font=`${size}px ${font}`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,x,y);}
function mountain(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,500);for(const [x,y] of points)ctx.lineTo(x,y);ctx.lineTo(1000,500);ctx.closePath();ctx.fill();}
function drawBackground(){
  const gradient=ctx.createLinearGradient(0,0,0,500);gradient.addColorStop(0,'#eaf0e4');gradient.addColorStop(1,'#d9e3cc');ctx.fillStyle=gradient;ctx.fillRect(0,0,1000,500);
  ctx.fillStyle='#f5efd6';ctx.beginPath();ctx.arc(780,95,39,0,Math.PI*2);ctx.fill();
  mountain([[0,295],[100,220],[210,270],[340,150],[500,275],[650,190],[820,250],[1000,140]],'#c8d5c13d');
  mountain([[0,340],[120,290],[230,315],[420,235],[580,325],[780,235],[1000,290]],'#b7c9ac55');
  mountain([[0,410],[170,375],[330,390],[480,310],[680,380],[840,310],[1000,360]],'#a4bb9755');
  ctx.strokeStyle='#fff9';ctx.lineWidth=1;
  for(let i=0;i<8;i++){let x=((clock*(5+i%3)+i*147)%1100)-50,y=130+(i*47)%260;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+20,y-7,x+45,y+6,x+65,y-2);ctx.stroke();}
  // Distant brush-like pines, drawn as scenery rather than gameplay geometry.
  for(const [x,y,s] of [[55,370,.9],[950,355,1.2],[885,360,.65]]){ctx.save();ctx.translate(x,y);ctx.scale(s,s);line(0,0,0,-75,'#8da48255',3);for(let i=0;i<5;i++){const w=28-i*4,h=-12-i*12;line(-w,h,0,h-14,'#8da48255',5);line(0,h-14,w,h,'#8da48255',5);}ctx.restore();}
}
function drawStone(x,y){
  const px=x*CELL,py=y*CELL,top=!game.terrain.has(`${x},${y-1}`);
  rect(px,py,50,50,'#728468');
  rect(px+2,py+3,46,44,(x+y)%3===0?'#819075':'#7a8a6f',2);
  line(px+5,py+27,px+23,py+30,'#65795e55');line(px+33,py+11,px+42,py+18,'#a6b39555');
  if(top){rect(px,py,50,7,'#a3b687');for(let i=0;i<4;i++)line(px+7+i*12,py+4,px+4+i*12,py-4-(x*3+i)%5,'#8da675',2);}
}
function drawTile(x,y,type,placed){
  const px=x*CELL,py=y*CELL;
  if(type==='stone'){drawStone(x,y);return;}
  if(type==='vine'){
    rect(px+5,py,40,50,'#7b956c22',3);
    for(let i=0;i<3;i++){ctx.strokeStyle=i===1?'#6b875b':'#8b9d6a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px+10+i*14,py+52);ctx.bezierCurveTo(px+30+i*3,py+30,px+i*14,py+15,px+13+i*13,py-2);ctx.stroke();}
    for(let i=0;i<4;i++){ctx.fillStyle='#81965d';ctx.beginPath();ctx.ellipse(px+10+(i%2)*26,py+10+i*10,8,3,i%2?.6:-.6,0,Math.PI*2);ctx.fill();}
    if(y%3===1)text('蔦',px+25,py+25,25,'#526d48');return;
  }
  const palettes={'木':['#e3d5ad','#9e8e61'],'火':['#f1d3ad','#c57c51'],'水':['#d3e7e3','#7ba5a6'],'風':['#e0e9d7','#8ca57a'],'氷':['#dcebee','#94b7be']};
  const [bg,border]=palettes[type];
  if(type==='風'){
    const height=Math.min(y*CELL,300);const g=ctx.createLinearGradient(0,py-height,0,py);g.addColorStop(0,'#a7bf8a00');g.addColorStop(1,'#a7bf8a44');rect(px-20,py-height,90,height,g);
    for(let i=0;i<7;i++){const yy=py-((clock*95+i*43)%height);const xx=px+25+Math.sin(clock*2+i)*27;line(xx-7,yy+5,xx,yy,'#8caa7680',1.5);line(xx,yy,xx+7,yy+5,'#8caa7680',1.5);}
  }
  if(type==='火'){const flicker=Math.sin(clock*8+x)*3;ctx.fillStyle='#d99c6630';ctx.beginPath();ctx.ellipse(px+25,py+22,26,29+flicker,0,0,Math.PI*2);ctx.fill();}
  rect(px+2,py+3,46,46,'#40523718',5);rect(px+2,py,46,45,bg,4);
  ctx.strokeStyle=border;ctx.lineWidth=1;ctx.strokeRect(px+6.5,py+4.5,37,36);
  if(type==='氷'){line(px+9,py+10,px+25,py+39,'#ffffff99');line(px+23,py+7,px+39,py+36,'#ffffff99');}
  text(type,px+25,py+23,31,WORDS[type].color);
  if(placed){ctx.fillStyle=border;ctx.beginPath();ctx.arc(px+41,py+37,1.5,0,Math.PI*2);ctx.fill();}
}
function drawGoal(){
  const [x,y]=game.level.goal,px=x*CELL+25,py=y*CELL;
  ctx.save();ctx.shadowColor='#f3dba0';ctx.shadowBlur=20;rect(px-22,py-66,44,66,'#f7f1c377',15);ctx.restore();
  rect(px-24,py-66,6,66,'#b26348',1);rect(px+18,py-66,6,66,'#b26348',1);rect(px-34,py-72,68,7,'#ad553e',2);rect(px-29,py-59,58,5,'#c77e55',1);rect(px-25,py-9,9,9,'#8a8565',1);rect(px+16,py-9,9,9,'#8a8565',1);
  text('終',px,py-38,17,'#a36143');text('GOAL',px,py+16,8,'#f1f0d9','sans-serif');
}
function drawPlayer(){
  const p=game.player,cx=p.x+p.w/2,cy=p.y,walk=game.running&&Math.abs(p.vx)>10&&p.grounded?Math.sin(clock*15)*4:0;
  ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle='#34483533';ctx.beginPath();ctx.ellipse(0,37,13,3,0,0,Math.PI*2);ctx.fill();
  line(-5,27,-6+walk,35,'#475347',4);line(5,27,6-walk,35,'#475347',4);
  rect(-10,12,20,17,'#ece5cf',4);rect(-9,20,18,4,'#9b654a',1);
  // A red scarf makes the traveler legible against the landscape.
  rect(-10,11,21,5,'#b65f45',2);const tail=-p.facing;ctx.fillStyle='#b65f45';ctx.beginPath();ctx.moveTo(tail*6,12);ctx.lineTo(tail*(24+Math.sin(clock*5)*3),9);ctx.lineTo(tail*23,17);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f0d8b1';ctx.beginPath();ctx.arc(0,6,9,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#465043';ctx.beginPath();ctx.arc(0,3,9,Math.PI,Math.PI*2);ctx.fill();rect(-9,0,4,7,'#465043',1);
  ctx.fillStyle='#41493c';ctx.beginPath();ctx.arc(p.facing*4,6,1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#c8b58c';ctx.beginPath();ctx.ellipse(0,-1,16,3,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-12,-1);ctx.lineTo(0,-9);ctx.lineTo(12,-1);ctx.closePath();ctx.fill();
  ctx.restore();
}
function draw(){
  drawBackground();
  if(!game.running&&!game.won){
    ctx.save();ctx.setLineDash([2,5]);ctx.strokeStyle='#78856738';ctx.lineWidth=1;
    for(let y=1;y<=8;y++)for(let x=0;x<COLS;x++)if(game.canPlace(x,y)&&!game.placed.has(`${x},${y}`))ctx.strokeRect(x*CELL+4.5,y*CELL+4.5,41,41);
    ctx.restore();
  }
  for(const [k,type] of game.terrain){const [x,y]=k.split(',').map(Number);drawTile(x,y,type,false);}
  for(const [k,type] of game.placed){const [x,y]=k.split(',').map(Number);drawTile(x,y,type,true);}
  drawGoal();drawPlayer();
  for(const fx of game.effects){ctx.globalAlpha=Math.max(0,fx.life);for(let i=0;i<6;i++){const a=i*Math.PI/3,r=(1-fx.life)*35;rect(fx.x+Math.cos(a)*r,fx.y+Math.sin(a)*r-20*(1-fx.life),4,4,'#c58a4e');}ctx.globalAlpha=1;}
  if(hover&&!game.running&&!game.won&&game.canPlace(hover.x,hover.y)){
    ctx.save();ctx.globalAlpha=.6;drawTile(hover.x,hover.y,selected,true);ctx.restore();
    ctx.strokeStyle=WORDS[selected].color;ctx.lineWidth=2;ctx.strokeRect(hover.x*CELL+1,hover.y*CELL+1,48,48);
  }
  // A few falling leaves give the ink landscape a little life.
  for(let i=0;i<5;i++){const x=(i*237+clock*(9+i))%1040-20,y=(i*97+Math.sin(clock*.3+i)*12)%430;ctx.save();ctx.translate(x,y);ctx.rotate(clock*.5+i);ctx.fillStyle='#a8b38d66';ctx.beginPath();ctx.ellipse(0,0,4,1.6,0,0,Math.PI*2);ctx.fill();ctx.restore();}
}
function onWin(){
  clearInput();completed.add(game.index);try{localStorage.setItem('kotonoha-completed',JSON.stringify([...completed]));}catch{}
  $('#win-title').textContent=`${game.level.chapter} クリア`;
  $('#win-detail').textContent=`${game.placed.size}文字の道で到着 · ${Math.ceil(game.elapsed)}秒 · やり直し${game.deaths}回`;
  $('#next-level').textContent=game.index===LEVELS.length-1?'最初の景へ戻る ↺':'次の景へ →';
  updateUI();tell(game.index===LEVELS.length-1?'全四景クリア！ あなたのことばが、道をつくりました。':'クリア！ 次の景でも、ことばの可能性を探そう。');
}
function frame(timestamp){
  const delta=Math.min((timestamp-previous)/1000||0,0.05);previous=timestamp;clock+=delta;accumulator+=delta;
  while(accumulator>=1/120){game.step(1/120,{...input,jump:input.jump||jumpQueued});jumpQueued=false;accumulator-=1/120;}
  if(game.lastEvent){const event=game.lastEvent;game.lastEvent='';if(event==='win')onWin();else{clearInput();updateUI();tell(event,true);}}
  draw();requestAnimationFrame(frame);
}
selectWord('木');updateUI();tell(game.level.hint);requestAnimationFrame(frame);
