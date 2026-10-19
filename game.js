'use strict';
const board = document.querySelector('#board');
const sizeInput = document.querySelector('#size');
const movesEl = document.querySelector('#moves');
const timeEl = document.querySelector('#time');
const bestEl = document.querySelector('#best');
const message = document.querySelector('#message');
let size = 3, tiles = [], moves = 0, started = null, finished = false;
function neighbors(index) {
  return [index - size, index + size, index % size ? index - 1 : -1, index % size < size - 1 ? index + 1 : -1].filter(i => i >= 0 && i < size * size);
}
function solved() { return tiles.every((n, i) => n === (i + 1) % tiles.length); }
function bestScore() { try { return Number(localStorage.getItem(`tohl-best-${size}`)) || null; } catch { return null; } }
function render(focusValue) {
  board.style.setProperty('--size', size);
  board.replaceChildren(...tiles.map((n, i) => {
    const el = document.createElement(n ? 'button' : 'div');
    el.className = n ? `tile${n === i + 1 ? ' correct' : ''}` : 'blank';
    if (n) {
      el.textContent = n;
      el.setAttribute('aria-label', `${n} を移動`);
      el.dataset.value = n;
      el.addEventListener('click', () => move(i));
    } else el.setAttribute('aria-label', '空きマス');
    return el;
  }));
  movesEl.textContent = moves;
  bestEl.textContent = bestScore() ?? '—';
  if (focusValue) board.querySelector(`[data-value="${focusValue}"]`)?.focus({preventScroll:true});
}
function move(index) {
  const empty = tiles.indexOf(0);
  if (finished || !neighbors(empty).includes(index)) return;
  if (started === null) started = Date.now();
  const focused = document.activeElement?.dataset.value;
  [tiles[index], tiles[empty]] = [tiles[empty], tiles[index]];
  moves++;
  if (solved()) {
    finished = true;
    const best = bestScore();
    if (!best || moves < best) { try { localStorage.setItem(`tohl-best-${size}`, moves); } catch {} }
    message.textContent = `クリア！ ${moves} 手で完成。おめでとう！`;
  }
  render(focused);
}
function newGame() {
  size = Number(sizeInput.value);
  tiles = Array.from({length:size * size}, (_, i) => (i + 1) % (size * size));
  let previous = -1;
  // Legal moves guarantee every generated puzzle is solvable.
  for (let i = 0; i < size * size * 40; i++) {
    const empty = tiles.indexOf(0);
    const choices = neighbors(empty).filter(n => n !== previous);
    const next = choices[Math.floor(Math.random() * choices.length)];
    [tiles[empty], tiles[next]] = [tiles[next], tiles[empty]];
    previous = empty;
  }
  if (solved()) { const empty = tiles.indexOf(0), next = neighbors(empty)[0]; [tiles[empty], tiles[next]] = [tiles[next], tiles[empty]]; }
  moves = 0; started = null; finished = false;
  timeEl.textContent = '00:00';
  message.textContent = '数字をタップして、空いたマスへ。';
  render();
}
document.querySelector('#restart').addEventListener('click', newGame);
sizeInput.addEventListener('change', newGame);
document.addEventListener('keydown', event => {
  if (event.target.matches('select, input, textarea') || !event.key.startsWith('Arrow')) return;
  const empty = tiles.indexOf(0);
  const target = {ArrowUp:empty + size, ArrowDown:empty - size, ArrowLeft:empty + 1, ArrowRight:empty - 1}[event.key];
  if (target !== undefined) { event.preventDefault(); if (neighbors(empty).includes(target)) move(target); }
});
setInterval(() => {
  if (started === null || finished) return;
  const seconds = Math.floor((Date.now() - started) / 1000);
  timeEl.textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
}, 250);
newGame();
