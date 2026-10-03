(function(){
  'use strict';
  const select=document.getElementById('songSelect');
  const panel=document.getElementById('musicPanel');
  const lineAudio=new Audio(); // 逐句播放
  let currentSong=null, playSeq=false, seqIdx=0;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function stopSeq(){playSeq=false;seqIdx=0;lineAudio.onended=null;}

  function renderSelect(){
    select.innerHTML=MUSIC.map(s=>`<button class="song-card${currentSong&&currentSong.id===s.id?' active':''}" data-id="${esc(s.id)}"><span class="song-level">${esc(s.level)} · CEFR</span><b>${esc(s.title)}</b><span class="song-cn">（${esc(s.cnTitle)}）</span><span class="song-style">${esc(s.style)}</span></button>`).join('');
    select.querySelectorAll('.song-card').forEach(b=>b.onclick=()=>{stopSeq();currentSong=MUSIC.find(s=>s.id===b.dataset.id)||currentSong;renderSelect();renderPanel();});
  }

  function renderPanel(){
    if(!currentSong){panel.innerHTML='';return;}
    const s=currentSong;
    const vocab=s.vocab.map(v=>`<span class="vocab"><b>${esc(v[0])}</b><span>${esc(v[1])}</span></span>`).join('');
    panel.innerHTML=`
      <div class="music-top">
        <div class="music-id"><span class="music-level">${esc(s.level)} · ${esc(s.theme)}</span><span class="music-style">${esc(s.style)}</span></div>
        <h2>${esc(s.title)} <span>（${esc(s.cnTitle)}）</span></h2>
        <div class="music-full">
          <audio controls preload="metadata" src="${esc(s.full)}"></audio>
          <button class="control-btn primary" id="seqBtn">▶ 逐句连播</button>
        </div>
        <p class="music-hint">点任意一行听这一句的演唱，跟着读、跟着唱；也可以从头逐句连播。</p>
      </div>
      <div class="lyric-list" id="lyricList"></div>
      <div class="vocab-wrap"><h2>生词 Vocabulary</h2><div class="wordlist">${vocab}</div></div>`;
    // 渲染歌词行
    const list=document.getElementById('lyricList');
    s.lines.forEach((line,i)=>{
      const row=document.createElement('button');
      row.className='lyric-line';
      row.dataset.i=i;
      row.innerHTML=`<span class="line-en">${esc(line.en)}</span><span class="line-cn">${esc(line.cn)}</span><span class="line-play" aria-hidden="true">▶</span>`;
      row.onclick=()=>{stopSeq();playLine(i);};
      list.appendChild(row);
    });
    document.getElementById('seqBtn').onclick=()=>{ if(playSeq){stopSeq();document.getElementById('seqBtn').textContent='▶ 逐句连播';} else {playSeq=true;seqIdx=0;document.getElementById('seqBtn').textContent='⏸ 停止连播';stepSeq();} };
    // 滚动到当前行
    const first=document.getElementById('lyricList');
    if(first.firstElementChild){first.firstElementChild.scrollIntoView({block:'nearest'});}
  }

  function highlight(i){
    const rows=document.querySelectorAll('.lyric-line');
    rows.forEach((r,idx)=>r.classList.toggle('active',idx===i));
    const target=rows[i];
    if(target&&target.scrollIntoView)target.scrollIntoView({block:'center',behavior:'smooth'});
  }

  function playLine(i){
    const s=currentSong; if(!s)return;
    highlight(i);
    lineAudio.src=s.lines[i].audio;
    lineAudio.play();
  }

  function stepSeq(){
    const s=currentSong; if(!s)return;
    if(!playSeq||seqIdx>=s.lines.length){stopSeq();document.getElementById('seqBtn').textContent='▶ 逐句连播';return;}
    highlight(seqIdx);
    lineAudio.src=s.lines[seqIdx].audio;
    lineAudio.onended=()=>{seqIdx++;stepSeq();};
    lineAudio.play();
  }

  window.addEventListener('load',()=>{currentSong=MUSIC[0]||null;renderSelect();renderPanel();});
})();
