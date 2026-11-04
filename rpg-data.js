(function(root){'use strict';
const ELEMENTS={fire:{name:'火',color:'#ee7853',strong:'wood'},water:{name:'水',color:'#69bde5',strong:'fire'},wood:{name:'木',color:'#85c680',strong:'water'},sun:{name:'日',color:'#efd078',strong:'moon'},moon:{name:'月',color:'#ba9be8',strong:'sun'}};
const TILES={grass:0,tree:1,water:2,path:3,sand:4,rock:5,lava:6,floor:7,wall:8,flower:9,bridge:10};
const WALKABLE=new Set([0,3,4,7,9,10]);
const ITEMS={potion:{name:'薬草',description:'HPを80回復',price:25},ether:{name:'魔力の雫',description:'MPを35回復',price:45},antidote:{name:'解毒草',description:'毒と火傷を治す',price:15}};
const WORLDS=[
 {id:0,name:'緑風の原野',element:'wood',dungeon:'古樹の迷宮',boss:'根源の古樹',shape:'treant',names:['若葉スライム','毒茸の精','牙の森狼'],shapes:['slime','mushroom','wolf'],story:'森の根が街道を閉ざしている。三つの標を解き、古樹の核を鎮めよう。',lore:'かつて五つの世界は、一つの空を分け合っていた。森の核は最初の道しるべを守っている。',colors:['#284a3b','#527947','#193c44']},
 {id:1,name:'潮騒の群島',element:'water',dungeon:'沈みかけた神殿',boss:'蒼潮の海蛇',shape:'serpent',names:['潮玉クラゲ','甲殻の番兵','珊瑚の蛇'],shapes:['jelly','crab','serpent'],story:'潮が止まり、島々の橋が沈みはじめた。三つの潮標を灯して、神殿への道を開こう。',lore:'水の民は、太陽と月が互いの光を映すと記した。力の優劣は、いつも一方通行とは限らない。',colors:['#325963','#7aa7a0','#203f62']},
 {id:2,name:'紅蓮の山嶺',element:'fire',dungeon:'熔炉の砦',boss:'熔岩の飛竜',shape:'dragon',names:['火走りの小鬼','黒曜の巨兵','灰翼の幼竜'],shapes:['imp','golem','drake'],story:'山を守る熔炉が暴走している。冷却の標を三つ解放し、山頂の砦へ向かおう。',lore:'炎は森を焼き、水は炎を鎮め、木々は水を抱いて伸びる。三つの力は輪になって巡る。',colors:['#533833','#9c6650','#472d35']},
 {id:3,name:'白日の砂都',element:'sun',dungeon:'白金の陵墓',boss:'白昼のグリフォン',shape:'griffin',names:['砂金の甲虫','陽光の騎士','金翼の狩人'],shapes:['scarab','knight','griffin'],story:'夜を失った砂都に、影を取り戻そう。三つの鏡標を巡れば、陵墓の扉が応える。',lore:'光は影を消すのではない。影があるからこそ、光は形を持つ。月の核を壊すな、と石碑は告げる。',colors:['#766247','#b5a16e','#514735']},
 {id:4,name:'月影の王域',element:'moon',dungeon:'月蝕の王城',boss:'魔王・墨喰い',shape:'dragon',names:['宵闇コウモリ','月影の亡霊','紫晶の翼竜'],shapes:['bat','wraith','drake'],story:'漢字を奪った魔王が、月蝕の王城に姫を閉じ込めている。三つの月標を灯し、最後の道を開こう。',lore:'姫は最後の一字を守り、魔王に抗い続けている。奪われた漢字は五つの核に封じられた。核を取り戻せば、姫のもとへたどり着ける。',colors:['#393653','#74608c','#292e49']}
];
function rng(seed){let n=seed>>>0;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296);}
function baseMap(id,name,world,w,h,dungeon){const random=rng(200+world*71+(dungeon?9:0)),tiles=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){let tile=dungeon?8:world===3?4:0;if(x===0||y===0||x===w-1||y===h-1)tile=dungeon?8:world===1?2:5;else if(!dungeon){const n=random();if(n<.10)tile=world===1?2:world===2?6:world===3?5:1;else if(n<.15)tile=9;}tiles.push(tile);}return{id,name,world,width:w,height:h,tiles,spawn:[6,7],entities:[],encounters:[],encounterRate:dungeon?.075:.042,safeRadius:dungeon?3:11,dungeon};}
function paint(map,x,y,tile,r=0){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(x+dx>0&&y+dy>0&&x+dx<map.width-1&&y+dy<map.height-1)map.tiles[(y+dy)*map.width+x+dx]=tile;}
function road(map,a,b){const t=map.dungeon?7:3;let [x,y]=a;paint(map,x,y,t,1);while(x!==b[0]){x+=Math.sign(b[0]-x);paint(map,x,y,t,1);}while(y!==b[1]){y+=Math.sign(b[1]-y);paint(map,x,y,t,1);}}
function makeProject(){
 const p={format:'gokai-rpg-project',version:1,title:'五界の旅人',kanjiEffects:[],kanjiMappings:[],maps:[],enemies:[],characters:[],dialogs:[],flags:[],quests:[]};
 const flag=(id,name,type='boolean',initial=false)=>p.flags.push({id,name,type,initial});
 const cond=(id,value=true,op='eq')=>({flag:id,op,value});
 const set=(id,value=true)=>({type:'setFlag',flag:id,value});const item=(id,amount=1)=>({type:'item',item:id,amount});
 const dialog=(id,speaker,text,choices=[])=>{p.dialogs.push({id,speaker,text,choices});return id;};
 const entity=(m,data)=>{m.entities.push({conditions:[],actions:[],...data});};
 WORLDS.forEach((world)=>{
  const n=world.id,pre=`w${n}`,field=baseMap(`${pre}_field`,world.name,n,80,60,false),dungeon=baseMap(`${pre}_dungeon`,world.dungeon,n,48,36,true);dungeon.spawn=[4,5];p.maps.push(field,dungeon);
  flag(`${pre}_clear`,`${world.name}：核を解放`);flag(`${pre}_kills`,`${world.name}：討伐数`,'number',0);flag(`${pre}_caches`,`${world.name}：発見した宝箱`,'number',0);flag(`${pre}_lore`,`${world.name}：記録を発見`);
  for(let i=0;i<3;i++){flag(`${pre}_shrine${i}`,`${world.name}：標 ${i+1}`);flag(`${pre}_rune${i}`,`${world.dungeon}：封印 ${i+1}`);flag(`${pre}_quest${i}`,`${world.name}：依頼 ${i+1} 完了`);}
  const level=1+n*4;
  for(let i=0;i<3;i++)p.enemies.push({id:`${pre}_enemy${i}`,name:world.names[i],element:world.element,shape:world.shapes[i],color:ELEMENTS[world.element].color,hp:45+(level+i)*14,attack:9+(level+i)*3,defense:4+(level+i)*2,exp:24+(level+i)*9,gold:13+(level+i)*5,world:n,boss:false});
  p.enemies.push({id:`${pre}_guard`,name:['苔石の守護者','潮晶の守護者','熔鉄の守護者','陽鏡の守護者','月晶の守護者'][n],element:world.element,shape:'golem',color:ELEMENTS[world.element].color,hp:115+level*20,attack:12+level*3,defense:6+level*2,exp:100+level*18,gold:60+level*7,world:n,boss:false});
  p.enemies.push({id:`${pre}_boss`,name:world.boss,element:world.element,shape:world.shape,color:ELEMENTS[world.element].color,hp:270+level*34,attack:16+level*4,defense:8+level*2,exp:240+level*35,gold:180+level*20,world:n,boss:true});
  field.encounters=[0,1,2].map(i=>`${pre}_enemy${i}`);dungeon.encounters=[`${pre}_enemy1`,`${pre}_enemy2`,`${pre}_guard`];
  const guideId=`${pre}_guide`,questId=`${pre}_request`,healId=`${pre}_healer`;
  const mainChoices=[{label:'旅の目的を聞く',next:`${pre}_advice`,conditions:[],actions:[]},{label:'ここまでの道をたどる',next:`${pre}_lore_hint`,conditions:[],actions:[]}];
  dialog(guideId,'道しるべの案内人',world.story,mainChoices);dialog(`${pre}_advice`,'道しるべの案内人','地図に記した三つの標で守護者を倒すと、ダンジョンの門が開く。内部の三つの封印を解けば、核の番人に挑める。標の近くでは魔力も回復できる。道を外れた宝箱や記録も探してみてほしい。');
  dialog(`${pre}_lore_hint`,'道しるべの案内人',`記録は原野の東側、古い石碑のそばにある。${n===0?'漢字を戦闘前に構え、画を選ぶと、その画数分のMPで術が出る。明なら1・2・3・4画が日、5・6・7・8画が月、1・2・4画が口だ。火は木に、木は水に、水は火に強い。日と月は互いに弱点だ。':'前の世界へは旅のメニューから戻れる。拠点の宿と商店も忘れずに。'}`);
  const requests=[{id:`${pre}_quest0`,title:'街道の安全',description:'この世界の敵を8体倒し、拠点の依頼係へ報告する。',conditions:[cond(`${pre}_kills`,8,'gte')],reward:[{type:'gold',amount:100+n*60},item('ether',2)]},{id:`${pre}_quest1`,title:'失われた物資',description:'この世界で宝箱を3個見つけ、依頼係へ報告する。',conditions:[cond(`${pre}_caches`,3,'gte')],reward:[{type:'gold',amount:120+n*70},item('potion',3)]},{id:`${pre}_quest2`,title:'古い記録',description:'東の石碑で世界の記録を読み、依頼係へ報告する。',conditions:[cond(`${pre}_lore`)],reward:[{type:'gold',amount:100+n*70},item('antidote',3)]}];
  const questChoices=[];requests.forEach(q=>{p.quests.push({id:q.id,title:q.title,description:q.description,world:n,conditions:q.conditions,completeFlag:q.id});questChoices.push({label:`「${q.title}」を報告する`,conditions:[...q.conditions,cond(q.id,false)],actions:[...q.reward,set(q.id)]});});
  dialog(questId,'拠点の依頼係','依頼は三つ。街道の敵を8体討伐、宝箱を3個発見、そして東の石碑の記録の調査だ。条件を満たせば、ここで報酬を受け取れる。',questChoices);
  const chars=[{id:guideId,name:'案内人',color:'#b5d3b0',appearance:'scholar',dialog:guideId},{id:questId,name:'依頼係',color:'#d8b27e',appearance:'ranger',dialog:questId},{id:healId,name:'宿の主人',color:'#a8bce5',appearance:'mage',dialog:''}];p.characters.push(...chars);
  entity(field,{id:`${pre}_guide_actor`,kind:'npc',name:'案内人',x:7,y:7,character:guideId,dialog:guideId});entity(field,{id:`${pre}_requests`,kind:'npc',name:'依頼係',x:10,y:8,character:questId,dialog:questId});entity(field,{id:`${pre}_inn`,kind:'healer',name:'宿：HP・MP回復',x:5,y:10,character:healId});entity(field,{id:`${pre}_shop`,kind:'merchant',name:'道具と装備の店',x:10,y:5});
  const shrinePoints=[[23,12],[62,13],[53,44]];
  shrinePoints.forEach(([x,y],i)=>{const id=`${pre}_shrine${i}`;road(field,[6,7],[x,y]);dialog(id,`第${i+1}の標`,'標の光を、守護者が閉ざしている。解放した標は休息にも使える。',[{label:'守護者に挑む',conditions:[cond(id,false)],actions:[{type:'battle',enemy:`${pre}_guard`},set(id),{type:'heal'}]},{label:'標の光で休む',conditions:[cond(id)],actions:[{type:'heal'}]},{label:'あとにする',conditions:[],actions:[]}]);entity(field,{id,kind:'shrine',name:`標 ${i+1}`,x,y,dialog:id,doneFlag:id});});
  const gateConditions=shrinePoints.map((_,i)=>cond(`${pre}_shrine${i}`));road(field,[53,44],[73,51]);dialog(`${pre}_gate`,'封印の門','三つの標の光があれば、この先へ進める。',[{label:`${world.dungeon}へ`,conditions:gateConditions,actions:[{type:'travel',map:dungeon.id}]},{label:'戻る',conditions:[],actions:[]}]);entity(field,{id:`${pre}_gate`,kind:'portal',name:world.dungeon,x:73,y:51,dialog:`${pre}_gate`});
  const chestPoints=[[16,36],[37,26],[68,31],[12,51],[42,52]];chestPoints.forEach(([x,y],i)=>{const id=`${pre}_chest${i}`;flag(id,`宝箱 ${n+1}-${i+1}`);road(field,[23,12],[x,y]);entity(field,{id,kind:'chest',name:'古い宝箱',x,y,conditions:[cond(id,false)],actions:[item(i%2?'ether':'potion',2),{type:'gold',amount:40+n*30},set(id),{type:'addFlag',flag:`${pre}_caches`,value:1}],doneFlag:id});});
  road(field,[62,13],[70,24]);dialog(`${pre}_record`,'古い石碑',world.lore);entity(field,{id:`${pre}_record`,kind:'event',name:'世界の記録',x:70,y:24,dialog:`${pre}_record`,actions:[set(`${pre}_lore`)]});
  [[16,15],[31,40],[65,42],[8,45],[42,17],[73,37]].forEach(([x,y],i)=>{const id=`${pre}_herb${i}`;flag(id,`薬草採集 ${n+1}-${i+1}`);road(field,[6,7],[x,y]);entity(field,{id,kind:'gather',name:'薬草の茂み',x,y,conditions:[cond(id,false)],actions:[item('potion'),set(id)]});});
  if(n<4){dialog(`${pre}_next`,'世界の道標','核の光が、新しい世界への道を開いている。',[{label:`${WORLDS[n+1].name}へ`,conditions:[cond(`${pre}_clear`)],actions:[{type:'travel',map:`w${n+1}_field`}]},{label:'ここに残る',conditions:[],actions:[]}]);entity(field,{id:`${pre}_next`,kind:'portal',name:'次の世界への道',x:13,y:7,dialog:`${pre}_next`,conditions:[cond(`${pre}_clear`)]});}
  // Connected dungeon corridors, side rooms and sealed chamber.
  const random=rng(900+n);for(let y=3;y<dungeon.height-3;y+=6)for(let x=3;x<dungeon.width-3;x+=7){paint(dungeon,x,y,7,2);road(dungeon,[x,y],[Math.min(x+7,dungeon.width-4),y]);if(random()>.25)road(dungeon,[x,y],[x,Math.min(y+6,dungeon.height-4)]);}
  const runePoints=[[12,8],[36,10],[21,28]];
  runePoints.forEach(([x,y],i)=>{road(dungeon,dungeon.spawn,[x,y]);const id=`${pre}_rune${i}`;dialog(id,`封印 ${i+1}`,'封印の紋様が、門へとつながっている。',[{label:'封印の番兵に挑む',conditions:[cond(id,false)],actions:[{type:'battle',enemy:`${pre}_enemy${i}`},set(id),item('ether')]},{label:'戻る',conditions:[],actions:[]}]);entity(dungeon,{id,kind:'rune',name:`封印 ${i+1}`,x,y,dialog:id,doneFlag:id});});
  road(dungeon,[21,28],[42,29]);dialog(`${pre}_boss_intro`,world.boss,n===4?'言葉を失った世界に、希望など残っていない。姫も、最後の漢字も、すべて我が闇に沈めてやろう。':'この核を解放するなら、守るに足る力を示せ。',[{label:'核の番人に挑む',conditions:[...runePoints.map((_,i)=>cond(`${pre}_rune${i}`)),cond(`${pre}_clear`,false)],actions:[{type:'battle',enemy:`${pre}_boss`},set(`${pre}_clear`),{type:'heal'},{type:'travel',map:field.id},{type:'dialog',dialog:`${pre}_victory`}]},{label:'まだ準備する',conditions:[],actions:[]}]);entity(dungeon,{id:`${pre}_boss`,kind:'boss',name:world.boss,x:42,y:29,dialog:`${pre}_boss_intro`,enemy:`${pre}_boss`,doneFlag:`${pre}_clear`});
  dialog(`${pre}_victory`,n===4?'姫・紬':'旅の記録',n===4?'ありがとう。あなたが取り戻した漢字が、世界の名前を、人々の言葉を返してくれた。さあ、王の待つ町へ帰りましょう。':'核を解放した。拠点の東に、次の世界へ続く道が現れた。残った依頼を済ませてから進んでもいい。');
  entity(dungeon,{id:`${pre}_exit`,kind:'portal',name:'原野へ戻る',x:4,y:4,actions:[{type:'travel',map:field.id,x:72,y:50}]});
  [[16,19],[33,27],[39,4],[7,28]].forEach(([x,y],i)=>{const id=`${pre}_dchest${i}`;flag(id,`地下の宝箱 ${n+1}-${i+1}`);road(dungeon,dungeon.spawn,[x,y]);entity(dungeon,{id,kind:'chest',name:'封じられた宝箱',x,y,conditions:[cond(id,false)],actions:[item(i%2?'ether':'potion',2),{type:'gold',amount:80+n*40},set(id),{type:'addFlag',flag:`${pre}_caches`,value:1}]});});
  paint(field,6,7,3,6);paint(dungeon,4,5,7,2);
 });
 flag('story_royal_request','王の依頼を受けた');
 p.characters.push({id:'story_king',name:'王・文成',color:'#c7a354',appearance:'scholar',dialog:'story_opening_1'},{id:'story_princess',name:'姫・紬',color:'#e7a8c4',appearance:'mage',dialog:'w4_victory'});
 dialog('story_opening_1','王・文成','来てくれたか、旅人よ。魔王・墨喰いが世界から漢字を奪った。町の名も、人々の言葉も、今まさに失われようとしている。',[{label:'次へ',next:'story_opening_2',conditions:[],actions:[]}]);
 dialog('story_opening_2','王・文成','姫の紬は最後の漢字を守ろうとして、魔王にさらわれた。どうか五つの地に封じられた漢字を取り戻し、魔王を倒して姫を助けてほしい。',[{label:'次へ',next:'story_opening_3',conditions:[],actions:[]}]);
 dialog('story_opening_3','王・文成','おぬしには、漢字の画から別の字の力を引き出す才がある。まずは町で支度を整え、緑風の原野へ。核を取り戻すたびに、次の地への道が開く。頼んだぞ。',[{label:'冒険へ出る',conditions:[],actions:[set('story_royal_request')]}]);
 dialog('story_king_return','王・文成','姫を、そして奪われた漢字を取り戻してくれ。核の解放が、次の地への道を開くはずだ。');
 const town=p.maps[0];town.name='はじまりの町・緑風の原野';
 entity(town,{id:'story_king_actor',kind:'npc',name:'王・文成',x:6,y:4,character:'story_king',dialog:'story_king_return'});paint(town,6,4,3);
 town.buildings=[{x:2,y:13,w:4,h:3,label:'宿',color:'#866655'},{x:10,y:13,w:4,h:3,label:'商店',color:'#637e96'},{x:17,y:3,w:4,h:3,label:'民家',color:'#85705e'},{x:17,y:9,w:4,h:3,label:'民家',color:'#7b655e'},{x:2,y:2,w:3,h:2,label:'王の館',color:'#7d7399'}];
 town.entities.find(e=>e.id==='w0_inn').x=4;town.entities.find(e=>e.id==='w0_inn').y=16;town.entities.find(e=>e.id==='w0_shop').x=12;town.entities.find(e=>e.id==='w0_shop').y=16;
 for(const b of town.buildings){for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)town.tiles[y*town.width+x]=8;road(town,[6,7],[b.x+Math.floor(b.w/2),b.y+b.h]);}
 return p;
}
const api={ELEMENTS,TILES,WALKABLE,ITEMS,WORLDS,makeProject,rng};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RPGData=api;
})(typeof window!=='undefined'?window:globalThis);
