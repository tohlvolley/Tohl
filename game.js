'use strict';
const {Game,LEVELS,WIDTH,HEIGHT,evaluateRule,sentenceParts,isHan,buildMask}=window.Kotonoha;
const $=selector=>document.querySelector(selector);
const canvas=$('#world'),ctx=canvas.getContext('2d');
let game,editor,editorOriginalGame=null,clock=0,previous=0,accumulator=0,composition=false,jumpQueued=false,completed=new Set();
const input={left:false,right:false,jump:false},glyphCache=new Map();
let glyphFont='"Kotonoha Thin","Hiragino Sans","Noto Sans CJK JP",sans-serif';
try{const saved=JSON.parse(localStorage.getItem('kotonoha-one-rule-completed')||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<LEVELS.length));}catch{}
function tell(message,error=false){$('#notice').textContent=message;$('#notice').classList.toggle('error',error);}
function clearInput(){jumpQueued=false;input.left=false;input.right=false;input.jump=false;}
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
  if(glyphCache.size>=128)glyphCache.delete(glyphCache.keys().next().value);
  glyphCache.set(key,mask);return mask;
}
function updateJumpCounter(){
  if(!game)return;
  const text=`残り ${game.jumpsLeft} / ${game.rules.jumpCount} 回`;
  if($('#jump-counter').textContent!==text)$('#jump-counter').textContent=text;
}
function validateDraft(){
  const field=$('#rule-word'),note=$('#rule-validation'),result=evaluateRule(game.level.ruleText||game.level.ruleKind,field.value);
  const designing=editor&&editor.editing,pending=result.ok&&result.word!==game.word;
  field.setAttribute('aria-invalid',String(!composition&&!result.ok));note.classList.toggle('error',!composition&&!result.ok);
  if(composition)note.textContent='変換を確定してから反映できます。';
  else if(!result.ok)note.textContent=result.message;
  else note.textContent=pending?'未反映：確定すると漢字が変わり、旅人と残り回数がスタートの状態に戻ります。':'適用中：ステージの空欄をクリックして書きかえられます。';
  $('#apply-rules').disabled=composition||!result.ok||game.running||game.won||designing;
  $('#play').disabled=game.won||designing||(!game.running&&(composition||!result.ok));
  return result;
}
function syncWorldInput(){
  if(!game)return;const field=$('#rule-word'),[x,y,size]=game.level.letter;
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
function loadLevel(index){clearInput();const assigned=editor&&editor.store.assigned(index);if(assigned){game.loadCustom(assigned);game.index=index;}else game.load(index);syncPlayField();updateUI();tell(game.level.hint);}
function loadCustomStage(level){
  const next=new Game(0,makeGlyph),result=next.loadCustom(level);if(!result.ok)return result;
  game=next;clearInput();syncPlayField();updateUI();return result;
}
function restartLevel(){if(game.index>=0)loadLevel(game.index);else{loadCustomStage(game.level);updateUI();}}
function pointerPosition(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*WIDTH,y:(event.clientY-r.top)/r.height*HEIGHT};}
function setupControls(){
  LEVELS.forEach((level,index)=>{
    const button=document.createElement('button');button.className='chapter';button.textContent=String(index+1);button.title=`STAGE ${index+1}`;button.setAttribute('aria-label',button.title);
    button.addEventListener('click',()=>loadLevel(index));$('#chapters').append(button);
  });
  $('#challenge').addEventListener('click',()=>{document.body.classList.remove('menu-mode');document.body.classList.add('challenge-mode');syncWorldInput();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){game.running=false;clearInput();document.body.classList.remove('challenge-mode');document.body.classList.add('menu-mode');updateUI();}});
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
  $('#retry').addEventListener('click',()=>{game.respawn();game.running=false;clearInput();updateUI();tell('スタートへ戻り、ステージの残り回数をリセットしました。');});
  $('#next-level').addEventListener('click',()=>loadLevel((game.index+1)%LEVELS.length));$('#replay').addEventListener('click',restartLevel);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!editor.editing)return;canvas.setPointerCapture(e.pointerId);editor.pointerDown(pointerPosition(e));});
  canvas.addEventListener('pointermove',e=>{if(editor.editing)editor.pointerMove(pointerPosition(e));});
  canvas.addEventListener('pointerup',e=>{if(editor.editing)editor.pointerUp();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
  canvas.addEventListener('pointercancel',()=>{if(editor)editor.drag=null;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const keyControls={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump'};
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')||e.isComposing||$('#help').open)return;
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
  rect(0,0,1000,500,'#101d31');
  for(let x=0;x<1000;x+=25)line(x,0,x,500,'#20374e45');
  for(let y=0;y<500;y+=25)line(0,y,1000,y,'#20374e45');
  for(let i=0;i<36;i++){const x=(i*137+17)%1000,y=(i*71+51)%270;rect(x,y,i%5===0?3:2,i%5===0?3:2,i%5===0?'#7badc7':'#42647e');}
  // Stepped silhouettes and a square moon keep the scenery on the pixel grid.
  rect(800,55,48,48,'#324d67');rect(809,55,39,39,'#a5d5d3');rect(800,64,39,39,'#c4e6d8');
  for(let i=0;i<19;i++){const x=i*60-40,h=35+(i*47)%115;rect(x,500-h-80,56,h+80,'#172c42');rect(x+8,500-h-92,30,12,'#172c42');}
  for(let i=0;i<13;i++){const x=i*86-20,h=30+(i*31)%80;rect(x,500-h-35,74,h+35,'#1c3549');rect(x+14,500-h-45,32,10,'#1c3549');}
  line(0,475,1000,475,'#2e6b7950');
}
function drawPlayer(){
  const p=game.player,x=Math.round(p.x),y=Math.round(p.y),w=p.w,h=p.h;
  const walk=game.running&&Math.abs(p.vx)>10&&p.grounded?Math.floor(clock*10)%2:0;
  ctx.save();ctx.globalAlpha=game.rules.opacity;
  const unit=Math.max(2,Math.round(w/6)),head=Math.round(h*.32),bodyY=y+head;
  rect(x,y,w,head,'#d9ebc5');rect(x+unit,y-unit,w-unit*2,unit*2,'#2f6470');
  rect(x+(p.facing>0?w-unit*2:unit),y+unit,unit,unit,'#142b3b');
  if(game.rules.round){rect(x+unit,bodyY,w-unit*2,h-head-unit*2,game.rules.color);rect(x,bodyY+unit,w,h-head-unit*4,game.rules.color);}
  else rect(x,bodyY,w,h-head-unit*2,game.rules.color);
  rect(x,bodyY,w,unit,'#ff946e');rect(p.facing>0?x-unit*3:x+w,bodyY+unit,unit*3,unit,'#ff946e');
  rect(x+unit, y+h-unit*(walk?2:1),unit*2,unit*(walk?2:1),'#668bac');
  rect(x+w-unit*3,y+h-unit*(walk?1:2),unit*2,unit*(walk?1:2),'#668bac');
  ctx.restore();
}
function drawGround(level=game.level){
  for(const r of level.regions){
    rect(r.x,r.y,r.w,r.h,'#193c45');rect(r.x,r.y,r.w,4,'#74c7af');rect(r.x,r.y+4,r.w,5,'#315f5a');
    for(let x=r.x+4;x<r.x+r.w;x+=20){rect(x,r.y+12,12,3,'#2e5b60');for(let y=r.y+27;y<r.y+r.h;y+=22)rect(x+4,y,4,4,'#244b54');}
    line(r.x,r.y+1,r.x+r.w,r.y+1,'#a0ffe2');
  }
}
function drawGoal(level=game.level){
  const[px,py]=level.goal,blink=Math.floor(clock*3)%2;
  rect(px-25,py-70,50,70,'#19394b');rect(px-25,py-70,5,70,'#66d7e0');rect(px+20,py-70,5,70,'#66d7e0');rect(px-25,py-70,50,5,'#a6f4ed');
  for(let y=py-59;y<py-6;y+=8)rect(px-15,y,30,2,'#4d9aa54d');
  rect(px-9,py-43,18,6,blink?'#9affcf':'#6ac09d');rect(px+3,py-49,6,18,blink?'#9affcf':'#6ac09d');
  text('EXIT',px,py-85,10,'#83d4d7','PixelJP,monospace');
}
function drawRuleSentence(level,word,mask){
  const[x,y,size]=level.letter,cy=y+size/2,[prefix,suffix]=sentenceParts(level);
  ctx.save();ctx.font='18px PixelJP,monospace';ctx.textBaseline='middle';ctx.fillStyle='#91bad0';
  ctx.textAlign='right';ctx.fillText(prefix,x-12,cy,Math.max(1,x-20));ctx.textAlign='left';ctx.fillText(suffix,x+size+12,cy,Math.max(1,WIDTH-x-size-20));ctx.restore();
  if(mask)ctx.drawImage(mask.canvas,x,y);else if(isHan(word))ctx.drawImage(makeGlyph(word,size).canvas,x,y);else text(word||'?',x+size/2,cy,Math.min(45,size/Math.max(1,Array.from(word).length)),'#ffb49d','PixelJP,monospace');
}
function drawEditorScene(){
  const level=editor.document.data;drawGround(level);drawRuleSentence(level,level.word);
  const[x,y,size]=level.letter;ctx.save();ctx.strokeStyle='#ffcf76';ctx.setLineDash([4,5]);ctx.strokeRect(x,y,size,size);ctx.restore();
  const[sx,sy]=level.start;rect(sx,sy-30,18,30,'#ffe0a4');text('START',sx+9,sy-43,11,'#ffe0a4','PixelJP,monospace');drawGoal(level);
  if(editor.drag){const r=editor.groundRect(editor.drag.start,editor.drag.end);rect(r.x,r.y,r.w,r.h,'#8bf6cb55');ctx.strokeStyle='#b9ffe0';ctx.strokeRect(r.x,r.y,r.w,r.h);}
}
function draw(){
  if(!game)return;drawBackground();
  if(editor&&editor.editing){drawEditorScene();return;}
  drawGround();
  const draft=$('#rule-word').value.trim(),pending=!game.running&&!game.won&&draft!==game.word;
  drawRuleSentence(game.level,pending?draft:game.word,pending?null:game.placed[0].mask);
  const[sx,sy]=game.level.start;text('START',sx+8,sy+15,8,'#8eafc0','PixelJP,monospace');drawGoal();drawPlayer();
}
function onWin(){
  clearInput();if(game.index>=0){completed.add(game.index);try{localStorage.setItem('kotonoha-one-rule-completed',JSON.stringify([...completed]));}catch{}}
  $('#win-title').textContent=game.index>=0?`STAGE ${game.index+1} CLEAR`:'CLEAR';
  $('#win-detail').textContent='';
  $('#next-level').textContent=game.index===LEVELS.length-1?'STAGE 1 へ':'次の STAGE';updateUI();tell('あなたの文字が、道になりました。別の一文字でも、この文を試してみよう。');
}
function frame(timestamp){
  const delta=Math.min((timestamp-previous)/1000||0,.05);previous=timestamp;clock+=delta;accumulator+=delta;
  while(accumulator>=1/120){if(!(editor&&editor.editing))game.step(1/120,{...input,jump:input.jump||jumpQueued});jumpQueued=false;accumulator-=1/120;}
  if(game.lastEvent){const event=game.lastEvent;game.lastEvent='';if(event==='win')onWin();else{clearInput();updateUI();tell(event,true);}}
  updateJumpCounter();draw();requestAnimationFrame(frame);
}
async function bootstrap(){
  document.documentElement.setAttribute('data-game-loading','');
  let fontLoaded=false;
  try{const loaded=await document.fonts.load('100 144px "Kotonoha Thin"','漢字');fontLoaded=loaded.length>0;}catch{}
  try{await document.fonts.load('16px PixelJP','漢字');}catch{}
  if(!fontLoaded)glyphFont='"Hiragino Sans","Noto Sans CJK JP",sans-serif';
  game=new Game(0,makeGlyph);
  editor=new window.KotonohaEditor.StageEditor({makeGlyph,notify:tell,getLevel:()=>({...game.level,word:game.word}),onBegin:()=>{clearInput();game.running=false;editorOriginalGame=game;},onClose:()=>{if(editorOriginalGame){game=editorOriginalGame;editorOriginalGame=null;if(game.index>=0)loadLevel(game.index);}clearInput();syncPlayField();updateUI();},onChange:()=>{if(editor&&editor.editing){clearInput();game.running=false;}updateUI();},loadStage:loadCustomStage});
  setupControls();loadLevel(0);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(syncWorldInput).observe(canvas);else window.addEventListener('resize',syncWorldInput);
  tell(fontLoaded?game.level.hint:'細字フォントを取得できなかったため、端末の字体で遊べます。線と当たり判定には同じ字形を使っています。');
  $('#font-loading').hidden=true;ctx.imageSmoothingEnabled=false;draw();document.documentElement.removeAttribute('data-game-loading');document.documentElement.setAttribute('data-game-ready','');requestAnimationFrame(frame);
}
bootstrap().catch(error=>{console.error(error);$('#font-loading').hidden=true;document.documentElement.removeAttribute('data-game-loading');tell('文字の準備に失敗しました。ページを再読み込みしてください。',true);});
