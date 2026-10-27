'use strict';
const {Game,LEVELS,defaultStage,CITY_BUILDINGS,cityEntryPoint,depthProjection,spikeTriangles,WIDTH,HEIGHT,evaluateStageRule,inputBox,sentenceParts,isHan,buildMask}=window.Kotonoha;
const $=selector=>document.querySelector(selector);
const canvas=$('#world'),ctx=canvas.getContext('2d');
let game,editor,editorOriginalGame=null,clock=0,previous=0,accumulator=0,composition=false,jumpQueued=false,completed=new Set();
const input={left:false,right:false,jump:false,up:false,down:false},glyphCache=new Map();
let glyphFont='"Kotonoha Thin","Hiragino Sans","Noto Sans CJK JP",sans-serif';
try{const saved=JSON.parse(localStorage.getItem('kotonoha-one-rule-completed')||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<100));}catch{}
function tell(message,error=false){$('#notice').textContent=message;$('#notice').classList.toggle('error',error);}
function clearInput(){jumpQueued=false;input.left=false;input.right=false;input.jump=false;input.up=false;input.down=false;}
function makeGlyph(char,size){
  const key=`${char}:${size}`;if(glyphCache.has(key))return glyphCache.get(key);
  // Rasterize the thin font into a 32-dot grid, then scale with nearest-neighbor.
  // The visible pixel sprite itself supplies the collision mask.
  const dots=32,small=document.createElement('canvas');small.width=dots;small.height=dots;
  const ink=small.getContext('2d',{willReadFrequently:true});
  ink.font=`100 ${dots*.9}px ${glyphFont}`;ink.textAlign='center';ink.textBaseline='alphabetic';ink.fillStyle='#8bf6cb';
  const metrics=ink.measureText(char);
  const ascent=Number.isFinite(metrics.actualBoundingBoxAscent)?metrics.actualBoundingBoxAscent:dots*.75;
  const descent=Number.isFinite(metrics.actualBoundingBoxDescent)?metrics.actualBoundingBoxDescent:dots*.05;
  const offset=Number.isFinite(metrics.actualBoundingBoxLeft)?(metrics.actualBoundingBoxLeft-metrics.actualBoundingBoxRight)/2:0;
  ink.fillText(char,dots/2+offset,(dots+ascent-descent)/2);
  const pixels=ink.getImageData(0,0,dots,dots);
  for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]=139;pixels.data[i+1]=246;pixels.data[i+2]=203;pixels.data[i+3]=pixels.data[i+3]>=48?255:0;}
  ink.putImageData(pixels,0,0);
  const surface=document.createElement('canvas');surface.width=size;surface.height=size;
  const scaled=surface.getContext('2d',{willReadFrequently:true});scaled.imageSmoothingEnabled=false;scaled.drawImage(small,0,0,size,size);
  const data=scaled.getImageData(0,0,size,size).data,alpha=new Uint8Array(size*size);
  for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
  const mask=buildMask(size,size,alpha);mask.canvas=surface;
  let area=[...glyphCache.values()].reduce((sum,m)=>sum+m.width*m.height,0);while(glyphCache.size&&(glyphCache.size>=64||area+size*size>6000000)){const first=glyphCache.keys().next().value,old=glyphCache.get(first);area-=old.width*old.height;glyphCache.delete(first);}
  glyphCache.set(key,mask);return mask;
}
function updateJumpCounter(){
  if(!game)return;
  const text=game.word?`残り ${game.jumpsLeft} / ${game.rules.jumpCount} 回`:'残り — 回';
  if($('#jump-counter').textContent!==text)$('#jump-counter').textContent=text;
}
function validateDraft(){
  const field=$('#rule-word'),note=$('#rule-validation'),result=evaluateStageRule(game.level,field.value);
  const designing=editor&&editor.editing,pending=result.ok&&result.word!==game.word;
  field.setAttribute('aria-invalid',String(!!field.value.trim()&&!composition&&!result.ok));note.classList.toggle('error',!composition&&!result.ok);
  if(composition)note.textContent='変換を確定してから反映できます。';
  else if(!result.ok)note.textContent=result.message;
  else note.textContent=pending?'未反映：確定すると漢字が変わり、旅人と残り回数がスタートの状態に戻ります。':'適用中：ステージの空欄をクリックして書きかえられます。';
  $('#apply-rules').disabled=composition||!result.ok||game.running||game.won||designing;
  $('#play').disabled=game.won||designing||(!game.running&&(composition||!result.ok));
  return result;
}
function syncWorldInput(){
  if(!game)return;const field=$('#rule-word'),{x,y,size}=inputBox(game.level);
  field.hidden=!!(editor&&editor.editing);field.disabled=game.running||game.won;
  field.style.left=`${x/WIDTH*100}%`;field.style.top=`${y/HEIGHT*100}%`;field.style.width=`${size/WIDTH*100}%`;field.style.height=`${size/HEIGHT*100}%`;
  field.style.fontSize=`${canvas.getBoundingClientRect().width/WIDTH*size*.8}px`;
}
function updateUI(){
  const designing=editor&&editor.editing,level=designing?editor.document.data:game.level;
  document.body.classList.toggle('editing',!!designing);$('#stage-number').textContent=designing?'EDITOR':game.index>=0?`STAGE ${game.index+1}`:'TEST';$('#stage-title').textContent=level.title;
  $('#scene-kicker').textContent=designing?'地面はドラッグ。道具を選んでステージを描こう。':level.kicker;$('#level-hint').textContent=game.level.hint;
  $('#editor-open').disabled=!!designing;
  $('#mode-tag').textContent=designing?'BUILD MODE':game.won?'CLEAR':game.running?'RUNNING':'INPUT MODE';
  $('#play').textContent=game.running?'停止':'開始';
  $('#retry').disabled=game.won||designing;$('#win-panel').hidden=!game.won||designing;
  $('#glyph-count').textContent=`${game.placed.length} / 1`;
  $('#rule-effect').textContent=game.rule.description+(game.level.ruleKind==='body'?` このステージのジャンプは合計${game.rules.jumpCount}回。着地では回復しません。`:'');
  $('#next-level').hidden=game.index<0;
  document.querySelectorAll('.chapter').forEach((b,i)=>{b.classList.toggle('active',!designing&&i===game.index);b.classList.toggle('complete',completed.has(i));b.setAttribute('aria-current',i===game.index?'step':'false');b.disabled=!!(editor&&editor.active);});
  syncWorldInput();validateDraft();updateJumpCounter();
}
function syncPlayField(){composition=false;$('#rule-word').value=game.word;syncWorldInput();}
function loadLevel(index){clearInput();const assigned=editor&&editor.store.assigned(index);if(assigned){game.loadCustom(assigned);game.index=index;}else game.load(index);game.prepareInput();syncPlayField();updateUI();tell(game.level.hint);}
function loadCustomStage(level){
  const next=new Game(0,makeGlyph),result=next.loadCustom(level);if(!result.ok)return result;
  next.prepareInput();game=next;clearInput();syncPlayField();updateUI();return result;
}
function restartLevel(){if(game.index>=0)loadLevel(game.index);else{loadCustomStage(game.level);updateUI();}}
function pointerPosition(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*WIDTH,y:(event.clientY-r.top)/r.height*HEIGHT};}
let menuWasRunning=false;
function setScreen(screen){
  document.body.dataset.screen=screen;
  document.body.classList.toggle('challenge-mode',screen==='play');
  document.body.classList.toggle('menu-mode',screen!=='play');
  clearInput();if(screen!=='play')game.running=false;
  if(screen==='list')renderStageCards();
  syncWorldInput();
}
function renderStageCards(){
  const holder=$('#stage-cards');holder.replaceChildren();
  $('#stage-count').value=editor.store.count();
  for(let index=0;index<editor.store.count();index++){
    const button=document.createElement('button');
    button.className='stage-card';button.type='button';button.setAttribute('aria-label',`STAGE ${index+1}`);
    const number=document.createElement('strong');number.className='stage-thumbnail';number.textContent=String(index+1);
    button.append(number);button.addEventListener('click',()=>{loadLevel(index);setScreen('play');$('#play').focus({preventScroll:true});});holder.append(button);
  }
}
function closeStageMenu(resume=false){
  $('#stage-menu').close();
  if(resume&&menuWasRunning&&!game.won){game.running=true;updateUI();canvas.focus({preventScroll:true});}
  menuWasRunning=false;
}
function openStageMenu(){
  if($('#stage-menu').open)return;
  menuWasRunning=game.running;game.running=false;clearInput();updateUI();
  $('#menu-editor').hidden=!editor.testing;$('#stage-menu').showModal();
}
function setupControls(){
  $('#stage-count-save').addEventListener('click',()=>{const result=editor.store.setCount(Number($('#stage-count').value));$('#stage-count-message').textContent=result.ok?'ステージ数を変更しました。各番号への設定は保持されます。':result.message;if(result.ok)renderStageCards();});
  $('#home-stages').disabled=false;$('#home-editor').disabled=false;
  $('#home-stages').addEventListener('click',()=>{setScreen('list');$('#list-title').focus();});
  $('#list-home').addEventListener('click',()=>{setScreen('home');$('#home-stages').focus();});
  $('#home-editor').addEventListener('click',()=>editor.open());
  $('#stage-menu-open').addEventListener('click',openStageMenu);
  $('#menu-resume').addEventListener('click',()=>closeStageMenu(true));
  $('#menu-restart').addEventListener('click',()=>{closeStageMenu();restartLevel();});
  $('#menu-stages').addEventListener('click',()=>{closeStageMenu();if(editor.active)editor.close();setScreen('list');$('#list-title').focus();});
  $('#menu-editor').addEventListener('click',()=>{closeStageMenu();$('#editor-return').click();});
  $('#stage-menu').addEventListener('cancel',e=>{e.preventDefault();closeStageMenu(true);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.isComposing&&document.body.dataset.screen==='play'&&!$('#stage-menu').open&&!$('#help').open){e.preventDefault();openStageMenu();}});
  const field=$('#rule-word');
  field.addEventListener('compositionstart',()=>{composition=true;validateDraft();});
  field.addEventListener('compositionend',()=>{composition=false;validateDraft();});
  field.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||composition||e.keyCode===229))e.preventDefault();});
  field.addEventListener('input',()=>{const result=validateDraft();tell(result.ok?'':result.message,!result.ok&&!composition);draw();});
  $('#rules-form').addEventListener('submit',e=>{
    e.preventDefault();if(composition)return;
    const result=game.applyRule($('#rule-word').value);
    if(result.ok){clearInput();$('#rule-word').value=game.word;updateUI();}
    else validateDraft();
    tell(result.message,!result.ok);
  });
  $('#play').addEventListener('click',()=>{
    if(game.won)return;if(!game.running){const result=game.applyRule(field.value);if(!result.ok){tell(result.message,true);return;}}game.running=!game.running;clearInput();updateUI();
    tell(game.running?`← → で移動。Spaceを押し直すと、このステージで残り${game.jumpsLeft}回ジャンプできます。着地しても回復しません。`:'時間を止めました。ステージ内の空欄で漢字を変えられます。');
    if(game.running)canvas.focus({preventScroll:true});
  });
  $('#retry').addEventListener('click',()=>{game.prepareInput();clearInput();syncPlayField();updateUI();tell('漢字を入力して、もう一度開始できます。');});
  $('#next-level').addEventListener('click',()=>loadLevel((game.index+1)%editor.store.count()));$('#replay').addEventListener('click',restartLevel);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!editor.editing)return;canvas.setPointerCapture(e.pointerId);editor.pointerDown(pointerPosition(e));});
  canvas.addEventListener('pointermove',e=>{if(editor.editing)editor.pointerMove(pointerPosition(e));});
  canvas.addEventListener('pointerup',e=>{if(editor.editing)editor.pointerUp();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
  canvas.addEventListener('pointercancel',()=>{if(editor){editor.drag=null;editor.erasing=false;}});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const keyControls={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',' ':'jump'};
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')||e.isComposing||$('#help').open||$('#stage-menu').open||document.body.dataset.screen!=='play'&&!(editor&&editor.editing))return;
    if(editor&&editor.editing){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)editor.document.redo();else editor.document.undo();editor.sync();}return;}
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
function drawBackground(){
  const level=editor&&editor.editing?editor.document.data:game.level;if(level.background==='black'){rect(0,0,1000,500,'#000000');return;}
  rect(0,0,1000,500,'#101d31');
  for(let x=0;x<1000;x+=25)line(x,0,x,500,'#20374e45');
  for(let y=0;y<500;y+=25)line(0,y,1000,y,'#20374e45');
  for(let i=0;i<36;i++){const x=(i*137+17)%1000,y=(i*71+51)%270;rect(x,y,i%5===0?3:2,i%5===0?3:2,i%5===0?'#7badc7':'#42647e');}
  // Stepped silhouettes and a square moon keep the scenery on the pixel grid.
  rect(800,55,48,48,'#324d67');rect(809,55,39,39,'#a5d5d3');rect(800,64,39,39,'#c4e6d8');
  drawCityBuildings();
  line(0,475,1000,475,'#2e6b7950');
}
function drawCityBuildings(){
  for(const r of CITY_BUILDINGS){
    rect(r.x,r.y,r.w,r.h,'#1c3549');rect(r.x,r.y,3,r.h,'#24445a');rect(r.x,r.y,r.w,3,'#2a4a60');
    for(let x=r.x+12;x<r.x+r.w-8;x+=20)for(let y=r.y+16;y<HEIGHT;y+=30)rect(x,y,5,8,'#28475a');
  }
}
function drawDepthPlayer(){
  const p=game.player,d=p.depth;if(!d)return;const point=depthProjection(p),u=Math.max(1,Math.round(p.w*point.scale/7)),hood=u*5,color=game.rules.color;
  ctx.save();ctx.globalAlpha=game.rules.opacity;ctx.translate(Math.round(point.x),Math.round(point.y));ctx.rotate(d.facing);
  const stride=game.running&&Math.hypot(p.vx,p.vy)>8?Math.round(Math.sin(clock*16)*u):0;
  // Seen from the head: hood in the centre, shoulders, hands and tied cloth behind it.
  rect(-hood/2-u,-u,u,3*u+stride,color);rect(hood/2,-u,u,3*u-stride,color);
  rect(-2*u,2*u+stride,u*2,u*2,color);rect(u,2*u-stride,u*2,u*2,color);
  rect(-hood/2,-hood/2,hood,hood,color);rect(-hood/2-u,-u,hood+2*u,2*u,color);
  rect(-u,hood/2,u,3*u,color);rect(0,hood/2+2*u,3*u,u,color);ctx.restore();
}
function drawPlayer(){
  if(game.rules.gravityDirection==='back'){drawDepthPlayer();return;}
  const p=game.player,w=p.w,h=p.h,u=Math.max(1,Math.round(w/7)),moving=game.running&&Math.abs(p.vx)>8,air=!p.grounded&&!p.climbing;
  const stride=moving?Math.sin(clock*18):0,lean=moving?p.facing*u:0,x=Math.round(p.x),y=Math.round(p.y)+(moving&&!air?u:0),head=Math.round(h*.3),color=game.rules.color;
  ctx.save();ctx.globalAlpha=game.rules.opacity;
  // Hood, tied headband and trailing cloth share the rule-selected outfit colour.
  rect(x+u+lean,y,w-u*2,head,color);rect(x+lean,y+u,w,head-u,color);
  const tailX=p.facing>0?x-u*3:x+w;rect(tailX,y+head-u,u*3,u,color);rect(tailX+(p.facing>0?-u:u*2),y+head+Math.round(Math.sin(clock*13)*u),u*2,u,color);
  const bodyY=y+head,bodyH=Math.max(4,Math.round(h*.4));rect(x+u,bodyY,w-u*2,bodyH,color);
  if(p.climbing){rect(x-u,bodyY-u,u*2,bodyH,color);rect(x+w-u,bodyY-u*2,u*2,bodyH,color);}
  else {const armY=bodyY+(air?0:Math.round(bodyH*.4));rect(x+(p.facing>0?-u:u+w-u),armY,u*2,Math.max(u*2,bodyH/2),color);}
  const legY=bodyY+bodyH,legH=Math.max(u,h-head-bodyH-(moving?u:0));
  if(air){rect(x,legY,w/2,Math.max(u*2,legH-u),color);rect(x+w/2,legY-u,w/2,Math.max(u*2,legH-u),color);}
  else {rect(x+u+Math.round(stride*u),legY,u*2,legH-Math.max(0,Math.round(stride*u)),color);rect(x+w-u*3-Math.round(stride*u),legY,u*2,legH-Math.max(0,Math.round(-stride*u)),color);}
  ctx.restore();
}
const terrainImages=new WeakMap();
function drawGround(level=game.level){
  if(!terrainImages.has(level.regions)){
    const surface=document.createElement('canvas');surface.width=WIDTH;surface.height=HEIGHT;const c=surface.getContext('2d'),filled=new Uint8Array(WIDTH*HEIGHT);
    for(const r of level.regions)for(let y=r.y;y<r.y+r.h;y++)filled.fill(1,y*WIDTH+r.x,y*WIDTH+r.x+r.w);
    c.fillStyle='#193c45';c.beginPath();for(const r of level.regions)c.rect(r.x,r.y,r.w,r.h);c.fill();c.save();c.clip();
    c.fillStyle='#2e5b60';for(let y=10;y<HEIGHT;y+=25)for(let x=5;x<WIDTH;x+=25)c.fillRect(x,y,12,3);
    c.fillStyle='#244b54';for(let y=20;y<HEIGHT;y+=25)for(let x=12;x<WIDTH;x+=25)c.fillRect(x,y,4,3);c.restore();
    for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){const i=y*WIDTH+x;if(!filled[i])continue;
      if(!y||!filled[i-WIDTH]){c.fillStyle='#a0ffe2';c.fillRect(x,y,1,1);}
      else if(x===0||x===WIDTH-1||!filled[i-1]||!filled[i+1]||y===HEIGHT-1||!filled[i+WIDTH]){c.fillStyle='#41756d';c.fillRect(x,y,1,1);}
    }
    terrainImages.set(level.regions,surface);
  }
  ctx.drawImage(terrainImages.get(level.regions),0,0);
}
function drawGoal(level=game.level){
  if(game.rules.gravityDirection==='back'&&!(editor&&editor.editing)&&level===game.level){const goal=cityEntryPoint(level,level.goal[0],level.goal[1]-80);ctx.strokeStyle='#83d4d7';ctx.lineWidth=2;ctx.strokeRect(goal.x-10,goal.y-10,20,20);text('EXIT',goal.x,goal.y-20,9,'#83d4d7','PixelJP,monospace');return;}
  const[px,py]=level.goal,blink=Math.floor(clock*3)%2;
  rect(px-25,py-70,50,70,'#19394b');rect(px-25,py-70,5,70,'#66d7e0');rect(px+20,py-70,5,70,'#66d7e0');rect(px-25,py-70,50,5,'#a6f4ed');
  for(let y=py-59;y<py-6;y+=8)rect(px-15,y,30,2,'#4d9aa54d');
  rect(px-9,py-43,18,6,blink?'#9affcf':'#6ac09d');rect(px+3,py-49,6,18,blink?'#9affcf':'#6ac09d');
  text('EXIT',px,py-85,10,'#83d4d7','PixelJP,monospace');
}
function drawObjects(level=game.level,editing=false){
  const objects=editing?(level.objects||[]):game.objects;
  for(const o of objects){
    if(o.type==='crumble'){
      if(o.broken)continue;
      const remaining=Math.max(0,o.delay-(o.used||0)),warning=remaining<o.delay*.4;
      rect(o.x,o.y,o.w,o.h,warning?'#74423c':'#674f37');rect(o.x,o.y,o.w,4,warning?'#ff9782':'#ffcf76');
      for(let x=o.x+10;x<o.x+o.w;x+=22){line(x,o.y+5,x+5,o.y+12,'#251f29',2);line(x+5,o.y+12,x+1,o.y+21,'#251f29',2);}
      text(`${remaining.toFixed(1)}s`,o.x+o.w/2,o.y+Math.min(16,o.h/2),11,'#ffe5b0','PixelJP,monospace');
    }else if(o.type==='vine'){
      for(let x=o.x+o.w/2;x<o.x+o.w;x+=30){rect(x-2,o.y,4,o.h,'#73be83');for(let y=o.y+6;y<o.y+o.h;y+=18){rect(x-11,y,9,5,'#449768');rect(x+2,y+7,9,5,'#89d39a');}}
      if(editing){ctx.strokeStyle='#529d7077';ctx.strokeRect(o.x,o.y,o.w,o.h);}
    }else if(o.type==='spike'){
      ctx.fillStyle='#f49aa5';for(const triangle of spikeTriangles(o)){ctx.beginPath();ctx.moveTo(...triangle[0]);for(const point of triangle.slice(1))ctx.lineTo(...point);ctx.closePath();ctx.fill();}

    }
  }
}
function drawRuleSentence(level,word,mask){
  const[x,y,size]=level.letter,{x:bx,y:by,size:bs}=inputBox(level),cy=by+bs/2,[prefix,suffix]=sentenceParts(level);
  ctx.save();if(level===game.level&&game.rules.gravityDirection==='back'&&!(editor&&editor.editing))ctx.globalAlpha*=.22;
  if(mask)ctx.drawImage(mask.canvas,x,y);else if(isHan(word))ctx.drawImage(makeGlyph(word,size).canvas,x,y);ctx.restore();
  if(bs!==size&&isHan(word)){rect(bx-6,by-6,bs+12,bs+12,'#101d31ed');ctx.drawImage(makeGlyph(word,bs).canvas,bx,by);}
  ctx.save();ctx.font='18px PixelJP,monospace';ctx.textBaseline='middle';ctx.fillStyle='#91bad0';
  ctx.textAlign='right';ctx.fillText(prefix,bx-12,cy,Math.max(1,bx-20));ctx.textAlign='left';ctx.fillText(suffix,bx+bs+12,cy,Math.max(1,WIDTH-bx-bs-20));ctx.restore();
  if(word&&!isHan(word))text(word,bx+bs/2,cy,Math.min(45,bs/Math.max(1,Array.from(word).length)),'#ffb49d','PixelJP,monospace');
}
function drawEditorScene(){
  const level=editor.document.data;drawGround(level);drawObjects(level,true);drawRuleSentence(level,level.word);
  const[x,y,size]=level.letter;ctx.save();ctx.strokeStyle='#ffcf76';ctx.setLineDash([4,5]);ctx.strokeRect(x,y,size,size);ctx.restore();
  const[sx,sy]=level.start;rect(sx,sy-30,18,30,'#ffe0a4');text('START',sx+9,sy-43,11,'#ffe0a4','PixelJP,monospace');drawGoal(level);
  if(editor.drag){const r=editor.groundRect(editor.drag.start,editor.drag.end);rect(r.x,r.y,r.w,r.h,'#8bf6cb55');ctx.strokeStyle='#b9ffe0';ctx.strokeRect(r.x,r.y,r.w,r.h);}
}
function draw(){
  if(!game)return;drawBackground();
  if(editor&&editor.editing){drawEditorScene();return;}
  ctx.save();if(game.rules.gravityDirection==='back')ctx.globalAlpha=.22;drawGround();drawObjects();ctx.restore();
  const draft=$('#rule-word').value.trim(),pending=!game.running&&!game.won&&draft!==game.word;
  drawRuleSentence(game.level,pending?draft:game.word,pending?null:game.placed[0]?.mask);
  const[sx,sy]=game.level.start;text('START',sx+8,sy+15,8,'#8eafc0','PixelJP,monospace');drawGoal();drawPlayer();
}
function onWin(){
  clearInput();if(game.index>=0){completed.add(game.index);try{localStorage.setItem('kotonoha-one-rule-completed',JSON.stringify([...completed]));}catch{}}
  $('#win-title').textContent=game.index>=0?`STAGE ${game.index+1} CLEAR`:'CLEAR';
  $('#win-detail').textContent='';
  $('#next-level').textContent=game.index===editor.store.count()-1?'STAGE 1 へ':'次の STAGE';updateUI();tell('あなたの文字が、道になりました。別の一文字でも、この文を試してみよう。');
}
function frame(timestamp){
  const delta=Math.min((timestamp-previous)/1000||0,.05);previous=timestamp;clock+=delta;accumulator+=delta;
  while(accumulator>=1/120){if(!(editor&&editor.editing))game.step(1/120,{...input,jump:input.jump||jumpQueued});jumpQueued=false;if(game.lastEvent==='restart'){clearInput();accumulator=0;break;}accumulator-=1/120;}
  if(game.lastEvent){const event=game.lastEvent;game.lastEvent='';if(event==='win')onWin();else{clearInput();updateUI();tell(event==='restart'?'':event,event!=='restart');}}
  updateJumpCounter();draw();requestAnimationFrame(frame);
}
async function bootstrap(){
  document.documentElement.setAttribute('data-game-loading','');
  let fontLoaded=false;
  try{const loaded=await document.fonts.load('100 144px "Kotonoha Thin"','漢字');fontLoaded=loaded.length>0;}catch{}
  try{await document.fonts.load('16px PixelJP','漢字');}catch{}
  if(!fontLoaded)glyphFont='"Hiragino Sans","Noto Sans CJK JP",sans-serif';
  game=new Game(0,makeGlyph);
  editor=new window.KotonohaEditor.StageEditor({makeGlyph,notify:tell,getLevel:()=>({...game.level,word:game.word||game.level.word}),onBegin:()=>{clearInput();game.running=false;editorOriginalGame=game;},onClose:()=>{if(editorOriginalGame){game=editorOriginalGame;editorOriginalGame=null;if(game.index>=0)loadLevel(game.index);}clearInput();syncPlayField();updateUI();setScreen('home');},onChange:()=>{if(editor&&editor.editing){clearInput();game.running=false;setScreen('editor');}else if(editor&&editor.testing)setScreen('play');updateUI();},loadStage:loadCustomStage});
  setupControls();loadLevel(0);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(syncWorldInput).observe(canvas);else window.addEventListener('resize',syncWorldInput);
  tell(fontLoaded?game.level.hint:'細字フォントを取得できなかったため、端末の字体で遊べます。線と当たり判定には同じ字形を使っています。');
  $('#font-loading').hidden=true;ctx.imageSmoothingEnabled=false;draw();document.documentElement.removeAttribute('data-game-loading');document.documentElement.setAttribute('data-game-ready','');requestAnimationFrame(frame);
}
bootstrap().catch(error=>{console.error(error);$('#font-loading').hidden=true;document.documentElement.removeAttribute('data-game-loading');tell('文字の準備に失敗しました。ページを再読み込みしてください。',true);});
