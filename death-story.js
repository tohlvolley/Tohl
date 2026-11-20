(function(root){'use strict';
const ENTRIES=[
  {
    "id": "intro.wake",
    "category": "導入",
    "label": "目覚め",
    "speaker": "",
    "text": "目を覚ますと、金の装飾に囲まれた部屋にいた。普通の机の前の椅子に座っている。机にはトランプ53枚1組と、一つのサイコロ。ポケットには、前のゲームで使った透明なテープが残っている。"
  },
  {
    "id": "intro.host",
    "category": "導入",
    "label": "主の挨拶",
    "speaker": "霧島 — ゲームの主",
    "text": "「ようこそ。俺は霧島。この部屋の主であり、お前の対戦相手だ。これから行うゲームを説明しよう」"
  },
  {
    "id": "rule.1",
    "category": "ルール",
    "label": "ルール 1",
    "speaker": "霧島 — ゲームの主",
    "text": "「机の上でサイコロを振る。振り終わった後は動かしてはいけない。」"
  },
  {
    "id": "rule.2",
    "category": "ルール",
    "label": "ルール 2",
    "speaker": "霧島 — ゲームの主",
    "text": "「目視できる異なる3面を指定する。辺同士で隣り合う面をつないで選ぶこと。」"
  },
  {
    "id": "rule.3",
    "category": "ルール",
    "label": "ルール 3",
    "speaker": "霧島 — ゲームの主",
    "text": "「選んだ3面の目を合計する。1=A、2=B……26=Z。その数字に対応するアルファベットを1文字与える。」"
  },
  {
    "id": "rule.4",
    "category": "ルール",
    "label": "ルール 4",
    "speaker": "霧島 — ゲームの主",
    "text": "「続いて、先に指定した3面以外の見える面を3回指定する。同じ面を繰り返してもいい。それぞれの目の数字から、さらに1文字ずつ得られる。」"
  },
  {
    "id": "rule.5",
    "category": "ルール",
    "label": "ルール 5",
    "speaker": "霧島 — ゲームの主",
    "text": "「得た4文字と、持ち越した文字を組み合わせ、机の上にある品の英語名を作る。GMがその品の複製を渡す。1回に複数の品を作っても、作らなくてもいい。複数形でも1語につき1個だ。使った文字はなくなる。」"
  },
  {
    "id": "rule.6",
    "category": "ルール",
    "label": "ルール 6",
    "speaker": "霧島 — ゲームの主",
    "text": "「これを6回行い、錬成したカードから5枚を選んでポーカーで対決する。机の上にはトランプ53枚1組がある。これは複製元であり、そのまま手札にはできない。自分の6回が終わったら、相手が6回行う。」"
  },
  {
    "id": "rule.7",
    "category": "ルール",
    "label": "ルール 7",
    "speaker": "霧島 — ゲームの主",
    "text": "「通常のポーカーの役の順で勝敗を決める。5枚未満の手はハイカードより弱い。同じ数字の実物カードを5枚持った時点で、即失格だ。」"
  },
  {
    "id": "intro.end",
    "category": "導入",
    "label": "説明の終わり",
    "speaker": "霧島 — ゲームの主",
    "text": "「説明は以上だ。ルールはいつでも読み返せる。では、目の前のサイコロを振れ。お前から6回だ」"
  },
  {
    "id": "host.start",
    "category": "導入",
    "label": "最初の投擲の指示",
    "speaker": "霧島 — ゲームの主",
    "text": "「では、サイコロを振れ」"
  },
  {
    "id": "inspect.deck",
    "category": "探索",
    "label": "トランプ",
    "speaker": "",
    "text": "机の上にトランプ53枚1組が置かれている。これは複製元で、手札にすることはできない。"
  },
  {
    "id": "inspect.wood",
    "category": "探索",
    "label": "普通の机",
    "speaker": "",
    "text": "重厚な木の机。天板は分厚く、不透明だ。トランプ53枚1組が置かれている。"
  },
  {
    "id": "inspect.glass",
    "category": "探索",
    "label": "透明な机",
    "speaker": "",
    "text": "物を置く天板が透明な机。上からも、下からも向こうが見える。脚は金属製で固定されている。"
  },
  {
    "id": "inspect.shelf",
    "category": "探索",
    "label": "本棚",
    "speaker": "",
    "text": "引き出しに短いメモがあった。「標準のサイコロ。向かい合う面の合計は七。見えるかどうかは、立つ場所で変わる」"
  },
  {
    "id": "inspect.tape",
    "category": "探索",
    "label": "透明なテープ",
    "speaker": "",
    "text": "前のゲームで使った透明なテープ。まだ粘着力がある。"
  },
  {
    "id": "inspect.chair",
    "category": "探索",
    "label": "椅子",
    "speaker": "",
    "text": "厚く張られた革の椅子。動かせば別の角度から机を見られそうだ。"
  },
  {
    "id": "inspect.dice",
    "category": "探索",
    "label": "サイコロ",
    "speaker": "",
    "text": "サイコロを{diceCount}個持っている。各面には1〜6。向かい合う面の和は7。"
  },
  {
    "id": "talk.early",
    "category": "会話",
    "label": "最初の呼びかけ",
    "speaker": "霧島 — ゲームの主",
    "text": "「この部屋では、俺が相手をする。準備は自分の目で確かめるんだ」"
  },
  {
    "id": "talk.later",
    "category": "会話",
    "label": "2投目以降の呼びかけ",
    "speaker": "霧島 — ゲームの主",
    "text": "「回数は限られている。次の一投をどう使う？」"
  },
  {
    "id": "talk.where",
    "category": "会話",
    "label": "ここはどこだ",
    "speaker": "霧島 — ゲームの主",
    "text": "「俺が用意した勝負の部屋だ。扉を開ける条件は、俺に勝つこと」"
  },
  {
    "id": "talk.gm",
    "category": "会話",
    "label": "錬成を担当するのは？",
    "speaker": "霧島 — ゲームの主",
    "text": "「品の複製を管理するのは別のGMだ。面を指定し終えたら、そちらの指示を聞け」"
  },
  {
    "id": "talk.turn",
    "category": "会話",
    "label": "相手の番について",
    "speaker": "霧島 — ゲームの主",
    "text": "「お前の6回が終わってから、俺が6回やる。焦らず続けろ」"
  },
  {
    "id": "gm.alchemy.start",
    "category": "錬成",
    "label": "錬成開始",
    "speaker": "GM — 錬成管理",
    "text": "「文字の付与を確認。錬成を開始します。作る品の名前を指示してください。作らずに終了することもできます」"
  },
  {
    "id": "gm.alchemy.wait",
    "category": "錬成",
    "label": "錬成待機",
    "speaker": "GM — 錬成管理",
    "text": "「錬成を受け付けています。残った文字は次の回へ持ち越せます」"
  },
  {
    "id": "opponent.0",
    "category": "相手の手番",
    "label": "手番開始",
    "speaker": "霧島 — 手番開始",
    "text": "「次は俺の6投だ」霧島は席を立ち、透明な天板の机へ向かった。"
  },
  {
    "id": "opponent.1",
    "category": "相手の手番",
    "label": "第1投",
    "speaker": "霧島 — 第1投",
    "text": "霧島は透明な天板の下を覗き込み、面を指定する。「見える面を増やす。これこそ、このゲームの肝だ」"
  },
  {
    "id": "opponent.2",
    "category": "相手の手番",
    "label": "第2投",
    "speaker": "霧島 — 第2投",
    "text": "第2投。霧島は同じ手順で錬成を行い、サイコロを増やしていく。"
  },
  {
    "id": "opponent.3",
    "category": "相手の手番",
    "label": "第3投",
    "speaker": "霧島 — 第3投",
    "text": "第3投。透明な机を使い、霧島はカードを1枚錬成した。"
  },
  {
    "id": "opponent.4",
    "category": "相手の手番",
    "label": "第4投",
    "speaker": "霧島 — 第4投",
    "text": "第4投。底面まで確かめながら、霧島は迷いなく文字を選び取る。"
  },
  {
    "id": "opponent.5",
    "category": "相手の手番",
    "label": "第5投",
    "speaker": "霧島 — 第5投",
    "text": "第5投。「仕組みが分かれば、難しいことはない」カードが机に重なった。"
  },
  {
    "id": "opponent.end",
    "category": "相手の手番",
    "label": "6投の終了",
    "speaker": "霧島",
    "text": "「俺の6投も終わった。勝負といこう」霧島は5枚のカードを机に伏せた。"
  },
  {
    "id": "gm.final",
    "category": "対決・結末",
    "label": "手札選択",
    "speaker": "GM — 進行管理",
    "text": "「六投、終了。勝負に使う5枚を選択してください」"
  },
  {
    "id": "ending.win",
    "category": "対決・結末",
    "label": "勝利",
    "speaker": "GM — 判定",
    "text": "勝利。正面の扉のロックが外れた。"
  },
  {
    "id": "ending.lose",
    "category": "対決・結末",
    "label": "敗北",
    "speaker": "GM — 判定",
    "text": "敗北。扉のランプが赤く変わった。"
  },
  {
    "id": "ending.draw",
    "category": "対決・結末",
    "label": "引き分け",
    "speaker": "GM — 判定",
    "text": "引き分け。決着は保留された。"
  },
  {
    "id": "ending.disqualified",
    "category": "対決・結末",
    "label": "失格",
    "speaker": "GM — 判定",
    "text": "同じ数字の実物カードを5枚所持した。規定違反により失格。"
  },
  {
    "id": "door.open",
    "category": "対決・結末",
    "label": "扉の外",
    "speaker": "",
    "text": "ロックが外れた。霧島は自分の手を見つめたまま、何も言わない。透明なテープをポケットへ戻し、最初の扉を開ける。廊下の先には、次の部屋の灯りが見える。"
  },
  {
    "id": "door.locked",
    "category": "探索",
    "label": "閉ざされた扉",
    "speaker": "",
    "text": "扉は固く閉ざされている。勝者が決まるまでは開かない。"
  }
];

const KEY='sixth-cast-story-v1',INDEX=new Map(ENTRIES.map(e=>[e.id,e]));
const clone=x=>JSON.parse(JSON.stringify(x));
function defaults(){return{format:'sixth-cast-story',version:1,speed:32,lines:Object.fromEntries(ENTRIES.map(e=>[e.id,{speaker:e.speaker,text:e.text}]))};}
function validLine(value){if(!value||typeof value.speaker!=='string'||value.speaker.length>80||typeof value.text!=='string'||value.text.length>4000||!value.text.trim())throw Error('話者は80文字以内、本文は1〜4000文字で入力してください。');for(const m of value.text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g))if(!['diceCount','round'].includes(m[1]))throw Error('使用できる差し込みは {diceCount} と {round} です。');return{speaker:value.speaker,text:value.text};}
function validate(raw){if(!raw||raw.format!=='sixth-cast-story'||raw.version!==1||!Number.isInteger(raw.speed)||raw.speed<0||raw.speed>100||!raw.lines||typeof raw.lines!=='object'||Array.isArray(raw.lines))throw Error('対応するセリフJSONを選んでください。');const result=defaults();if(Object.keys(raw.lines).length>ENTRIES.length)throw Error('場面数が不正です。');let total=0;for(const[id,value]of Object.entries(raw.lines)){if(!INDEX.has(id))throw Error('対応していない場面が含まれています。');const first=validLine(value);if(value.follow!==undefined&&(!Array.isArray(value.follow)||value.follow.length>49))throw Error('1場面につきセリフは50個まで追加できます。');const extra=(value.follow||[]).map(validLine);total+=first.text.length+extra.reduce((n,p)=>n+p.text.length,0);if(total>200000)throw Error('セリフ全体は20万文字以内にしてください。');result.lines[id]={...first,...(extra.length?{follow:extra}:{})};}result.speed=raw.speed;return result;}
function pages(project,id){const value=project.lines[id]||INDEX.get(id);if(!value)throw Error('場面が見つかりません。');return[{speaker:value.speaker,text:value.text},...(value.follow||[]).map(p=>({speaker:p.speaker,text:p.text}))];}
function setPages(project,id,values){if(!INDEX.has(id)||!Array.isArray(values)||values.length<1||values.length>50)throw Error('1場面のセリフは1〜50個にしてください。');const copy=values.map(p=>({speaker:p.speaker,text:p.text}));project.lines[id]={...copy[0],...(copy.length>1?{follow:copy.slice(1)}:{})};return project;}
function insertPage(project,id,after,value){const list=pages(project,id);if(!Number.isInteger(after)||after<0||after>=list.length||list.length>=50)throw Error('これ以上セリフを追加できません。');list.splice(after+1,0,{speaker:value.speaker,text:value.text});setPages(project,id,list);return after+1;}
function movePage(project,id,from,to){const list=pages(project,id);if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=list.length||to>=list.length)throw Error('移動先のセリフが見つかりません。');list.splice(to,0,list.splice(from,1)[0]);setPages(project,id,list);return to;}
function removePage(project,id,index){const list=pages(project,id);if(!Number.isInteger(index)||index<0||index>=list.length||list.length<=1)throw Error('場面にはセリフを1つ以上残してください。');list.splice(index,1);setPages(project,id,list);return Math.min(index,list.length-1);}
function format(value,vars){return{speaker:value.speaker,text:value.text.replace(/\{(diceCount|round)\}/g,(all,key)=>vars[key]===undefined?all:String(vars[key]))};}
function line(project,id,vars={}){return format(pages(project,id)[0],vars);}
function sequence(project,id,vars={}){return pages(project,id).map(value=>format(value,vars));}
class Store{constructor(storage){this.storage=storage;this.project=defaults();try{const raw=storage?.getItem(KEY);if(raw&&raw.length<1000000)this.project=validate(JSON.parse(raw));}catch{}}draft(){return clone(this.project);}save(raw){const value=validate(raw);if(this.storage)this.storage.setItem(KEY,JSON.stringify(value));this.project=value;return this.draft();}get(id,vars){return line(this.project,id,vars);}sequence(id,vars){return sequence(this.project,id,vars);}}
class Reveal{constructor(){this.timer=null;this.typing=false;this.serial=0;this.units=[];this.write=()=>{};this.done=()=>{};}cancel(){clearTimeout(this.timer);this.serial++;this.typing=false;}start(text,speed,write,done=()=>{}){this.cancel();this.write=write;this.done=done;this.full=String(text);this.units=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(this.full)].map(s=>s.segment):Array.from(this.full);this.index=0;this.typing=this.units.length>0&&speed>0;const serial=this.serial;if(!this.typing){write(this.full);done();return;}write('');const tick=()=>{if(serial!==this.serial)return;this.index++;write(this.units.slice(0,this.index).join(''));if(this.index>=this.units.length){this.typing=false;this.done();}else this.timer=setTimeout(tick,speed);};this.timer=setTimeout(tick,speed);}finish(){if(!this.typing)return false;clearTimeout(this.timer);this.serial++;this.typing=false;this.index=this.units.length;this.write(this.full);this.done();return true;}}
function turnLocked(phase,rolling=false){return rolling||['trio','bonus','alchemy'].includes(phase);}
function allowedCommand(phase,type){return !turnLocked(phase)||(phase==='alchemy'?['forge','end','move'].includes(type):['faces','move'].includes(type));}
const api={ENTRIES,KEY,defaults,validate,line,pages,setPages,insertPage,movePage,removePage,sequence,Store,Reveal,turnLocked,allowedCommand};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SixthStory=api;
})(typeof window!=='undefined'?window:globalThis);
