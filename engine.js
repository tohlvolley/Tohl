/* Glyph pixels are the world geometry; no rectangular platforms under letters. */
(function(root){
  'use strict';
  const WIDTH=1000,HEIGHT=500;
  const GRAVITY={軽:550,並:1050,重:1550};
  const LEVELS=[
    {title:'STAGE 1',chapter:'STAGE 1',kicker:'文に書いた、その文字で渡る。',ruleKind:'jumps',word:'三',baseJumps:1,letter:[410,290,180],start:[65,420],goal:[925,420],hint:'空欄の文字が、そのまま一つの足場になる。入力する場所は固定。ステージの文をクリックして漢字を変えよう。',regions:[{x:0,y:420,w:300,h:80},{x:700,y:420,w:300,h:80}]},
    {title:'STAGE 2',chapter:'STAGE 2',kicker:'体と足場が、同じ文字で変わる。',ruleKind:'body',word:'軽',baseJumps:6,letter:[400,260,180],start:[55,430],goal:[935,240],hint:'体についての文を完成させる景。文字が体にどう働くかを考え、足場の形も活かそう。',regions:[{x:0,y:430,w:280,h:70},{x:700,y:240,w:300,h:260}]},
    {title:'STAGE 3',chapter:'STAGE 3',kicker:'その意味と、その輪郭を使う。',ruleKind:'body',word:'速',baseJumps:6,letter:[420,260,200],start:[60,420],goal:[920,420],hint:'同じ文でも、別の漢字なら動きも字形も変わる。入力は自由。意味が成立するときだけ反映できる。',regions:[{x:0,y:420,w:240,h:80},{x:760,y:420,w:240,h:80}]},
    {title:'STAGE 4',chapter:'STAGE 4',kicker:'ひとつの字で、道をひらく。',ruleKind:'jumps',word:'五',baseJumps:1,letter:[430,200,200],start:[50,430],goal:[930,180],hint:'置けるのは一文字だけ。跳べる回数と、文字の線のかたち。その両方を考えて高い門を目指そう。',regions:[{x:0,y:430,w:220,h:70},{x:780,y:180,w:220,h:320}]}
  ];
  const BODY_RULES={
    軽:{gravity:'軽',description:'重力が弱まり、ふわりと高く跳べる。'},
    重:{gravity:'重',description:'重力が強まり、落下が速くなる。'},
    速:{speed:285,description:'走る速さが上がり、遠くまで跳べる。'},
    遅:{speed:115,description:'走る速さが下がり、細かく移動できる。'},
    強:{jumpPower:530,description:'跳ぶ力が強まり、高く跳べる。'},
    弱:{jumpPower:340,description:'跳ぶ力が弱まり、ジャンプが低くなる。'},
    高:{height:46,description:'体の背が高くなる。'},
    低:{height:22,description:'体の背が低くなる。'},
    長:{height:50,description:'体が縦に長くなる。'},
    短:{height:22,description:'体が縦に短くなる。'},
    太:{width:30,description:'体が太くなり、幅が広がる。'},
    細:{width:10,description:'体が細くなり、狭いところを通れる。'},
    広:{width:34,description:'体の幅が広がる。'},
    狭:{width:12,description:'体の幅が狭くなる。'},
    赤:{color:'#b15d49',description:'体の色が赤くなる。'},
    青:{color:'#5c879e',description:'体の色が青くなる。'},
    白:{color:'#fffdf2',description:'体の色が白くなる。'},
    黒:{color:'#363f38',description:'体の色が黒くなる。'},
    薄:{width:12,opacity:.5,description:'体が薄く、半透明になる。'},
    濃:{color:'#394d37',description:'体の色が濃くなる。'},
    丸:{width:26,height:26,round:true,description:'体が丸くなる。'},
    若:{speed:215,height:26,description:'体が若返り、小さく軽快になる。'},
    古:{speed:150,color:'#9c927b',description:'体が古び、動きがゆっくりになる。'}
  };
  function isHan(value){
    const chars=Array.from(value);
    if(chars.length!==1)return false;
    const n=chars[0].codePointAt(0);
    return n===0x3007||(n>=0x3400&&n<=0x4dbf)||(n>=0x4e00&&n<=0x9fff)||(n>=0xf900&&n<=0xfaff)||(n>=0x20000&&n<=0x323af);
  }
  function parseNumber(value){
    const source=String(value).trim();
    const digits={零:0,〇:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,壱:1,弐:2,参:3};
    const units={十:10,拾:10,百:100,千:1000};
    if(!source)return null;
    const single={万:10000,萬:10000,億:100000000,兆:1000000000000,廿:20,卅:30,卌:40,肆:4,伍:5,陸:6,漆:7,捌:8,玖:9,佰:100,仟:1000,阡:1000};
    if(Object.prototype.hasOwnProperty.call(single,source))return single[source];
    const chars=Array.from(source);
    if(chars.every(c=>Object.prototype.hasOwnProperty.call(digits,c))){
      const result=Number(chars.map(c=>digits[c]).join(''));
      return Number.isSafeInteger(result)&&result<=9999?result:null;
    }
    let result=0,pending=null,lastUnit=10000;
    for(const char of chars){
      if(Object.prototype.hasOwnProperty.call(digits,char)){
        if(pending!==null||digits[char]===0)return null;
        pending=digits[char];
      }else if(units[char]){
        const unit=units[char];if(unit>=lastUnit)return null;
        result+=(pending===null?1:pending)*unit;pending=null;lastUnit=unit;
      }else return null;
    }
    result+=pending===null?0:pending;
    return result<=9999?result:null;
  }
  function sentenceParts(level){
    const template=level.ruleText||(level.ruleKind==='jumps'?'このステージで［字］回まで飛べる。':'体が［字］くなる。');
    return template.split('［字］');
  }
  function evaluateRule(kind,value){
    let template=null;
    if(kind!=='jumps'&&kind!=='body'){
      template=String(kind);
      if(template.length>100||template.split('［字］').length!==2)return {ok:false,message:'ルール文には［字］を一つだけ入れてください（100文字以内）。'};
      const normalized=template.replace(/[\s。、！!]/g,'');
      if(/^(?:このステージで|このステージでは|ステージ内で|合計|全部で)?［字］回(?:まで)?(?:飛べる|跳べる|ジャンプできる)$/.test(normalized))kind='jumps';
      else if(/^(?:体|身体|からだ)が［字］くなる$/.test(normalized))kind='body';
      else return {ok:false,message:'このルール文の意味は未対応です。例：このステージで［字］回まで飛べる。／体が［字］くなる。'};
      const result=evaluateRule(kind,value);
      return result.ok?{...result,sentence:template.replace('［字］',result.word)}:result;
    }
    const word=String(value).trim();
    if(!isHan(word))return {ok:false,message:'空欄には漢字を一文字だけ入力してください。その一文字が足場になります。'};
    if(kind==='jumps'){
      const count=parseNumber(word);
      if(count===null)return {ok:false,message:`「${word}回まで飛べる」は具体的な回数として解釈できないため、反映できません。`};
      return {ok:true,word,jumpCount:count,sentence:`このステージで${word}回まで飛べる。`,description:`このステージで合計${count}回ジャンプできる。着地しても回数は戻らない。足場は「${word}」一文字。`};
    }
    if(kind==='body'){
      if(!Object.prototype.hasOwnProperty.call(BODY_RULES,word))return {ok:false,message:`「体が${word}くなる」の意味をゲームに反映できません。文が成立し、体の変化を解釈できる漢字で入力してください。`};
      const effect=BODY_RULES[word];
      return {ok:true,word,sentence:`体が${word}くなる。`,...effect};
    }
    return {ok:false,message:'この文を解釈できません。'};
  }
  function buildMask(width,height,alpha,threshold=40){
    const stride=width+1,prefix=new Uint32Array(stride*(height+1));let ink=0;
    for(let y=0;y<height;y++){
      let row=0;
      for(let x=0;x<width;x++){const filled=alpha[y*width+x]>threshold?1:0;row+=filled;ink+=filled;prefix[(y+1)*stride+x+1]=prefix[y*stride+x+1]+row;}
    }
    return {width,height,prefix,ink};
  }
  function intersects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function maskIntersects(mask,x,y,rect){
    const left=Math.max(0,Math.floor(rect.x-x)),right=Math.min(mask.width,Math.ceil(rect.x+rect.w-x));
    const top=Math.max(0,Math.floor(rect.y-y)),bottom=Math.min(mask.height,Math.ceil(rect.y+rect.h-y));
    if(left>=right||top>=bottom)return false;
    const p=mask.prefix,s=mask.width+1;
    return p[bottom*s+right]-p[top*s+right]-p[bottom*s+left]+p[top*s+left]>0;
  }
  function validateStage(source,makeGlyph){
    const fail=message=>({ok:false,message});
    if(!source||typeof source!=='object'||Array.isArray(source))return fail('ステージのデータ形式が正しくありません。');
    const finite=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(typeof source.title!=='string'||!source.title.trim()||source.title.length>40)return fail('ステージ名は1〜40文字で入力してください。');
    if(!source.ruleText&&!['jumps','body'].includes(source.ruleKind))return fail('文章の型を選んでください。');
    const rule=evaluateRule(source.ruleText||source.ruleKind,source.word);
    if(!rule.ok)return fail(rule.message);
    const baseJumps=source.baseJumps===undefined?6:source.baseJumps;
    if(!finite(baseJumps,0,999))return fail('基本ジャンプ回数は0〜999回で指定してください。');
    if(!Array.isArray(source.regions)||source.regions.length<1||source.regions.length>60)return fail('地面は1〜60個の長方形で配置してください。');
    const regions=[];
    for(const r of source.regions){
      if(!r||!finite(r.x,0,WIDTH-25)||!finite(r.y,60,HEIGHT-10)||!finite(r.w,25,WIDTH)||!finite(r.h,10,HEIGHT)||r.x+r.w>WIDTH||r.y+r.h>HEIGHT)return fail('地面が画面の外にはみ出しています。');
      regions.push({x:r.x,y:r.y,w:r.w,h:r.h});
    }
    const point=(p,minX,maxX,minY)=>Array.isArray(p)&&p.length===2&&finite(p[0],minX,maxX)&&finite(p[1],minY,HEIGHT);
    if(!point(source.start,0,WIDTH-34,75))return fail('スタート位置が画面の外です。');
    if(!point(source.goal,25,WIDTH-25,100))return fail('ゴール位置が画面の外です。');
    const w=rule.width||18,h=rule.height||30,[sx,sy]=source.start,[gx,gy]=source.goal;
    if(!regions.some(r=>r.y===sy&&sx>=r.x&&sx+w<=r.x+r.w))return fail('スタートを地面の上端に置いてください。');
    if(!regions.some(r=>r.y===gy&&gx-20>=r.x&&gx+20<=r.x+r.w))return fail('ゴールを地面の上端に置いてください。');
    if(Math.hypot(gx-sx,gy-sy)<60)return fail('スタートとゴールを少し離してください。');
    const overlaps=(a,b)=>intersects(a,b);
    if(sy-h<35)return fail('スタートが画面の上端に近すぎます。少し下に置いてください。');
    if(regions.some(r=>overlaps({x:sx,y:sy-h,w,h},r)))return fail('スタートが地面に埋まっています。');
    if(regions.some(r=>overlaps({x:gx-18,y:gy-64,w:36,h:64},r)))return fail('ゴールが地面に埋まっています。');
    const letter=source.letter;
    if(!Array.isArray(letter)||letter.length!==3||!finite(letter[2],100,200)||!finite(letter[0],150,850-letter[2])||!finite(letter[1],60,HEIGHT-letter[2]-5))return fail('入力欄を文章も含めて画面に収まる場所に置いてください。');
    if(makeGlyph){
      let mask;try{mask=makeGlyph(rule.word,letter[2]);}catch{return fail('この漢字の字形を作れませんでした。');}
      if(!mask||!mask.ink)return fail('この漢字の字形を表示できません。');
      if(regions.some(r=>maskIntersects(mask,letter[0],letter[1],r))||maskIntersects(mask,letter[0],letter[1],{x:sx,y:sy-h,w,h})||maskIntersects(mask,letter[0],letter[1],{x:gx-18,y:gy-64,w:36,h:64}))return fail('入力欄の文字が地面・スタート・ゴールに重なっています。');
    }
    const level={title:source.title.trim(),chapter:'自作',kicker:'あなたがつくった、一文字の世界。',hint:'ステージ内の空欄を書きかえて、出口を目指そう。',ruleText:source.ruleText||undefined,ruleKind:source.ruleKind,word:rule.word,baseJumps,letter:[...letter],start:[sx,sy],goal:[gx,gy],regions};
    return {ok:true,level};
  }
  class Game{
    constructor(index=0,makeGlyph){this.makeGlyph=makeGlyph;this.load(index);}
    load(index){
      this.initialize(index,LEVELS[index]);
    }
    loadCustom(source){
      const result=validateStage(source,this.makeGlyph);if(!result.ok)return result;
      this.initialize(-1,result.level);return result;
    }
    initialize(index,level){
      this.index=index;this.level=JSON.parse(JSON.stringify(level));this.placed=[];this.nextId=1;
      this.running=false;this.won=false;this.deaths=0;this.elapsed=0;this.lastEvent='';
      this.word=this.level.word;this.rule=evaluateRule(this.level.ruleText||this.level.ruleKind,this.word);
      this.rules=this.rulesFor(this.rule);this.respawn();
      if(this.makeGlyph){const[x,y,size]=this.level.letter;this.placed=[{id:this.nextId++,char:this.word,x,y,size,mask:this.makeGlyph(this.word,size)}];}
    }
    prepareInput(){this.running=false;this.won=false;this.word='';this.placed=[];this.respawn();}
    rulesFor(rule){return {jumpCount:rule.jumpCount===undefined?this.level.baseJumps:rule.jumpCount,gravity:rule.gravity||'並',speed:rule.speed||185,jumpPower:rule.jumpPower||430,width:rule.width||18,height:rule.height||30,color:rule.color||'#ece5cf',opacity:rule.opacity===undefined?1:rule.opacity,round:!!rule.round};}
    respawn(){this.player={x:this.level.start[0],y:this.level.start[1]-this.rules.height,w:this.rules.width,h:this.rules.height,vx:0,vy:0,grounded:false,facing:1,jumpsUsed:0};this.jumpHeld=false;}
    get remaining(){return Math.max(0,1-this.placed.length);}
    get jumpsLeft(){return Math.max(0,this.rules.jumpCount-this.player.jumpsUsed);}
    applyRule(value,size){
      if(this.running||this.won)return {ok:false,message:'配置モードで文を書きかえてください。'};
      const rule=evaluateRule(this.level.ruleText||this.level.ruleKind,value);
      if(!rule.ok)return rule;
      if(!this.makeGlyph)return {ok:false,message:'文字の字体を準備しています。'};
      if(rule.word===this.word)return {ok:true,changed:false,message:'この漢字はすでに反映されています。残り回数はそのままです。'};
      const[x,y,letterSize]=this.level.letter;
      if(size!==undefined&&size!==letterSize)return {ok:false,message:'入力欄の位置と大きさはステージで指定されています。'};
      const mask=this.makeGlyph(rule.word,letterSize),rules=this.rulesFor(rule);
      const spawn={x:this.level.start[0],y:this.level.start[1]-rules.height,w:rules.width,h:rules.height};
      if(spawn.y<35||this.level.regions.some(r=>intersects(spawn,r)))return {ok:false,message:'この体の大きさではスタートが地面や上端に重なるため反映できません。'};
      if(!this.positionFits(x,y,letterSize,mask,spawn))return {ok:false,message:'この字形は地面やスタートに重なるため反映できません。'};
      // Commit the word, its rule and its sole glyph together after every validation passes.
      this.word=rule.word;this.rule=rule;this.rules=rules;
      this.placed=[{id:this.nextId++,char:rule.word,x,y,size:letterSize,mask}];this.respawn();
      return {ok:true,message:`「${rule.sentence}」を反映しました。スタートへ戻り、ステージの残り回数をリセットしました。`};
    }
    glyphAt(x,y){return [...this.placed].reverse().find(g=>x>=g.x&&x<g.x+g.size&&y>=g.y&&y<g.y+g.size);}
    positionFits(x,y,size,mask,player=this.player){
      if(x<0||y<50||x+size>WIDTH||y+size>HEIGHT-5||!mask||!mask.ink)return false;
      if(maskIntersects(mask,x,y,player))return false;
      for(const terrain of this.level.regions)if(maskIntersects(mask,x,y,terrain))return false;
      const[gx,gy]=this.level.goal;
      return !maskIntersects(mask,x,y,{x:gx-32,y:gy-75,w:64,h:75});
    }
    solidAt(rect){
      for(const region of this.level.regions)if(intersects(rect,region))return {type:'ground'};
      for(const glyph of this.placed)if(maskIntersects(glyph.mask,glyph.x,glyph.y,rect))return {type:'glyph',glyph};
      return null;
    }
    moveAxis(delta,axis){
      const p=this.player,steps=Math.ceil(Math.abs(delta));if(!steps)return;
      const amount=delta/steps;
      for(let i=0;i<steps;i++){
        const before=p[axis];p[axis]+=amount;
        const collision=this.solidAt(p);
        if(!collision)continue;
        if(axis==='x'&&p.grounded){
          let climbed=false;
          for(let rise=1;rise<=3;rise++)if(!this.solidAt({...p,y:p.y-rise})){p.y-=rise;climbed=true;break;}
          if(climbed)continue;
        }
        p[axis]=before;
        if(axis==='y'){
          if(delta>0){p.grounded=true;p.surface=collision.type==='glyph'?collision.glyph.char:'地';}
          p.vy=0;
        }else p.vx=0;
        break;
      }
    }
    step(dt,input={}){
      if(!this.running||this.won)return;
      this.elapsed+=dt;const p=this.player;
      const direction=(input.right?1:0)-(input.left?1:0);
      if(direction){p.vx=Math.max(-this.rules.speed,Math.min(this.rules.speed,p.vx+direction*1400*dt));p.facing=direction;}
      else p.vx=Math.sign(p.vx)*Math.max(0,Math.abs(p.vx)-1600*dt);
      if(input.jump&&!this.jumpHeld&&p.jumpsUsed<this.rules.jumpCount){p.vy=-this.rules.jumpPower;p.grounded=false;p.jumpsUsed++;}
      this.jumpHeld=!!input.jump;
      p.vy=Math.min(650,p.vy+GRAVITY[this.rules.gravity]*dt);
      this.moveAxis(p.vx*dt,'x');p.x=Math.max(0,Math.min(WIDTH-p.w,p.x));
      p.grounded=false;this.moveAxis(p.vy*dt,'y');
      if(p.y<35){p.y=35;p.vy=0;}
      if(p.y>HEIGHT+60){this.deaths++;this.respawn();this.running=false;this.lastEvent='落ちても文字は残ります。配置やルールを変えて、もう一度。';return;}
      const[gx,gy]=this.level.goal;
      if(intersects(p,{x:gx-18,y:gy-64,w:36,h:64})){this.won=true;this.running=false;this.lastEvent='win';}
    }
  }
  const api={Game,LEVELS,WIDTH,HEIGHT,GRAVITY,isHan,parseNumber,evaluateRule,sentenceParts,validateStage,buildMask,maskIntersects};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kotonoha=api;
})(typeof window!=='undefined'?window:globalThis);
