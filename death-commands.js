(function(root){'use strict';const E=typeof module!=='undefined'&&module.exports?require('./death-engine'):root.SixthEngine;
const suitOf=text=>/スペード|SPADES?/i.test(text)?'spades':/ハート|HEARTS?/i.test(text)?'hearts':/ダイヤ|DIAMONDS?/i.test(text)?'diamonds':/クラブ|クローバー|CLUBS?/i.test(text)?'clubs':undefined;
function countOf(value){return /^\d+$/.test(value)?Number(value):({'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9}[value]||1);}
function parse(input,phase='prepare'){const text=String(input||'').normalize('NFKC').trim(),upper=text.toUpperCase();if(!text)return{type:'unknown',message:'何をするか入力してください。'};if(/ルール|規則/.test(text))return{type:'rules'};
 if(/錬成|練成|合成|作[るりっ成]|複製|生成|CRAFT|MAKE|CREATE|COPY/i.test(text)&&!(/作らない|錬成しない/.test(text))){let mapped=upper.replace(/ジョーカー/g,' JOKER ').replace(/エース/g,' ACE ').replace(/キング/g,' KING ').replace(/クイーン|クィーン/g,' QUEEN ').replace(/ジャック/g,' JACK ').replace(/サイコロ|さいころ|ダイス/g,' DIE ');const names=Object.keys(E.ITEMS).sort((a,b)=>b.length-a.length).join('|'),regex=new RegExp(`(?:^|[^A-Z])(${names})(?![A-Z])(?:[\\sを]*(\\d+|[一二三四五六七八九])(?:枚|個|つ))?`,'g'),matches=[...mapped.matchAll(regex)],requests=[];for(let i=0;i<matches.length;i++){const m=matches[i],amount=countOf(m[2]||'1');if(amount<1||amount>12)return{type:'unknown',message:'一度に作る個数を1〜12で指定しよう。'};const before=mapped.slice(i?matches[i-1].index+matches[i-1][0].length:0,m.index+1),after=mapped.slice(m.index+m[0].length,matches[i+1]?.index??mapped.length),suit=(/\bOF\b/.test(after)?suitOf(after):undefined)||suitOf(before);for(let n=0;n<amount;n++)requests.push({word:m[1],suit});}return requests.length?{type:'forge',requests,finishAfter:/次|終了|完了|終える/.test(text)}:{type:'unknown',message:'見本にある英語のアイテム名を指定しよう。例：DIEを作る。'};}
 if(/次[のへ]|終了|完了|終える|錬成しない|作らない/.test(text))return{type:'end'};
 if(/勝負|対決|公開|ショーダウン|SHOWDOWN/i.test(text))return{type:'showdown'};
 if(/テープ|セロテープ|TAPE/i.test(text)){
  if(/剥|はが|外す|ほど|解く|取り外/.test(text))return{type:'unbind'};
  if(/目|数字/.test(text)&&/書|変え|塗|増や|改造/.test(text))return{type:'noop',message:'透明なテープだけでは、サイコロに描かれた数字は変えられない。'};
  if(/サイコロ|さいころ|ダイス|DICE|DIE/i.test(text)){const count=text.match(/(\d+|[一二三四五六七八九])\s*(?:個|つ)/);if(/机|天板|テーブル/.test(text)&&/固定|貼|留め/.test(text)&&!/同士|どうし|つな|繋|連結/.test(text))return{type:'fix'};return{type:'bind',count:count?countOf(count[1]):undefined,layout:/縦|積|タワー/.test(text)?'stack':/L字|エル字|曲が/.test(text)?'corner':/奥|前後/.test(text)?'depth':'line'};}
  if(/カード|トランプ/.test(text))return{type:'noop',message:'カードをテープで束ねた。数字や枚数は変わらない。勝負には個々のカードを使う。'};
  return{type:'unknown',message:'テープを何に使い、どうしたいかを指定しよう。'};
 }
 const table=/透明|ガラス/.test(text)?'glass':/木|最初の机|正面の机/.test(text)?'wood':undefined;
 if(/振|ふる|ロール|ROLL/i.test(text))return{type:'roll',table};
 if(['trio','bonus'].includes(phase)&&/[1-6]/.test(text)&&/面|目|指定|選|^[1-6\s,、・+]+$/.test(text)){const clean=text.replace(/サイコロ\s*[1-9]/g,'').replace(/([1-6])\s*(?:の面)?を?\s*([一二三3])回/,(_,v,n)=>Array(countOf(n)).fill(v).join(','));const values=[...clean.matchAll(/[1-6]/g)].map(m=>Number(m[0]));if(values.length)return{type:'faces',values};}
 if(table&&/移|置|持|運|使う/.test(text))return{type:'table',table};
 if(/持ち物|所持|インベントリ/.test(text))return{type:'inventory'};
 if(/霧島|相手|対面|男|話す|会話/.test(text))return{type:'talk'};
 if(/原本|元のカード|元のトランプ|見本/.test(text)&&/取|使|持|勝負/.test(text))return{type:'noop',message:'原本は封印された複製見本だ。勝負に使えるのは錬成したカードだけ。'};
 if(/扉|ドア|出口/.test(text))return{type:'door'};
 if(/窓/.test(text))return{type:'noop',message:'窓の向こうは暗い。ガラスの内側には金属の格子が通っていて、ここからは出られない。'};
 if(/椅子/.test(text)&&/動|押|引|乗/.test(text))return{type:'move',target:'chair',climb:/乗/.test(text)};
 if(/近|行|歩|移動|潜|しゃが|覗|のぞ/.test(text))return{type:'move',target:table||(/棚/.test(text)?'shelf':'current'),under:/下|潜|しゃが/.test(text)};
 if(/サイコロ|さいころ|ダイス/.test(text))return{type:'inspect',target:'dice'};
 if(/トランプ|カード|デッキ/.test(text))return{type:'inspect',target:'deck'};
 if(table||/机|テーブル/.test(text))return{type:'inspect',target:table||'wood'};
 if(/棚|引き出し|手紙|メモ/.test(text))return{type:'inspect',target:'shelf'};
 if(/モニター|画面|放送/.test(text))return{type:'rules'};
 return{type:'unknown',message:'対象と行動をもう少し具体的に伝えてください。持ち物の名前も指示に使えます。'};}
function execute(game,input){const action=parse(input,game.phase);let result;switch(action.type){case'rules':result=game.readRules();break;case'table':result=game.setTable(action.table);break;case'roll':if(action.table&&game.phase==='prepare'){const moved=game.setTable(action.table);if(!moved.ok)return{...moved,action};}result=game.roll();break;case'bind':result=game.bind(action.count,action.layout);break;case'unbind':result=game.unbind();break;case'fix':result=game.fix();break;case'forge':result=game.forge(action.requests);if(result.ok&&action.finishAfter&&game.phase==='alchemy')result=game.endRound();break;case'end':result=game.endRound();break;case'showdown':result=game.showdown();break;case'faces':{const values=[...action.values];if(game.phase==='trio'){if(values.length<3){result={ok:false,message:'最初は3つの面を指定してください。'};break;}const wanted=values.splice(0,3),eligible=game.state.roll.faces.filter(f=>f.visible);let found=null;function choose(i,faces){if(found)return;if(i===3){if(E.connected(faces))found=faces.map(f=>f.id);return;}for(const f of eligible)if(f.value===wanted[i]&&!faces.some(other=>other.id===f.id))choose(i+1,[...faces,f]);}choose(0,[]);if(!found){result={ok:false,message:'その数字の組み合わせで、見える3面を辺でつなげられない。'};break;}result=game.chooseTrio(found);if(!result.ok)break;}for(const value of values){if(game.phase!=='bonus')break;const face=game.state.roll.faces.find(f=>f.visible&&f.value===value&&!game.state.trio.includes(f.id));if(!face){result={ok:false,message:`追加指定に使える${value}の面が見えない。`};break;}result=game.chooseBonus(face.id);if(!result.ok)break;}result=result||{ok:false,message:'指定できる面がない。'};break;}case'noop':result={ok:true,message:game.log(action.message)};break;case'unknown':result={ok:false,message:action.message};break;default:return{ok:true,action,ui:true};}return{...result,action};}
const api={parse,execute};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SixthCommands=api;
})(typeof window!=='undefined'?window:globalThis);
