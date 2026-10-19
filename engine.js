/* Glyph pixels are the world geometry; no rectangular platforms under letters. */
(function(root){
  'use strict';
  const WIDTH=1000,HEIGHT=500;
  const GRAVITY={軽:550,並:1050,重:1550};
  const LEVELS=[
    {title:'文字の輪郭',chapter:'第一景',kicker:'線に乗って、空白を渡る。',budget:7,start:[65,420],goal:[925,420],jumps:'二',gravity:'並',hint:'「一」の横線も「回」の囲みも、そのまま足場。まずは二段ジャンプで線に乗ってみよう。',regions:[{x:0,y:420,w:220,h:80},{x:790,y:420,w:210,h:80}],letters:[['一',285,325,160],['回',530,250,160]]},
    {title:'回のなかへ',chapter:'第二景',kicker:'囲みの中にも、道がある。',budget:7,start:[55,430],goal:[935,230],jumps:'三',gravity:'並',hint:'「回」の空白には入れる。文字の横線を踏みながら高みへ。漢数字を変えるとジャンプの回数も変わる。',regions:[{x:0,y:430,w:180,h:70},{x:825,y:230,w:175,h:270}],letters:[['山',250,305,170],['回',510,190,180],['一',705,145,120]]},
    {title:'軽やかな一筆',chapter:'第三景',kicker:'同じ文字でも、ルールで変わる。',budget:7,start:[60,430],goal:[920,220],jumps:'二',gravity:'軽',hint:'「軽」はゆっくり落ちる重力。「並」「重」と書きかえて、同じ足場で跳び方が変わるのを試そう。',regions:[{x:0,y:430,w:180,h:70},{x:820,y:220,w:180,h:280}],letters:[['川',275,300,170],['空',540,185,180]]},
    {title:'自由なことば',chapter:'最終景',kicker:'あなたの漢字で、あなたの道を。',budget:9,start:[50,430],goal:[930,180],jumps:'三',gravity:'並',hint:'好きな漢字と、好きなルールで。線の少ない文字は渡りやすく、複雑な文字には思わぬ足場が隠れている。',regions:[{x:0,y:430,w:170,h:70},{x:850,y:180,w:150,h:320}],letters:[['夢',290,280,180],['道',565,160,180]]}
  ];
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
      this.rules={jumpCount:parseNumber(this.level.jumps),gravity:this.level.gravity};
      this.running=false;this.won=false;this.deaths=0;this.elapsed=0;this.lastEvent='';this.respawn();
      if(this.makeGlyph)for(const [char,x,y,size]of this.level.letters)this.placed.push({id:this.nextId++,char,x,y,size,mask:this.makeGlyph(char,size)});
    }
    respawn(){this.player={x:this.level.start[0],y:this.level.start[1]-30,w:18,h:30,vx:0,vy:0,grounded:false,facing:1,jumpsUsed:0};this.jumpHeld=false;}
    get remaining(){return this.level.budget-this.placed.length;}
    get jumpsLeft(){return Math.max(0,this.rules.jumpCount-this.player.jumpsUsed);}
    setRules(number,gravity){
      if(this.running||this.won)return {ok:false,message:'配置モードでルールを書きかえてください。'};
      const count=parseNumber(number);
      if(count===null)return {ok:false,message:'回数には「零〜九千九百九十九」の漢数字を入れてください。例：三、十、二十三。'};
      if(!Object.prototype.hasOwnProperty.call(GRAVITY,gravity))return {ok:false,message:'重力には「軽・並・重」のいずれかを入れてください。'};
      this.rules={jumpCount:count,gravity};this.respawn();
      return {ok:true,message:`ルール変更：着地まで${count}回ジャンプ、重力は「${gravity}」。旅人をスタートへ戻しました。`};
    }
    glyphAt(x,y){return [...this.placed].reverse().find(g=>x>=g.x&&x<g.x+g.size&&y>=g.y&&y<g.y+g.size);}
    canPlace(x,y,size,mask){
      if(this.running||this.won||x<0||y<50||x+size>WIDTH||y+size>HEIGHT-5)return false;
      if(!mask||!mask.ink)return false;
      if(maskIntersects(mask,x,y,this.player))return false;
      for(const terrain of this.level.regions)if(maskIntersects(mask,x,y,terrain))return false;
      const[gx,gy]=this.level.goal;
      return !maskIntersects(mask,x,y,{x:gx-32,y:gy-75,w:64,h:75});
    }
    place(x,y,char,size=160){
      if(!isHan(char))return {ok:false,message:'漢字を一文字入力してください。好きな漢字の形を足場にできます。'};
      if(!this.makeGlyph)return {ok:false,message:'文字の字体を準備しています。'};
      if(!Number.isInteger(size)||size<100||size>200)return {ok:false,message:'文字の大きさは100〜200で指定してください。'};
      const mask=this.makeGlyph(char,size);
      if(!this.canPlace(x,y,size,mask))return {ok:false,message:'文字の線が地面・旅人・門に重ならない場所に置いてください。'};
      if(this.remaining<=0)return {ok:false,message:'文字数の上限です。置いた文字をクリックすると回収できます。'};
      this.placed.push({id:this.nextId++,char,x,y,size,mask});
      return {ok:true,message:`「${char}」を置きました。色のついた線にだけ乗れます。文字の空白は通り抜けられます。`};
    }
    remove(id){if(this.running||this.won)return false;const index=this.placed.findIndex(g=>g.id===id);if(index<0)return false;this.placed.splice(index,1);return true;}
    clear(){if(this.running||this.won)return;this.placed=[];this.respawn();}
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
      if(direction){p.vx=Math.max(-185,Math.min(185,p.vx+direction*1400*dt));p.facing=direction;}
      else p.vx=Math.sign(p.vx)*Math.max(0,Math.abs(p.vx)-1600*dt);
      if(input.jump&&!this.jumpHeld&&p.jumpsUsed<this.rules.jumpCount){p.vy=-430;p.grounded=false;p.jumpsUsed++;}
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
  const api={Game,LEVELS,WIDTH,HEIGHT,GRAVITY,isHan,parseNumber,buildMask,maskIntersects};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kotonoha=api;
})(typeof window!=='undefined'?window:globalThis);
