export function roundOneInventory(snapshot){const config=snapshot?.config,state=snapshot?.state;if(!config||!Array.isArray(config.items)||!state||!['waiting','won'].includes(state.phase)||!state.placed)return{version:1,items:[]};const item=config.items.find(i=>i.id===state.placed);if(!item||typeof item.name!=='string'||typeof item.model!=='string')throw Error('1回戦の提出品を確認できません。');const oldIndex=Array.isArray(state.inventory)?state.inventory.length:state.held?1:0;return{version:1,items:[{id:'round-one-'+oldIndex+'-'+item.id,sourceId:item.id,kind:item.model==='dice'?'die':item.model==='tape'?'tape':'item',model:item.model,name:item.name,aliases:Array.isArray(item.aliases)?[...item.aliases]:[],origin:'round-one',submitted:true}]};}
export function inheritedFromCampaign(record){if(record?.inheritedInventory?.version===1&&Array.isArray(record.inheritedInventory.items)){const submitted=record.inheritedInventory.items.filter(i=>i?.submitted===true).slice(0,1);if(submitted.length)return{version:1,items:submitted};}return roundOneInventory(record?.round);}
export function submittedCarryOnly(items){return items.filter(i=>i.origin!=='round-one'||i.submitted===true);}

export function inventoryGroups(player){
 const groups=new Map();const add=(id,label,unit,icon,item)=>{if(!groups.has(id))groups.set(id,{id,label,unit,icon,count:0,items:[]});const g=groups.get(id);g.count++;g.items.push(item);};
 for(const die of player.dice||[])add('dice','サイコロ','個','dice',die);
 for(const item of player.inherited||[]){if(item.submitted!==true||item.kind==='die')continue;if(item.kind==='tape'||item.model==='tape')add('tape','透明なテープ','個','tape',item);else if(item.model==='glue')add('glue','スティックのり','個','glue',item);else if(item.kind==='robot'||item.model==='robot')add('robot','卓上AI','体','robot',item);else add('item:'+String(item.model||item.kind)+':'+String(item.name).normalize('NFKC').trim(),item.name,'個','inherited',item);}
 for(const robot of player.objects||[])add('robot','卓上AI','体','robot',robot);
 for(const card of player.cards||[])add('cards','トランプ','枚','cards',card);
 return [...groups.values()];
}
export function cardGroups(cards){const groups=new Map();for(const card of cards){const key=card.rank+':'+card.suit;if(!groups.has(key))groups.set(key,{card,count:0});groups.get(key).count++;}return[...groups.values()];}
