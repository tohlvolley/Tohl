(function(root){
'use strict';
class SlidingPuzzle{
 constructor(size=3,random=Math.random){if(![3,4].includes(size))throw Error('Invalid size');this.size=size;this.random=random;this.newGame();}
 neighbors(){const n=this.size,b=this.tiles.indexOf(0),result=[];if(b>=n)result.push(b-n);if(b<n*(n-1))result.push(b+n);if(b%n)result.push(b-1);if(b%n<n-1)result.push(b+1);return result;}
 isSolved(){return this.tiles.every((v,i)=>v===(i+1)%(this.size*this.size));}
 move(index){if(this.isSolved()||!this.neighbors().includes(index))return false;const blank=this.tiles.indexOf(0);[this.tiles[index],this.tiles[blank]]=[this.tiles[blank],this.tiles[index]];this.moves++;return true;}
 newGame(){this.tiles=Array.from({length:this.size*this.size},(_,i)=>(i+1)%(this.size*this.size));let last=-1;for(let i=0;i<200;i++){const options=this.neighbors().filter(n=>n!==last),index=options[Math.floor(this.random()*options.length)],blank=this.tiles.indexOf(0);[this.tiles[index],this.tiles[blank]]=[this.tiles[blank],this.tiles[index]];last=blank;}if(this.isSolved()){const index=this.neighbors()[0],blank=this.tiles.indexOf(0);[this.tiles[index],this.tiles[blank]]=[this.tiles[blank],this.tiles[index]];}this.initial=[...this.tiles];this.moves=0;}
 retry(){this.tiles=[...this.initial];this.moves=0;}
}
if(typeof module!=='undefined'&&module.exports){module.exports={SlidingPuzzle};return;}
root.SlidingPuzzle=SlidingPuzzle;
const board=document.querySelector('#puzzle-board');if(!board)return;
const $=s=>document.querySelector(s);let puzzle=new SlidingPuzzle(),start=null,seconds=0,finished=false;
function clock(){const value=start===null?seconds:Math.floor((performance.now()-start)/1000);$('#puzzle-time').textContent=`${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;return value;}
function best(){try{const n=Number(localStorage.getItem(`jikatsu-slide-best-${puzzle.size}`));return Number.isInteger(n)&&n>0?n:null;}catch{return null;}}
function render(focus=null){const neighbors=puzzle.neighbors();board.style.setProperty('--size',puzzle.size);board.replaceChildren();puzzle.tiles.forEach((value,index)=>{if(!value){const blank=document.createElement('span');blank.className='blank';blank.setAttribute('aria-label','空白');board.append(blank);return;}const button=document.createElement('button');button.type='button';button.textContent=value;button.dataset.index=index;button.setAttribute('aria-label',`${value}を動かす`);button.disabled=finished||!neighbors.includes(index);button.classList.toggle('movable',!button.disabled);button.addEventListener('click',()=>play(index));board.append(button);});$('#puzzle-moves').textContent=puzzle.moves;$('#puzzle-best').textContent=best()||'—';clock();if(focus!==null){const tile=board.querySelector(`[data-index="${focus}"]`);if(tile&&!tile.disabled)tile.focus({preventScroll:true});else board.focus({preventScroll:true});}}
function play(index){const blank=puzzle.tiles.indexOf(0);if(!puzzle.move(index))return;if(start===null)start=performance.now();if(puzzle.isSolved()){seconds=clock();start=null;finished=true;const record=best();if(record===null||puzzle.moves<record){try{localStorage.setItem(`jikatsu-slide-best-${puzzle.size}`,String(puzzle.moves));}catch{}}$('#puzzle-status').textContent=`CLEAR · ${puzzle.moves}手 · ${Math.floor(seconds/60)}分${seconds%60}秒`;}render(blank);}
function reset(retry=false){if(retry)puzzle.retry();else puzzle=new SlidingPuzzle(Number($('#puzzle-size').value));start=null;seconds=0;finished=false;$('#puzzle-status').textContent='';render();}
$('#puzzle-new').addEventListener('click',()=>reset());$('#puzzle-retry').addEventListener('click',()=>reset(true));$('#puzzle-size').addEventListener('change',()=>reset());
board.addEventListener('keydown',e=>{const offsets={ArrowUp:-puzzle.size,ArrowDown:puzzle.size,ArrowLeft:-1,ArrowRight:1};if(!Object.hasOwn(offsets,e.key))return;e.preventDefault();const blank=puzzle.tiles.indexOf(0),target=blank+offsets[e.key];if((e.key==='ArrowLeft'&&blank%puzzle.size===0)||(e.key==='ArrowRight'&&blank%puzzle.size===puzzle.size-1))return;play(target);});
setInterval(clock,250);render();
})(typeof window!=='undefined'?window:globalThis);
