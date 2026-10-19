'use strict';
const {Game,LEVELS,WIDTH,HEIGHT,isHan,parseNumber,buildMask}=window.Kotonoha;
const $=selector=>document.querySelector(selector);
const canvas=$('#world'),ctx=canvas.getContext('2d');
let game,selected='山',letterSize=160,hover=null,clock=0,previous=0,accumulator=0,composition=false,jumpQueued=false,completed=new Set();
const input={left:false,right:false,jump:false},glyphCache=new Map();
let glyphFont='"Kotonoha Thin","Hiragino Sans","Noto Sans CJK JP",sans-serif';
try{const saved=JSON.parse(localStorage.getItem('kotonoha-glyph-completed')||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<LEVELS.length));}catch{}
function tell(message,error=false){$('#notice').textContent=message;$('#notice').classList.toggle('error',error);}
function clearInput(){jumpQueued=false;input.left=false;input.right=false;input.jump=false;}
function makeGlyph(char,size){
  const key=`${char}:${size}`;
  if(glyphCache.has(key))return glyphCache.get(key);
  const surface=document.createElement('canvas');surface.width=size;surface.height=size;
  const ink=surface.getContext('2d',{willReadFrequently:true});
  ink.font=`100 ${size*.9}px ${glyphFont}`;ink.textAlign='center';ink.textBaseline='alphabetic';ink.fillStyle='#3f5542';
  const metrics=ink.measureText(char);
  const ascent=Number.isFinite(metrics.actualBoundingBoxAscent)?metrics.actualBoundingBoxAscent:size*.75;
  const descent=Number.isFinite(metrics.actualBoundingBoxDescent)?metrics.actualBoundingBoxDescent:size*.05;
  const offset=Number.isFinite(metrics.actualBoundingBoxLeft)?(metrics.actualBoundingBoxLeft-metrics.actualBoundingBoxRight)/2:0;
  ink.fillText(char,size/2+offset,(size+ascent-descent)/2);
  const data=ink.getImageData(0,0,size,size).data,alpha=new Uint8Array(size*size);
  for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
  const mask=buildMask(size,size,alpha);mask.canvas=surface;
  if(glyphCache.size>=128)glyphCache.delete(glyphCache.keys().next().value);
  glyphCache.set(key,mask);return mask;
}
function updateJumpCounter(){
  if(!game)return;
  const text=`残り ${game.jumpsLeft} / ${game.rules.jumpCount} 回`;
  if($('#jump-counter').textContent!==text)$('#jump-counter').textContent=text;
}
function updateUI(){
  const level=game.level;
  $('#stage-number').textContent=level.chapter;$('#stage-title').textContent=level.title;
  $('#scene-kicker').textContent=level.kicker;$('#ink-left').textContent=game.remaining;$('#level-hint').textContent=level.hint;
  $('#mode-tag').textContent=game.won?'クリア':game.running?'旅の途中':'配置モード';
  $('#play').textContent=game.running?'Ⅱ 配置に戻る':'▶ 旅をはじめる';$('#play').disabled=game.won;
  for(const id of ['#reset','#apply-rules','#word-form button'])$(id).disabled=game.running||game.won;
  $('#retry').disabled=game.won;$('#win-panel').hidden=!game.won;
  document.querySelectorAll('.chapter').forEach((b,i)=>{b.classList.toggle('active',i===game.index);b.classList.toggle('complete',completed.has(i));b.setAttribute('aria-current',i===game.index?'step':'false');});
  updateJumpCounter();
}
function showAppliedRules(){
  $('#rule-summary').textContent=`適用中：${game.rules.jumpCount}回・重力「${game.rules.gravity}」`;
  $('#rules-form').classList.remove('pending');
}
function loadLevel(index){
  clearInput();game.load(index);hover=null;$('#jump-rule').value=game.level.jumps;$('#gravity-rule').value=game.level.gravity;
  showAppliedRules();updateUI();tell(game.level.hint);
}
function selectWord(char){
  if(!isHan(char)){tell('好きな漢字を一文字入力してください。例：夢、橋、猫、龍。',true);return;}
  const mask=makeGlyph(char,letterSize);
  if(!mask.ink){tell('この漢字を表示できませんでした。別の漢字を試してください。',true);return;}
  selected=char;$('#word').value=char;$('#rule-symbol').textContent=char;$('#rule-title').textContent=`「${char}」の線に乗る。`;
  document.querySelectorAll('.word-card').forEach(b=>{b.classList.toggle('selected',b.dataset.word===char);b.setAttribute('aria-pressed',String(b.dataset.word===char));});
  tell(`「${char}」を選びました。画面をクリックすると、その線が足場になります。`);
}
function pointerPosition(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*WIDTH,y:(event.clientY-r.top)/r.height*HEIGHT};}
function placementPosition(point){return {x:Math.round((point.x-letterSize/2)/10)*10,y:Math.round((point.y-letterSize/2)/10)*10};}
function setupControls(){
  for(const char of ['一','二','山','川','回']){
    const button=document.createElement('button');button.className='word-card';button.type='button';button.dataset.word=char;
    const symbol=document.createElement('strong');symbol.textContent=char;button.append(symbol);button.title=`「${char}」の形を置く`;
    button.addEventListener('click',()=>selectWord(char));$('#palette').append(button);
  }
  LEVELS.forEach((level,index)=>{
    const button=document.createElement('button');button.className='chapter';button.textContent=['一','二','三','四'][index];button.title=`${level.chapter}：${level.title}`;button.setAttribute('aria-label',button.title);
    button.addEventListener('click',()=>loadLevel(index));$('#chapters').append(button);
  });
  for(const field of document.querySelectorAll('input:not([type="range"])')){
    field.addEventListener('compositionstart',()=>composition=true);field.addEventListener('compositionend',()=>composition=false);
    field.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||composition||e.keyCode===229))e.preventDefault();});
  }
  $('#word-form').addEventListener('submit',e=>{e.preventDefault();if(!composition)selectWord($('#word').value.trim());});
  $('#letter-size').addEventListener('input',()=>{letterSize=Number($('#letter-size').value);$('#size-value').textContent=letterSize;});
  $('#rules-form').addEventListener('input',()=>{const n=parseNumber($('#jump-rule').value);$('#rules-form').classList.add('pending');$('#rule-summary').textContent=n===null?'未反映：回数には漢数字を入力してください。':`未反映：${n}回・重力「${$('#gravity-rule').value.trim()}」` ;});
  $('#rules-form').addEventListener('submit',e=>{
    e.preventDefault();if(composition)return;
    const result=game.setRules($('#jump-rule').value.trim(),$('#gravity-rule').value.trim());
    if(result.ok){clearInput();showAppliedRules();updateUI();}tell(result.message,!result.ok);
  });
  $('#play').addEventListener('click',()=>{
    if(game.won)return;game.running=!game.running;clearInput();updateUI();
    tell(game.running?`← → で移動。Spaceを押し直すと、着地まで合計${game.rules.jumpCount}回ジャンプできます。`:'時間を止めました。漢字の形やルールを変えられます。');
    if(game.running)canvas.focus({preventScroll:true});
  });
  $('#retry').addEventListener('click',()=>{game.respawn();game.running=false;clearInput();updateUI();tell('旅人を戻しました。文字の配置とルールは残っています。');});
  $('#reset').addEventListener('click',()=>{game.clear();clearInput();updateUI();tell('文字をすべて回収しました。ルールはそのままです。');});
  $('#next-level').addEventListener('click',()=>loadLevel((game.index+1)%LEVELS.length));$('#replay').addEventListener('click',()=>loadLevel(game.index));
  canvas.addEventListener('pointermove',e=>hover=pointerPosition(e));canvas.addEventListener('pointerleave',()=>hover=null);
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    if(game.running){tell('文字を置くには「配置に戻る」を押してください。');return;}
    if(game.won)return;
    const point=pointerPosition(e),existing=game.glyphAt(point.x,point.y);
    if(existing){game.remove(existing.id);tell(`「${existing.char}」を回収しました。`);}else{
      const{x,y}=placementPosition(point),result=game.place(x,y,selected,letterSize);tell(result.message,!result.ok);
    }
    updateUI();
  });
  canvas.addEventListener('contextmenu',e=>{e.preventDefault();const point=pointerPosition(e),glyph=game.glyphAt(point.x,point.y);if(glyph&&game.remove(glyph.id)){tell(`「${glyph.char}」を回収しました。`);updateUI();}});
  const keyControls={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump'};
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')||e.isComposing||$('#help').open)return;
    const control=keyControls[e.key];if(!control)return;
    if(e.key===' '&&e.target.closest('button'))return;
    e.preventDefault();if(game.running){input[control]=true;if(control==='jump'&&!e.repeat)jumpQueued=true;}
  });
  document.addEventListener('keyup',e=>{const control=keyControls[e.key];if(control)input[control]=false;});
  const pause=()=>{clearInput();if(game.running){game.running=false;updateUI();}};
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  for(const button of document.querySelectorAll('[data-control]')){
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(game.running){input[button.dataset.control]=true;if(button.dataset.control==='jump')jumpQueued=true;}});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>input[button.dataset.control]=false);
  }
  $('#help-open').addEventListener('click',()=>{pause();if($('#help').showModal)$('#help').showModal();else $('#help').setAttribute('open','');});
  for(const id of ['#help-close','#help-start'])$(id).addEventListener('click',()=>{if($('#help').close)$('#help').close();else $('#help').removeAttribute('open');});
}
function rect(x,y,w,h,fill,r=0){
  ctx.fillStyle=fill;ctx.beginPath();const radius=Math.max(0,Math.min(r,w/2,h/2));
  ctx.moveTo(x+radius,y);ctx.lineTo(x+w-radius,y);ctx.quadraticCurveTo(x+w,y,x+w,y+radius);ctx.lineTo(x+w,y+h-radius);ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);ctx.lineTo(x+radius,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-radius);ctx.lineTo(x,y+radius);ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();ctx.fill();
}
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
function drawPlayer(){
  const p=game.player,cx=p.x+p.w/2,cy=p.y,walk=game.running&&Math.abs(p.vx)>10&&p.grounded?Math.sin(clock*15)*4:0;
  ctx.save();ctx.translate(cx,cy);ctx.scale(.8,.8);
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
function drawGround(){
  for(const r of game.level.regions){
    const g=ctx.createLinearGradient(0,r.y,0,500);g.addColorStop(0,'#7d8f6e');g.addColorStop(1,'#697e61');rect(r.x,r.y,r.w,r.h,g);
    rect(r.x,r.y,r.w,4,'#a6b98a');
    for(let x=r.x+5;x<r.x+r.w;x+=15)line(x,r.y+2,x-2,r.y-3-(x%7),'#91a978',1.5);
    for(let x=r.x+20;x<r.x+r.w;x+=45)for(let y=r.y+20;y<500;y+=35)line(x,y,x+13,y+3,'#d4dec220');
  }
}
function drawGoal(){
  const[px,py]=game.level.goal;
  ctx.save();ctx.shadowColor='#f3dba0';ctx.shadowBlur=20;rect(px-22,py-66,44,66,'#f7f1c377',15);ctx.restore();
  rect(px-24,py-66,6,66,'#b26348',1);rect(px+18,py-66,6,66,'#b26348',1);rect(px-34,py-72,68,7,'#ad553e',2);rect(px-29,py-59,58,5,'#c77e55',1);rect(px-25,py-9,9,9,'#8a8565',1);rect(px+16,py-9,9,9,'#8a8565',1);
  text('終',px,py-38,17,'#a36143');text('GOAL',px,py+15,8,'#f1f0d9','sans-serif');
}
function draw(){
  if(!game)return;drawBackground();drawGround();
  for(const glyph of game.placed)ctx.drawImage(glyph.mask.canvas,glyph.x,glyph.y);
  if(!game.running&&!game.won){
    const[sx,sy]=game.level.start;text('START',sx+8,sy+15,8,'#ecedde','sans-serif');
    if(hover){
      const existing=game.glyphAt(hover.x,hover.y);
      if(existing){ctx.save();ctx.setLineDash([3,5]);ctx.strokeStyle='#a1664d77';ctx.strokeRect(existing.x-4,existing.y-4,existing.size+8,existing.size+8);text('クリックで回収',existing.x+existing.size/2,existing.y-12,10,'#9c6d53','sans-serif');ctx.restore();}
      else{const{x,y}=placementPosition(hover),mask=makeGlyph(selected,letterSize),allowed=game.canPlace(x,y,letterSize,mask)&&game.remaining>0;ctx.save();ctx.globalAlpha=allowed?.45:.18;ctx.drawImage(mask.canvas,x,y);ctx.setLineDash([2,5]);ctx.strokeStyle=allowed?'#718664':'#b0654c';ctx.strokeRect(x,y,letterSize,letterSize);ctx.restore();}
    }
  }
  drawGoal();drawPlayer();
  for(let i=0;i<5;i++){const x=(i*237+clock*(9+i))%1040-20,y=(i*97+Math.sin(clock*.3+i)*12)%430;ctx.save();ctx.translate(x,y);ctx.rotate(clock*.5+i);ctx.fillStyle='#a8b38d66';ctx.beginPath();ctx.ellipse(0,0,4,1.6,0,0,Math.PI*2);ctx.fill();ctx.restore();}
}
function onWin(){
  clearInput();completed.add(game.index);try{localStorage.setItem('kotonoha-glyph-completed',JSON.stringify([...completed]));}catch{}
  $('#win-title').textContent=`${game.level.chapter} クリア`;
  $('#win-detail').textContent=`${game.placed.length}文字の道 · ${Math.ceil(game.elapsed)}秒 · ${game.rules.jumpCount}回ジャンプのルール`;
  $('#next-level').textContent=game.index===LEVELS.length-1?'最初の景へ戻る ↺':'次の景へ →';updateUI();tell('あなたの文字が、道になりました。別の漢字やルールでも試してみよう。');
}
function frame(timestamp){
  const delta=Math.min((timestamp-previous)/1000||0,.05);previous=timestamp;clock+=delta;accumulator+=delta;
  while(accumulator>=1/120){game.step(1/120,{...input,jump:input.jump||jumpQueued});jumpQueued=false;accumulator-=1/120;}
  if(game.lastEvent){const event=game.lastEvent;game.lastEvent='';if(event==='win')onWin();else{clearInput();updateUI();tell(event,true);}}
  updateJumpCounter();draw();requestAnimationFrame(frame);
}
async function bootstrap(){
  document.documentElement.setAttribute('data-game-loading','');
  let fontLoaded=false;
  try{const loaded=await document.fonts.load('100 144px "Kotonoha Thin"','漢字');fontLoaded=loaded.length>0;}catch{}
  if(!fontLoaded)glyphFont='"Hiragino Sans","Noto Sans CJK JP",sans-serif';
  game=new Game(0,makeGlyph);setupControls();loadLevel(0);selectWord(selected);tell(fontLoaded?game.level.hint:'細字フォントを取得できなかったため、端末の字体で遊べます。線と当たり判定には同じ字形を使っています。');
  $('#font-loading').hidden=true;draw();document.documentElement.removeAttribute('data-game-loading');document.documentElement.setAttribute('data-game-ready','');requestAnimationFrame(frame);
}
bootstrap().catch(error=>{console.error(error);$('#font-loading').hidden=true;document.documentElement.removeAttribute('data-game-loading');tell('文字の準備に失敗しました。ページを再読み込みしてください。',true);});
