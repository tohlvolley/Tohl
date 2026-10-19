/* Glyph pixels are the world geometry; no rectangular platforms under letters. */
(function(root){
  'use strict';
  const WIDTH=1000,HEIGHT=500;
  const GRAVITY={軽:550,並:1050,重:1550};
  const LEVELS=[
    {title:'一文字、ひとつのルール',chapter:'第一景',kicker:'文に書いた、その文字で渡る。',ruleKind:'jumps',word:'三',baseJumps:1,letter:[410,290,180],start:[65,420],goal:[925,420],hint:'空欄の文字が、そのまま一つの足場になる。画面をクリックして置き場所を変えよう。',regions:[{x:0,y:420,w:300,h:80},{x:700,y:420,w:300,h:80}]},
    {title:'ことばの重さ',chapter:'第二景',kicker:'体と足場が、同じ文字で変わる。',ruleKind:'body',word:'軽',baseJumps:2,letter:[400,260,180],start:[55,430],goal:[935,240],hint:'体についての文を完成させる景。文字が体にどう働くかを考え、足場の形も活かそう。',regions:[{x:0,y:430,w:280,h:70},{x:700,y:240,w:300,h:260}]},
    {title:'字形と動き',chapter:'第三景',kicker:'その意味と、その輪郭を使う。',ruleKind:'body',word:'速',baseJumps:2,letter:[420,260,200],start:[60,420],goal:[920,420],hint:'同じ文でも、別の漢字なら動きも字形も変わる。入力は自由。意味が成立するときだけ反映できる。',regions:[{x:0,y:420,w:240,h:80},{x:760,y:420,w:240,h:80}]},
    {title:'一文字の可能性',chapter:'最終景',kicker:'ひとつの字で、道をひらく。',ruleKind:'jumps',word:'四',baseJumps:1,letter:[430,200,200],start:[50,430],goal:[930,180],hint:'置けるのは一文字だけ。跳べる回数と、文字の線のかたち。その両方を考えて高い門を目指そう。',regions:[{x:0,y:430,w:220,h:70},{x:780,y:180,w:220,h:320}]}
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
  function evaluateRule(kind,value){
    const word=String(value).trim();
    if(!isHan(word))return {ok:false,message:'空欄には漢字を一文字だけ入力してください。その一文字が足場になります。'};
    if(kind==='jumps'){
      const count=parseNumber(word);
      if(count===null)return {ok:false,message:`「${word}回まで飛べる」は具体的な回数として解釈できないため、反映できません。`};
      return {ok:true,word,jumpCount:count,sentence:`${word}回まで飛べる。`,description:`着地まで合計${count}回ジャンプできる。足場は「${word}」一文字。`};
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
  class Game{
    constructor(index=0,makeGlyph){this.makeGlyph=makeGlyph;this.load(index);}
    load(index){
      this.index=index;this.level=LEVELS[index];this.placed=[];this.nextId=1;
      this.running=false;this.won=false;this.deaths=0;this.elapsed=0;this.lastEvent='';
      this.word=this.level.word;this.rule=evaluateRule(this.level.ruleKind,this.word);
      this.rules=this.rulesFor(this.rule);this.respawn();
      if(this.makeGlyph){const[x,y,size]=this.level.letter;this.placed=[{id:this.nextId++,char:this.word,x,y,size,mask:this.makeGlyph(this.word,size)}];}
    }
    rulesFor(rule){return {jumpCount:rule.jumpCount===undefined?this.level.baseJumps:rule.jumpCount,gravity:rule.gravity||'並',speed:rule.speed||185,jumpPower:rule.jumpPower||430,width:rule.width||18,height:rule.height||30,color:rule.color||'#ece5cf',opacity:rule.opacity===undefined?1:rule.opacity,round:!!rule.round};}
    respawn(){this.player={x:this.level.start[0],y:this.level.start[1]-this.rules.height,w:this.rules.width,h:this.rules.height,vx:0,vy:0,grounded:false,facing:1,jumpsUsed:0};this.jumpHeld=false;}
    get remaining(){return Math.max(0,1-this.placed.length);}
    get jumpsLeft(){return Math.max(0,this.rules.jumpCount-this.player.jumpsUsed);}
    applyRule(value,size){
      if(this.running||this.won)return {ok:false,message:'配置モードで文を書きかえてください。'};
      const rule=evaluateRule(this.level.ruleKind,value);
      if(!rule.ok)return rule;
      if(!this.makeGlyph)return {ok:false,message:'文字の字体を準備しています。'};
      const current=this.placed[0],position=current||{x:this.level.letter[0],y:this.level.letter[1]};
      const letterSize=size===undefined?(current?current.size:this.level.letter[2]):size;
      if(!Number.isInteger(letterSize)||letterSize<100||letterSize>200)return {ok:false,message:'文字の大きさは100〜200で指定してください。'};
      const mask=this.makeGlyph(rule.word,letterSize),rules=this.rulesFor(rule);
      const spawn={x:this.level.start[0],y:this.level.start[1]-rules.height,w:rules.width,h:rules.height};
      let x=position.x,y=position.y;
      if(!this.positionFits(x,y,letterSize,mask,spawn)){[x,y]=this.level.letter;}
      if(!this.positionFits(x,y,letterSize,mask,spawn))return {ok:false,message:'この大きさでは文字を安全に反映できません。文字を小さくして試してください。'};
      // Commit the word, its rule and its sole glyph together after every validation passes.
      this.word=rule.word;this.rule=rule;this.rules=rules;
      this.placed=[{id:this.nextId++,char:rule.word,x,y,size:letterSize,mask}];this.respawn();
      return {ok:true,message:`「${rule.sentence}」を反映しました。ステージの一文字も「${rule.word}」になりました。`};
    }
    glyphAt(x,y){return [...this.placed].reverse().find(g=>x>=g.x&&x<g.x+g.size&&y>=g.y&&y<g.y+g.size);}
    positionFits(x,y,size,mask,player=this.player){
      if(x<0||y<50||x+size>WIDTH||y+size>HEIGHT-5||!mask||!mask.ink)return false;
      if(maskIntersects(mask,x,y,player))return false;
      for(const terrain of this.level.regions)if(maskIntersects(mask,x,y,terrain))return false;
      const[gx,gy]=this.level.goal;
      return !maskIntersects(mask,x,y,{x:gx-32,y:gy-75,w:64,h:75});
    }
    canPlace(x,y,size,mask){return !this.running&&!this.won&&this.positionFits(x,y,size,mask);}
    moveLetter(x,y,size){
      if(this.running||this.won)return {ok:false,message:'配置モードで文字の位置を変えてください。'};
      const current=this.placed[0];if(!current)return {ok:false,message:'文を反映してから位置を変えてください。'};
      const letterSize=size===undefined?current.size:size;
      if(!Number.isInteger(letterSize)||letterSize<100||letterSize>200)return {ok:false,message:'文字の大きさは100〜200で指定してください。'};
      const mask=this.makeGlyph(this.word,letterSize);
      if(!this.canPlace(x,y,letterSize,mask))return {ok:false,message:'文字の線が地面・旅人・門に重ならない場所を選んでください。'};
      this.placed=[{...current,x,y,size:letterSize,mask}];
      return {ok:true,message:`「${this.word}」一文字の位置を変えました。ルールはそのままです。`};
    }
    resetLetter(){
      if(this.running||this.won)return {ok:false,message:'配置モードで初期位置に戻してください。'};
      const[x,y,size]=this.level.letter;
      const oldPlayer=this.player;this.respawn();const result=this.moveLetter(x,y,size);
      if(!result.ok)this.player=oldPlayer;
      return result;
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
          if(delta>0){p.grounded=true;p.jumpsUsed=0;p.surface=collision.type==='glyph'?collision.glyph.char:'地';}
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
  const api={Game,LEVELS,WIDTH,HEIGHT,GRAVITY,isHan,parseNumber,evaluateRule,buildMask,maskIntersects};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kotonoha=api;
})(typeof window!=='undefined'?window:globalThis);
