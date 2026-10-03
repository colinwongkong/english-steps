(function(){
  'use strict';
  const select=document.getElementById('songSelect');
  const panel=document.getElementById('musicPanel');
  let currentSong=null;
  let highlightTimer=null;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderSelect(){
    select.innerHTML=MUSIC.map(s=>`<button class="song-card${currentSong&&currentSong.id===s.id?' active':''}" data-id="${esc(s.id)}"><span class="song-level">${esc(s.level)} · CEFR</span><b>${esc(s.title)}</b><span class="song-cn">（${esc(s.cnTitle)}）</span><span class="song-style">${esc(s.style)}</span></button>`).join('');
    select.querySelectorAll('.song-card').forEach(b=>b.onclick=()=>{currentSong=MUSIC.find(s=>s.id===b.dataset.id)||currentSong;renderSelect();renderPanel();});
  }

  function highlight(i){
    const rows=document.querySelectorAll('.lyric-line');
    rows.forEach((r,idx)=>r.classList.toggle('active',idx===i));
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
          <audio id="fullAudio" controls preload="metadata" src="${esc(s.full)}"></audio>
        </div>
        <p class="music-hint">播放整首演唱，歌词随进度高亮；跟着听、跟着读。每句都有中文翻译。</p>
      </div>
      <div class="lyric-list" id="lyricList"></div>
      <div class="vocab-wrap"><h2>生词 Vocabulary</h2><div class="wordlist">${vocab}</div></div>`;
    const list=document.getElementById('lyricList');
    s.lines.forEach(line=>{
      const row=document.createElement('div');
      row.className='lyric-line';
      row.innerHTML=`<span class="line-en">${esc(line.en)}</span><span class="line-cn">${esc(line.cn)}</span>`;
      list.appendChild(row);
    });
    // 歌词随播放进度高亮
    const audio=document.getElementById('fullAudio');
    audio.addEventListener('timeupdate',()=>{
      const d=audio.duration||0;
      if(d<=0||!currentSong)return;
      const p=Math.min(0.9999,audio.currentTime/d);
      highlight(Math.floor(p*currentSong.lines.length));
    });
    audio.addEventListener('ended',()=>{clearActive();});
  }

  function clearActive(){
    document.querySelectorAll('.lyric-line').forEach(r=>r.classList.remove('active'));
  }

  window.addEventListener('load',()=>{currentSong=MUSIC[0]||null;renderSelect();renderPanel();});
})();
