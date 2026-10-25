(function(root){
'use strict';
const api=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.Kotonoha;
const {validateStage,LEVELS,WIDTH,HEIGHT}=api;
const clone=value=>JSON.parse(JSON.stringify(value));
class StageDocument{
  constructor(level){this.data=clone(level);this.past=[];this.future=[];}
  change(edit){const next=clone(this.data);edit(next);if(JSON.stringify(next)===JSON.stringify(this.data))return;this.past.push(clone(this.data));if(this.past.length>50)this.past.shift();this.data=next;this.future=[];}
  undo(){if(!this.past.length)return false;this.future.push(clone(this.data));this.data=this.past.pop();return true;}
  redo(){if(!this.future.length)return false;this.past.push(clone(this.data));this.data=this.future.pop();return true;}
}
class StageStore{
  constructor(storage){this.storage=storage;this.key='kotonoha-custom-stages-v1';}
  read(){
    try{const raw=this.storage&&this.storage.getItem(this.key);if(raw===null||raw===undefined)return {ok:true,records:[]};const data=JSON.parse(raw);
      if(!Array.isArray(data)||data.length>20)return {ok:false,records:[],message:'保存データを読めません。元のデータは上書きしていません。'};
      const ids=new Set(),records=[];
      for(const record of data){const result=validateStage(record&&record.stage);if(!record||typeof record.id!=='string'||!record.id||record.id.length>80||ids.has(record.id)||!result.ok)return {ok:false,records:[],message:'保存データの一部が不正です。元のデータは上書きしていません。'};ids.add(record.id);records.push({id:record.id,stage:result.level});}
      return {ok:true,records};
    }catch{return {ok:false,records:[],message:'このブラウザの保存領域を読めません。JSONへの書き出しは利用できます。'};}
  }
  write(records){try{if(!this.storage)throw Error();this.storage.setItem(this.key,JSON.stringify(records));return {ok:true};}catch{return {ok:false,message:'ブラウザに保存できませんでした。下書きは残っています。JSONを書き出して保存してください。'};}}
  save(source,id){const checked=validateStage(source);if(!checked.ok)return checked;const current=this.read();if(!current.ok)return current;
    const records=current.records,index=id?records.findIndex(r=>r.id===id):-1;
    if(index<0&&records.length>=20)return {ok:false,message:'保存は20ステージまでです。JSONに書き出すか、不要なステージを削除してください。'};
    const record={id:index>=0?id:`stage-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,stage:checked.level};
    if(index>=0)records[index]=record;else records.push(record);
    const result=this.write(records);return result.ok?{ok:true,record}:result;
  }
  assigned(index){
    try{const data=JSON.parse(this.storage.getItem('kotonoha-stage-slots-v1')||'{}');const result=validateStage(data[index]);return result.ok?result.level:null;}catch{return null;}
  }
  assign(index,stage){
    const checked=stage===null?{ok:true}:validateStage(stage);if(!checked.ok)return checked;
    try{const data=JSON.parse(this.storage.getItem('kotonoha-stage-slots-v1')||'{}');if(stage===null)delete data[index];else data[index]=checked.level;this.storage.setItem('kotonoha-stage-slots-v1',JSON.stringify(data));return {ok:true};}catch{return {ok:false,message:'STAGE の設定を保存できませんでした。'};}
  }
  remove(id){const current=this.read();if(!current.ok)return current;const record=current.records.find(r=>r.id===id);if(!record)return {ok:false,message:'保存したステージが見つかりません。'};const result=this.write(current.records.filter(r=>r.id!==id));return result.ok?{ok:true,record}:result;}
  restore(record){const current=this.read();if(!current.ok)return current;if(current.records.some(r=>r.id===record.id)||current.records.length>=20)return {ok:false,message:'このステージを戻せません。'};const checked=validateStage(record.stage);if(!checked.ok)return checked;return this.write([...current.records,{id:record.id,stage:checked.level}]);}
}
function encodeStage(source){const checked=validateStage(source);return checked.ok?{ok:true,text:JSON.stringify({format:'kotonoha-stage',version:1,stage:checked.level},null,2)}:checked;}
function decodeStage(text){if(typeof text!=='string'||text.length>100000)return {ok:false,message:'ステージファイルは100KB以内のJSONにしてください。'};try{const data=JSON.parse(text);if(!data||data.format!=='kotonoha-stage'||data.version!==1)return {ok:false,message:'この形式のステージファイルには対応していません。'};return validateStage(data.stage);}catch{return {ok:false,message:'JSONを読み込めませんでした。ファイルの内容を確認してください。'};}}
class StageEditor{
  constructor(options){
    this.options=options;this.editing=false;this.testing=false;this.active=false;this.tool='ground';this.document=null;this.currentId=null;this.drag=null;this.deleted=null;
    let storage;try{storage=localStorage;}catch{storage=null;}this.store=new StageStore(storage);this.bind();this.renderLibrary();
  }
  notify(message,error=false){this.options.notify(message,error);}
  begin(){if(!this.active){this.options.onBegin();this.active=true;}}
  open(){this.begin();if(!this.document||!this.testing){this.document=new StageDocument(this.options.getLevel());this.currentId=null;}this.editing=true;this.testing=false;this.drag=null;this.sync();this.notify('地面はドラッグ、スタート・ゴール・入力欄は道具を選んでクリックします。');}
  openRecord(record){this.begin();this.document=new StageDocument(record.stage);this.currentId=record.id;this.editing=true;this.testing=false;this.sync();this.notify('保存したステージを読み込みました。編集または試遊できます。');}
  close(){this.editing=false;this.testing=false;this.active=false;this.document=null;this.currentId=null;this.options.onClose();this.sync();}
  changed(){this.sync();}
  sync(){
    const $=s=>document.querySelector(s);$('#editor-panel').hidden=!this.editing;$('#play-sidebar').hidden=this.editing;$('#editor-return').hidden=!this.testing;$('#rule-word').hidden=this.editing;
    $('.canvas-wrap').classList.toggle('studio-mode',this.editing);$('#editor-open').disabled=this.editing;$('#editor-open').textContent=this.testing?'↶ ステージ編集に戻る':'＋ ステージを作る';
    if(this.document){const d=this.document.data;$('#editor-title').value=d.title;$('#editor-rule-text').value=d.ruleText||(d.ruleKind==='jumps'?'このステージで［字］回まで飛べる。':'体が［字］くなる。');$('#editor-word').value=d.word;$('#editor-jumps').value=d.baseJumps;$('#editor-size').value=d.letter[2];$('#editor-size-value').textContent=d.letter[2];$('#base-jumps-wrap').hidden=false;document.querySelectorAll('[name="sentence-kind"]').forEach(r=>r.checked=r.value===d.ruleKind);$('#editor-summary').textContent=`地面 ${d.regions.length} / 60個 · 入力欄 (${d.letter[0]}, ${d.letter[1]}) · 空欄は一つ`;
      $('#editor-undo').disabled=!this.document.past.length;$('#editor-redo').disabled=!this.document.future.length;
    }
    document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===this.tool)));
    const tips={ground:'ドラッグして長方形の地面を描きます。クリックだけなら25px四方です。',start:'地面の上端をクリックして、スタート（足元の位置）を置きます。',goal:'地面の上端をクリックして、ゴールを置きます。',rule:'クリックした場所に、文章と漢字の入力欄をまとめて置きます。',erase:'消したい地面をクリックします。「元に戻す」で復元できます。'};
    $('#editor-tool-help').textContent=tips[this.tool];this.options.onChange();
  }
  readFields(){if(!this.document)return;const $=s=>document.querySelector(s);this.document.change(d=>{d.title=$('#editor-title').value;d.ruleText=$('#editor-rule-text').value;d.word=$('#editor-word').value.trim();d.baseJumps=Number($('#editor-jumps').value);});}
  check(){this.readFields();return validateStage(this.document.data,this.options.makeGlyph);}
  test(){const checked=this.check();if(!checked.ok){this.notify(checked.message,true);this.sync();return;}const result=this.options.loadStage(checked.level);if(!result.ok){this.notify(result.message,true);return;}this.editing=false;this.testing=true;this.sync();this.notify('試遊モードです。「旅をはじめる」で開始し、「編集に戻る」で下書きに戻れます。');}
  save(copy=false){const checked=this.check();if(!checked.ok){this.notify(checked.message,true);return;}const result=this.store.save(checked.level,copy?null:this.currentId);if(!result.ok){this.notify(result.message,true);return;}this.currentId=result.record.id;this.document.data=clone(result.record.stage);this.sync();this.renderLibrary();this.notify('このブラウザにステージを保存しました。別の端末へはJSONで持ち出せます。');}
  export(){const checked=this.check();if(!checked.ok){this.notify(checked.message,true);return;}const encoded=encodeStage(checked.level);if(!encoded.ok){this.notify(encoded.message,true);return;}const url=URL.createObjectURL(new Blob([encoded.text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`${checked.level.title.replace(/[^\p{L}\p{N}_-]/gu,'_')||'stage'}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);this.notify('ステージのJSONを書き出しました。');}
  async import(file){if(!file)return;if(file.size>100000){this.notify('ステージファイルは100KB以内にしてください。',true);return;}let result;try{result=decodeStage(await file.text());}catch{result={ok:false,message:'ファイルを読めませんでした。'};}if(!result.ok){this.notify(result.message,true);return;}const checked=validateStage(result.level,this.options.makeGlyph);if(!checked.ok){this.notify(checked.message,true);return;}this.begin();this.document=new StageDocument(checked.level);this.currentId=null;this.editing=true;this.testing=false;this.sync();this.notify('JSONを読み込みました。端末に残すには「端末に保存」を押してください。');}
  renderLibrary(){const holder=document.querySelector('#saved-stages');holder.replaceChildren();const result=this.store.read();if(!result.ok||!result.records.length){const note=document.createElement('p');note.className='saved-empty';note.textContent=result.ok?'まだ保存されたステージはありません。':result.message;holder.append(note);return;}
    for(const record of result.records){const row=document.createElement('div');row.className='saved-stage';const load=document.createElement('button');load.type='button';load.textContent=record.stage.title;load.title='読み込んで編集・試遊';load.addEventListener('click',()=>this.openRecord(record));const del=document.createElement('button');del.type='button';del.className='delete-stage';del.textContent='×';del.setAttribute('aria-label',`${record.stage.title}を削除`);del.addEventListener('click',()=>{const removed=this.store.remove(record.id);if(!removed.ok){this.notify(removed.message,true);return;}this.deleted=removed.record;if(this.currentId===record.id)this.currentId=null;document.querySelector('#restore-stage').hidden=false;this.renderLibrary();this.notify('保存したステージを削除しました。直前の削除は下のボタンで戻せます。');});row.append(load,del);holder.append(row);}
  }
  snap(point){return {x:Math.max(0,Math.min(975,Math.round(point.x/25)*25)),y:Math.max(75,Math.min(475,Math.round(point.y/25)*25))};}
  groundRect(a,b){const left=Math.min(a.x,b.x),top=Math.min(a.y,b.y);return{x:left,y:top,w:Math.min(WIDTH-left,Math.max(25,Math.abs(a.x-b.x))),h:Math.min(HEIGHT-top,Math.max(25,Math.abs(a.y-b.y))) };}
  pointerDown(point){if(!this.editing)return false;const p=this.snap(point),d=this.document.data;
    if(this.tool==='ground'){this.drag={start:p,end:p};return true;}
    this.document.change(next=>{
      if(this.tool==='erase'){for(let i=next.regions.length-1;i>=0;i--){const r=next.regions[i];if(point.x>=r.x&&point.x<=r.x+r.w&&point.y>=r.y&&point.y<=r.y+r.h){next.regions.splice(i,1);break;}}}
      else if(this.tool==='rule'){const size=next.letter[2];next.letter[0]=Math.max(150,Math.min(850-size,Math.round((point.x-size/2)/25)*25));next.letter[1]=Math.max(60,Math.min(495-size,Math.round((point.y-size/2)/25)*25));}
      else {const close=next.regions.filter(r=>point.x>=r.x&&point.x<=r.x+r.w&&Math.abs(point.y-r.y)<45).sort((a,b)=>Math.abs(point.y-a.y)-Math.abs(point.y-b.y))[0];const y=close?close.y:p.y;if(this.tool==='start')next.start=[Math.min(966,p.x),y];if(this.tool==='goal')next.goal=[Math.max(25,Math.min(975,p.x)),y];}
    });this.changed();return true;
  }
  pointerMove(point){if(this.editing&&this.drag)this.drag.end={x:Math.max(0,Math.min(1000,Math.round(point.x/25)*25)),y:Math.max(75,Math.min(500,Math.round(point.y/25)*25))};}
  pointerUp(){if(!this.drag)return;const rectangle=this.groundRect(this.drag.start,this.drag.end);this.drag=null;if(this.document.data.regions.length>=60){this.notify('地面は60個までです。不要な地面を消してください。',true);return;}this.document.change(d=>d.regions.push(rectangle));this.changed();}
  bind(){const $=s=>document.querySelector(s);
    $('#editor-open').addEventListener('click',()=>this.open());$('#editor-return').addEventListener('click',()=>{this.editing=true;this.testing=false;this.sync();});$('#editor-close').addEventListener('click',()=>this.close());
    document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{this.tool=b.dataset.tool;this.sync();}));
    for(const field of ['#editor-title','#editor-word','#editor-jumps','#editor-rule-text'])$(field).addEventListener('change',()=>{this.readFields();this.sync();});
    document.querySelectorAll('[name="sentence-kind"]').forEach(r=>r.addEventListener('change',()=>{if(!r.checked)return;this.readFields();this.document.change(d=>{d.ruleKind=r.value;if(!api.evaluateRule(d.ruleKind,d.word).ok)d.word=d.ruleKind==='jumps'?'三':'軽';});this.sync();}));
    $('#editor-assign').addEventListener('click',()=>{const checked=this.check();if(!checked.ok){this.notify(checked.message,true);return;}const index=Number($('#editor-slot').value),result=this.store.assign(index,checked.level);this.notify(result.ok?`STAGE ${index+1} に設定しました。`:result.message,!result.ok);});
    $('#editor-unassign').addEventListener('click',()=>{const index=Number($('#editor-slot').value),result=this.store.assign(index,null);this.notify(result.ok?`STAGE ${index+1} を初期状態に戻しました。`:result.message,!result.ok);});
    $('#editor-size').addEventListener('input',()=>{const size=Number($('#editor-size').value);this.document.change(d=>{d.letter[2]=size;d.letter[0]=Math.max(150,Math.min(850-size,d.letter[0]));d.letter[1]=Math.max(60,Math.min(495-size,d.letter[1]));});this.sync();});
    $('#editor-undo').addEventListener('click',()=>{this.document.undo();this.sync();});$('#editor-redo').addEventListener('click',()=>{this.document.redo();this.sync();});
    $('#editor-test').addEventListener('click',()=>this.test());$('#editor-save').addEventListener('click',()=>this.save());$('#editor-save-new').addEventListener('click',()=>this.save(true));$('#editor-export').addEventListener('click',()=>this.export());
    $('#editor-new').addEventListener('click',()=>{this.document=new StageDocument({...clone(LEVELS[0]),title:'新しいステージ'});this.currentId=null;this.drag=null;this.sync();});
    $('#editor-import').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';this.import(file);});
    $('#restore-stage').addEventListener('click',()=>{if(!this.deleted)return;const result=this.store.restore(this.deleted);if(!result.ok){this.notify(result.message,true);return;}this.deleted=null;$('#restore-stage').hidden=true;this.renderLibrary();this.notify('削除したステージを戻しました。');});
  }
}
const exported={StageDocument,StageStore,encodeStage,decodeStage,StageEditor};if(typeof module!=='undefined'&&module.exports)module.exports=exported;else root.KotonohaEditor=exported;
})(typeof window!=='undefined'?window:globalThis);
