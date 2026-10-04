(function(){
  'use strict';
  const header=document.getElementById('playerHeader');
  const panel=document.getElementById('musicPanel');
  const navBox=document.getElementById('playerNav');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const id=new URLSearchParams(location.search).get('id')||'';
  const song=MUSIC.find(s=>s.id===id);
  if(!song){
    header.innerHTML=`<a class="back-link" href="music.html">← 返回音乐跟读</a><div class="eyebrow">LISTEN · SING · LEARN</div><h1>没有找到这首歌</h1>`;
    panel.innerHTML='<div class="notfound">歌曲不存在或链接有误。<br><a href="music.html" style="color:var(--green)">回到音乐跟读列表</a></div>';
    navBox.innerHTML='';
    return;
  }

  document.title=`${song.title} · 音乐跟读 · English Steps`;

  // 头信息
  header.innerHTML=`
    <a class="back-link" href="music.html">← 返回音乐跟读</a>
    <div class="eyebrow">LISTEN · SING · LEARN</div>
    <h1>${esc(song.title)} <span>（${esc(song.cnTitle)}）</span></h1>
    <div class="music-id">
      <span class="music-level" data-level="${esc(song.level)}">${esc(song.level)} · CEFR</span>
      <span class="music-theme">${esc(song.theme)}</span>
      <span class="music-style">${esc(song.style)}</span>
    </div>`;

  // 主体：播放器 + 歌词 + 生词
  const vocab=song.vocab.map(v=>`<span class="vocab"><b>${esc(v[0])}</b><span>${esc(v[1])}</span></span>`).join('');
  panel.innerHTML=`
    <div class="music-top">
      <div class="music-full">
        <audio id="fullAudio" controls preload="metadata" src="${esc(song.full)}"></audio>
        <button id="repeatBtn" class="repeat-btn" type="button" data-state="0" aria-label="循环播放：关">循环：关</button>
      </div>
      <p class="music-hint">播放完整 AI 演唱，歌词随进度高亮；跟着听、跟着读，每句都有中文翻译。点击“循环”可切换单曲循环或列表循环。</p>
    </div>
    <div class="lyric-list" id="lyricList"></div>
    <div class="vocab-wrap"><h2>生词 Vocabulary</h2><div class="wordlist">${vocab}</div></div>`;

  const list=document.getElementById('lyricList');
  song.lines.forEach(line=>{
    const row=document.createElement('div');
    row.className='lyric-line';
    row.innerHTML=`<span class="line-en">${esc(line.en)}</span><span class="line-cn">${esc(line.cn)}</span>`;
    list.appendChild(row);
  });

  // 歌词随播放进度高亮
  const audio=document.getElementById('fullAudio');

  // 循环控件：0 关闭 / 1 单曲循环 / 2 列表循环
  const repeatBtn=document.getElementById('repeatBtn');
  const repeatLabels=['关','单曲循环','列表循环'];
  let repeatState=0;
  const renderRepeat=()=>{
    repeatBtn.textContent='循环：'+repeatLabels[repeatState];
    repeatBtn.dataset.state=String(repeatState);
    repeatBtn.setAttribute('aria-label','循环播放：'+repeatLabels[repeatState]);
  };
  repeatBtn.addEventListener('click',()=>{
    repeatState=(repeatState+1)%3;
    audio.loop=(repeatState===1);
    renderRepeat();
  });

  audio.addEventListener('timeupdate',()=>{
    const rows=list.querySelectorAll('.lyric-line');
    if(!rows.length)return;
    const d=audio.duration||0;
    if(d<=0)return;
    const p=Math.min(0.9999,audio.currentTime/d);
    const idx=Math.floor(p*song.lines.length);
    rows.forEach((r,i)=>r.classList.toggle('active',i===idx));
  });
  audio.addEventListener('ended',()=>{
    if(repeatState===1) return; // 单曲循环：audio.loop 自动重播，不触发 ended
    list.querySelectorAll('.lyric-line').forEach(r=>r.classList.remove('active'));
    if(repeatState===2){
      if(next) location.href='music-player.html?id='+encodeURIComponent(next.id);
      else location.href='music-player.html?id='+encodeURIComponent(MUSIC[0].id);
    }
  });

  // 上一首 / 下一首（按级别顺序）
  const ordered=MUSIC;
  const cur=ordered.findIndex(s=>s.id===song.id);
  const prev=cur>0?ordered[cur-1]:null;
  const next=cur>=0&&cur<ordered.length-1?ordered[cur+1]:null;
  const prevHtml=prev?`<a class="prev" href="music-player.html?id=${encodeURIComponent(prev.id)}"><span class="nav-sub">← 上一首 · ${esc(prev.level)}</span>${esc(prev.title)}</a>`:'<span></span>';
  const nextHtml=next?`<a class="next" href="music-player.html?id=${encodeURIComponent(next.id)}"><span class="nav-sub">下一首 · ${esc(next.level)} →</span>${esc(next.title)}</a>`:'<span></span>';
  navBox.innerHTML=prevHtml+nextHtml;
})();
