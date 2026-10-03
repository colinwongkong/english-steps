(function(){
  'use strict';
  // 与文章页一致的 CEFR 级别定义：[code, 中文名, English]
  const LEVELS=[['A1','入门','Beginner'],['A2','基础','Elementary'],['B1','中级','Intermediate'],['B2','中高级','Upper intermediate'],['C1','高级','Advanced'],['C2','精通','Proficient']];
  const nav=document.getElementById('levelNav');
  const sections=document.getElementById('levelSections');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // 级别导航（锚点跳转）
  nav.innerHTML=LEVELS.map(([code,cn])=>`<a href="#level-${code}" data-level="${code}"><b>${code}</b> · ${cn}</a>`).join('');

  // 每个级别生成独立分区
  sections.innerHTML=LEVELS.map(([code,cn,en])=>{
    const songs=MUSIC.filter(s=>s.level===code);
    if(!songs.length)return '';
    const cards=songs.map(s=>`
      <a class="song-card" href="music-player.html?id=${encodeURIComponent(s.id)}" target="_blank" rel="noopener" aria-label="播放歌曲：${esc(s.title)}">
        <span class="song-theme">${esc(s.theme)}</span>
        <b>${esc(s.title)}</b>
        <span class="song-cn">（${esc(s.cnTitle)}）</span>
        <span class="song-style">${esc(s.style)}</span>
        <span class="song-meta"><span>${s.lines.length} 行歌词 · ${code} CEFR</span><span class="song-arrow" aria-hidden="true">↗</span></span>
      </a>`).join('');
    return `<section class="music-level-sec" id="level-${code}">
      <div class="sec-head"><span class="lvl-badge">${code}</span><span class="lvl-name">${cn}</span><span class="lvl-en">${en}</span><span class="lvl-count">${songs.length} 首</span></div>
      <div class="song-grid">${cards}</div>
    </section>`;
  }).join('');

  const total=MUSIC.length;
  const cnt=document.getElementById('totalCount');
  if(cnt)cnt.textContent=total;
})();
