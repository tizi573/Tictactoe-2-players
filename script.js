(function(){
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const turnEl = document.getElementById('turn');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const resetRoundBtn = document.getElementById('resetRound');
  const resetAllBtn = document.getElementById('resetAll');
  const undoBtn = document.getElementById('undoBtn');

  const colorBtn = document.getElementById('colorBtn');
  const colorPicker = document.getElementById('colorPicker');

  const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  let board = Array(9).fill(null);
  let current = 'X';
  let running = true;
  let score = {X:0,O:0};
  let history = [];

  function createBoard(){
    boardEl.innerHTML='';
    for(let i=0;i<9;i++){
      const btn = document.createElement('button');
      btn.className='cell';
      btn.setAttribute('data-index', i);
      btn.setAttribute('aria-label', `Casilla ${i+1}`);
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', onCellClick);
      btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); btn.click(); } });

      let touchTimer=null;
      btn.addEventListener('touchstart', ()=>{ touchTimer=setTimeout(()=>{ btn.classList.add('filled'); btn.innerHTML='<span class="mark" style="opacity:.14">?</span>'; },600); });
      btn.addEventListener('touchend', ()=>{ clearTimeout(touchTimer); });
      btn.addEventListener('touchmove', ()=>{ clearTimeout(touchTimer); });

      boardEl.appendChild(btn);
    }
  }

  function onCellClick(e){
    const idx = Number(e.currentTarget.dataset.index);
    if(!running) return;
    if(board[idx]) return;

    placeMark(idx, current);
    history.push({idx,player:current});

    const result = checkWin();
    if(result){
      handleWin(result);
    } else if(board.every(Boolean)){
      handleDraw();
    } else {
      current = current === 'X' ? 'O' : 'X';
      updateStatus();
    }
  }

  function placeMark(idx, player){
    board[idx] = player;
    const cell = boardEl.querySelector(`[data-index='${idx}']`);
    cell.classList.add('filled');
    cell.setAttribute('aria-pressed','true');
    const span = document.createElement('span');
    span.className = 'mark ' + (player.toLowerCase());
    span.textContent = player;
    span.style.transform = 'scale(.6)';
    cell.appendChild(span);
    requestAnimationFrame(()=>{ span.style.transform='scale(1)'; span.style.opacity='1'; });
  }

  function checkWin(){
    for(const combo of WIN_COMBOS){
      const [a,b,c]=combo;
      if(board[a] && board[a]===board[b] && board[a]===board[c]){
        return {winner:board[a], combo};
      }
    }
    return null;
  }

  function handleWin({winner,combo}){
    running=false;
    combo.forEach(i=>{
      const cell = boardEl.querySelector(`[data-index='${i}']`);
      if(cell) cell.classList.add('winning');
    });
    score[winner]++;
    saveScores();
    updateScoreUI();
    statusEl.textContent = `Ganador: ${winner}`;
    try{ navigator.vibrate && navigator.vibrate(60); }catch(e){}
  }

  function handleDraw(){
    running=false;
    statusEl.textContent = 'Empate';
  }

  function updateStatus(){
    turnEl.textContent = current;
    statusEl.textContent = `Turno: `;
    statusEl.innerHTML = `Turno: <b id="turn">${current}</b>`;
  }

  function resetRound(){
    board = Array(9).fill(null);
    running = true;
    current = 'X';
    history = [];
    updateStatus();
    createBoard();
  }

  function resetAll(){
    resetRound();
    score = {X:0,O:0};
    saveScores(true);
    updateScoreUI();
  }

  function updateScoreUI(){
    scoreXEl.textContent = score.X;
    scoreOEl.textContent = score.O;
  }

  function saveScores(clear=false){
    try{
      if(clear) localStorage.removeItem('tateti-score');
      else localStorage.setItem('tateti-score', JSON.stringify(score));
    }catch(e){}
  }

  function loadScores(){
    try{
      const s = localStorage.getItem('tateti-score');
      if(s){ score = JSON.parse(s); }
    }catch(e){}
  }

  // --- NUEVO: manejar fondo con colorPicker ---
  function applyBackgroundColor(color){
    document.body.style.background = color ? color : 'linear-gradient(180deg,var(--bg),#071025 80%)';
  }

  function saveBackgroundColor(color){
    try{
      if(color) localStorage.setItem('tateti-bgcolor', color);
      else localStorage.removeItem('tateti-bgcolor');
    }catch(e){}
  }

  function loadBackgroundColor(){
    try{
      return localStorage.getItem('tateti-bgcolor');
    }catch(e){
      return null;
    }
  }

  colorBtn.addEventListener('click', ()=>{
    colorPicker.click();
  });

  colorPicker.addEventListener('input', e=>{
    const color = e.target.value;
    applyBackgroundColor(color);
    saveBackgroundColor(color);
  });

  // --- fin fondo color ---

  undoBtn.addEventListener('click', ()=>{
    if(!history.length || !running) return;
    const last = history.pop();
    board[last.idx]=null;
    const cell = boardEl.querySelector(`[data-index='${last.idx}']`);
    if(cell){ cell.classList.remove('filled'); cell.setAttribute('aria-pressed','false'); cell.innerHTML=''; }
    current = last.player;
    updateStatus();
  });

  resetRoundBtn.addEventListener('click', resetRound);
  resetAllBtn.addEventListener('click', ()=>{ if(confirm('Reiniciar puntuaciones y tablero?')) resetAll(); });

  loadScores();
  updateScoreUI();
  createBoard();
  updateStatus();

  // Aplicar color de fondo guardado si existe
  const savedBg = loadBackgroundColor();
  if(savedBg){
    applyBackgroundColor(savedBg);
    colorPicker.value = savedBg;
  }

  window._tateti = {resetRound,resetAll,board,score};
})();