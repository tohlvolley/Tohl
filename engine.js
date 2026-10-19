/* Pure game rules and fixed-step physics. Shared by the browser and Node tests. */
(function (root) {
  'use strict';
  const CELL = 50, COLS = 20, ROWS = 10;
  const WORDS = {
    '木': {name:'足場', color:'#728c59', title:'木は、足場になる。', description:'乗れる足場をつくる。火が隣にあると燃えて消える。'},
    '火': {name:'燃やす', color:'#c76b43', title:'火は、道をひらく。', description:'隣り合う木・蔦をまとめて燃やす。触れるとスタートへ戻る。'},
    '水': {name:'消火', color:'#5b99a7', title:'水は、火をしずめる。', description:'隣り合う火をまとめて消す。水そのものにも足場として乗れる。'},
    '風': {name:'上昇', color:'#86a391', title:'風は、空へ運ぶ。', description:'文字の上に上昇気流が生まれる。気流の中で高く浮かび上がる。'},
    '氷': {name:'滑る', color:'#7caeba', title:'氷は、勢いをつくる。', description:'つるつる滑る足場。走ると速くなり、遠くまで跳べる。火が隣にあると溶けて水になる。'}
  };
  const LEVELS = [
    {title:'はじまりの橋',chapter:'第一景',kicker:'一文字から、はじまる旅。',budget:6,start:[1,8],goal:[18,8],hint:'谷に「木」の道を。足場のあいだはジャンプで渡れる。落ちても何度でも挑戦できる。',regions:[[0,8,5,2],[14,8,6,2]],vines:[],flames:[]},
    {title:'燃えることば',chapter:'第二景',kicker:'閉ざすものにも、意味がある。',budget:5,start:[1,8],goal:[18,8],hint:'蔦の壁は「火」を隣に置くと燃える。開いた道に火が残ったら、「水」を隣へ。',regions:[[0,8,20,2]],vines:[[10,0,1,8]],flames:[[14,7],[15,7]]},
    {title:'風のたより',chapter:'第三景',kicker:'届かない場所へ、ことばを。',budget:7,start:[1,8],goal:[18,3],hint:'「風」の上には6マス分の上昇気流。高く上がったら、空中の足場へ。気流は左右に少し広がっている。',regions:[[0,8,6,2],[13,3,7,7]],vines:[],flames:[]},
    {title:'ことばを紡ぐ',chapter:'最終景',kicker:'あなたの一筆が、世界をつなぐ。',budget:9,start:[1,8],goal:[18,4],hint:'蔦を燃やし、火を消し、風で高みへ。「氷」は速く走れて遠くへ跳べる。自由な組み合わせで道をつくろう。',regions:[[0,8,4,2],[12,4,8,6]],vines:[[8,0,1,8]],flames:[[15,3],[16,3]]}
  ];
  const key = (x,y) => `${x},${y}`;
  class Game {
    constructor(index = 0) { this.load(index); }
    load(index) {
      this.index = index; this.level = LEVELS[index]; this.terrain = new Map(); this.placed = new Map(); this.effects = [];
      for (const [x,y,w,h] of this.level.regions) for (let a=x;a<x+w;a++) for(let b=y;b<y+h;b++) this.terrain.set(key(a,b),'stone');
      for (const [x,y,w,h] of this.level.vines) for (let a=x;a<x+w;a++) for(let b=y;b<y+h;b++) this.terrain.set(key(a,b),'vine');
      for (const [x,y] of this.level.flames) this.terrain.set(key(x,y),'火');
      this.running = false; this.won = false; this.deaths = 0; this.elapsed = 0; this.casts = 0; this.lastEvent = ''; this.respawn();
    }
    respawn() {
      this.player = {x:this.level.start[0]*CELL+13,y:this.level.start[1]*CELL-36,w:24,h:36,vx:0,vy:0,grounded:false,surface:null,facing:1};
      this.jumpHeld = false;
    }
    get remaining() { return this.level.budget - this.placed.size; }
    at(x,y) { return this.placed.get(key(x,y)) || this.terrain.get(key(x,y)); }
    canPlace(x,y) {
      if (this.running || this.won || x<0 || x>=COLS || y<1 || y>8 || this.terrain.has(key(x,y))) return false;
      const [gx,gy] = this.level.goal;
      if (x===gx && (y===gy-1 || y===gy-2)) return false;
      const p=this.player;
      return !(p.x < (x+1)*CELL && p.x+p.w>x*CELL && p.y<(y+1)*CELL && p.y+p.h>y*CELL);
    }
    place(x,y,word) {
      if (!WORDS[word]) return {ok:false,message:'対応している漢字は「木・火・水・風・氷」です。'};
      if (!this.canPlace(x,y)) return {ok:false,message:'空いている点線のマスに置いてください。旅人や門には重ねられません。'};
      const k=key(x,y);
      if(this.placed.has(k)) { this.placed.delete(k); return {ok:true,message:'文字を回収しました。墨が1つ戻りました。'}; }
      if(this.remaining<=0) return {ok:false,message:'墨を使い切りました。置いた文字をクリックすると回収できます。'};
      this.placed.set(k,word); this.casts++;
      const reactions=this.react();
      return {ok:true,message:reactions || `「${word}」を置きました。${WORDS[word].title}`};
    }
    remove(x,y) {
      if(this.running || this.won) return false;
      return this.placed.delete(key(x,y));
    }
    react() {
      let burned=0, quenched=0, melted=0, changed=true;
      const adjacent = k => {const [x,y]=k.split(',').map(Number);return [key(x-1,y),key(x+1,y),key(x,y-1),key(x,y+1)];};
      const erase = k => {this.placed.delete(k);this.terrain.delete(k);};
      // Water acts first. Every connected flame is extinguished, including authored hazards.
      for(const [k,v] of [...this.terrain,...this.placed]) if(v==='水') {
        const queue=adjacent(k),seen=new Set();
        while(queue.length) {const n=queue.pop();if(seen.has(n))continue;seen.add(n);const [x,y]=n.split(',').map(Number);if(this.at(x,y)==='火'){erase(n);quenched++;queue.push(...adjacent(n));}}
      }
      while(changed) {
        changed=false;
        for(const [k,v] of [...this.terrain,...this.placed]) if(v==='火') {
          const queue=adjacent(k),seen=new Set();
          while(queue.length) {
            const n=queue.pop();if(seen.has(n))continue;seen.add(n);const [x,y]=n.split(',').map(Number),t=this.at(x,y);
            if(t==='木'||t==='vine') {erase(n);burned++;changed=true;this.effects.push({x:x*CELL+25,y:y*CELL+25,kind:'burn',life:1});queue.push(...adjacent(n));}
            else if(t==='氷') {if(this.placed.has(n))this.placed.set(n,'水');else this.terrain.set(n,'水');melted++;changed=true;}
          }
        }
        if(changed) for(const [k,v] of [...this.terrain,...this.placed]) if(v==='水') {
          const queue=adjacent(k),seen=new Set();
          while(queue.length){const n=queue.pop();if(seen.has(n))continue;seen.add(n);const [x,y]=n.split(',').map(Number);if(this.at(x,y)==='火'){erase(n);quenched++;queue.push(...adjacent(n));}}
        }
      }
      return [burned?`火が木と蔦を${burned}マス燃やし、道がひらいた。`:'',melted?'氷が溶けて水になった。':'',quenched?`水が火を${quenched}マス消した。`:''].filter(Boolean).join(' ');
    }
    colliders() {
      return [...this.terrain,...this.placed].filter(([,v])=>v!=='火').map(([k,type])=>{const [x,y]=k.split(',').map(Number);return {x:x*CELL,y:y*CELL,w:CELL,h:CELL,type};});
    }
    overlaps(a,b) {return a.x < b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;}
    step(dt,input={}) {
      for(const fx of this.effects)fx.life-=dt;this.effects=this.effects.filter(f=>f.life>0);
      if(!this.running||this.won)return;
      this.elapsed+=dt;
      const p=this.player, ice=p.grounded&&p.surface==='氷';
      const direction=(input.right?1:0)-(input.left?1:0), maxSpeed=(ice||(!p.grounded&&Math.abs(p.vx)>200))?310:200;
      const accel=ice?500:1700;
      if(direction){p.vx+=direction*accel*dt;p.vx=Math.max(-maxSpeed,Math.min(maxSpeed,p.vx));p.facing=direction;}
      else{const friction=ice?100:1900;p.vx=Math.sign(p.vx)*Math.max(0,Math.abs(p.vx)-friction*dt);}
      if(input.jump&&!this.jumpHeld&&p.grounded){p.vy=-500;p.grounded=false;}
      this.jumpHeld=!!input.jump;
      let wind=false;
      for(const [k,v] of this.placed) if(v==='風') {
        const [x,y]=k.split(',').map(Number);
        if(p.x+p.w>x*CELL-22&&p.x<(x+1)*CELL+22&&p.y+p.h<=y*CELL+8&&p.y+p.h>y*CELL-300) wind=true;
      }
      p.vy=wind?Math.max(-290,p.vy-2500*dt):Math.min(700,p.vy+1250*dt);
      const solids=this.colliders();
      p.x+=p.vx*dt;
      for(const s of solids)if(this.overlaps(p,s)){if(p.vx>0)p.x=s.x-p.w;else if(p.vx<0)p.x=s.x+s.w;p.vx=0;}
      p.x=Math.max(0,Math.min(COLS*CELL-p.w,p.x));
      p.y+=p.vy*dt;p.grounded=false;p.surface=null;
      for(const s of solids)if(this.overlaps(p,s)) {
        if(p.vy>0){p.y=s.y-p.h;p.grounded=true;p.surface=s.type;}else if(p.vy<0)p.y=s.y+s.h;
        p.vy=0;
      }
      if(p.y<0){p.y=0;p.vy=0;}
      for(const [k,v] of [...this.terrain,...this.placed])if(v==='火') {
        const [x,y]=k.split(',').map(Number);
        if(this.overlaps(p,{x:x*CELL+5,y:y*CELL+4,w:40,h:46})){this.fail('火に触れました。「水」を隣に置いて消してみよう。');return;}
      }
      if(p.y>ROWS*CELL+50){this.fail('谷に落ちました。配置はそのまま。もう一度挑戦しよう。');return;}
      const [gx,gy]=this.level.goal;
      if(this.overlaps(p,{x:gx*CELL+8,y:gy*CELL-65,w:38,h:65})) {this.won=true;this.running=false;this.lastEvent='win';}
    }
    fail(message){this.deaths++;this.respawn();this.running=false;this.lastEvent=message;}
  }
  const api={Game,WORDS,LEVELS,CELL,COLS,ROWS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kotonoha=api;
})(typeof window!=='undefined'?window:globalThis);
