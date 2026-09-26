const page= new URLSearchParams(location.search);
const article=articles.find(item=>item.id===page.get('id'));
const levelLabels=Object.fromEntries(levels.map(([code,cn])=>[code,cn]));
const clean=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toastNode=document.getElementById('toast');let toastTimer;
function toast(message){toastNode.textContent=message;toastNode.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastNode.classList.remove('show'),2600)}
if(!article){document.getElementById('articlePage').innerHTML='<div class="empty">找不到这篇短文。<a href="index.html">返回阅读首页</a></div>'}
else{
 document.title=`${article.title}（${article.subtitle}） · English Steps`;
 document.getElementById('articleHeader').innerHTML=`<a class="back-link" href="index.html">← 返回阅读首页</a><div class="article-kicker">${clean(article.level)} · ${clean(levelLabels[article.level])}　/　${clean(article.topic)}</div><h1>${clean(article.title)} <span>（${clean(article.subtitle)}）</span></h1><div class="article-deck">分级英语阅读 · 约 ${article.mins} 分钟 · ${article.text.split(/\s+/).length} 词</div>`;
 let sentenceIndex=0;
 const prose=article.text.split(/\n\s*\n/).map((paragraph,paragraphIndex)=>{
  const sentences=paragraph.match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g)||[paragraph];
  return `<p>${sentences.map(sentence=>`<span class="sentence" data-sentence-index="${sentenceIndex++}" data-paragraph-index="${paragraphIndex}">${sentence.trim().split(/(\s+)/).map(part=>/^\s+$/.test(part)?part:`<span class="word" data-word="${clean(part.toLowerCase().replace(/[^a-z'-]/g,''))}">${clean(part)}</span>`).join('')}</span>`).join(' ')}</p>`;
 }).join('');
 document.getElementById('prose').innerHTML=prose;
 document.getElementById('translation').innerHTML=`<b>中文参考</b>${clean(article.translation)}`;
 const wordList=document.getElementById('wordlist');
 function renderWords(){wordList.innerHTML=Object.entries(article.words).slice(-12).reverse().map(([word,meaning])=>`<div class="vocab"><b>${clean(word)}</b><span>${clean(meaning)}</span></div>`).join('')}
 renderWords();
 const normalized=value=>value.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z'-]/g,'');
 async function lookup(word){const entries=Object.entries(article.words);const found=entries.find(([key])=>normalized(key)===word)||entries.find(([key])=>normalized(key).replace(/s$|ed$|ing$/,'')===word.replace(/s$|ed$|ing$/,''));if(found){toast(`${word} · ${found[1]}`);return}if(article.words[word]){toast(`${word} · ${article.words[word]}`);return}toast(`正在查询“${word}”…`);try{const response=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`);if(!response.ok)throw new Error();const result=await response.json();const meaning=result?.responseData?.translatedText?.trim();if(!meaning||meaning.toLowerCase()===word.toLowerCase()||/QUERY LENGTH|PLEASE SELECT|NO QUERY/i.test(meaning))throw new Error();article.words[word]=meaning;try{const saved=JSON.parse(localStorage.getItem('englishStepsWords')||'{}');saved[article.id]={...(saved[article.id]||{}),[word]:meaning};localStorage.setItem('englishStepsWords',JSON.stringify(saved))}catch{}renderWords();toast(`${word} · ${meaning}`)}catch{toast(`“${word}”在线释义暂不可用，请检查网络后重试`)}}
 document.querySelectorAll('.word').forEach(node=>node.addEventListener('click',()=>lookup(node.dataset.word)));
 const audio=document.getElementById('articleAudio'),speed=document.getElementById('speed'),repeatButton=document.getElementById('repeatButton'),speechNote=document.getElementById('speechNote');
 const tracks=window.articleAudioTracks?.[article.id]||[];let trackIndex=0,repeat=false,trackTimer=null;
 const sentenceNodes=[...document.querySelectorAll('.sentence')];let activeSentence=null,sentenceTimeline=[];
 function setActiveSentence(node){if(activeSentence===node)return;activeSentence?.classList.remove('sentence-active');activeSentence=node||null;activeSentence?.classList.add('sentence-active')}
 function sentencesForTrack(){const paragraphCount=article.text.split(/\n\s*\n/).length;return sentenceNodes.filter(node=>tracks.length===1||Math.min(tracks.length-1,Math.floor(Number(node.dataset.paragraphIndex)*tracks.length/paragraphCount))===trackIndex)}
 function buildSentenceTimeline(){const nodes=sentencesForTrack(),duration=audio.duration;if(!nodes.length||!Number.isFinite(duration)||duration<=0){sentenceTimeline=[];setActiveSentence(null);return}const weights=nodes.map(node=>{const words=node.textContent.match(/[a-z]+(?:['’-][a-z]+)*/gi)||[];const speechTime=words.reduce((sum,word)=>sum+.2+Math.min(word.length,12)*.025,0);const text=node.textContent.trim();const pause=/[!?]["'”’)]*$/.test(text) ? .62 : /[.]["'”’)]*$/.test(text) ? .48 : /[,;:]["'”’)]*$/.test(text) ? .24 : .12;return Math.max(speechTime+pause,.3)});const total=weights.reduce((sum,weight)=>sum+weight,0);let cursor=0;sentenceTimeline=nodes.map((node,index)=>{const start=cursor;cursor+=duration*weights[index]/total;return{node,start,end:cursor}})}
 function syncSentenceHighlight(){const current=sentenceTimeline.find(item=>audio.currentTime>=item.start&&audio.currentTime<item.end);setActiveSentence(current?.node||null)}
 if(tracks.length){audio.addEventListener('loadedmetadata',buildSentenceTimeline);audio.addEventListener('play',syncSentenceHighlight);audio.addEventListener('timeupdate',syncSentenceHighlight);audio.addEventListener('seeked',syncSentenceHighlight);audio.src=tracks[0];audio.playbackRate=Number(speed.value);audio.addEventListener('ended',()=>{clearTimeout(trackTimer);setActiveSentence(null);const next=trackIndex<tracks.length-1?trackIndex+1:repeat?0:-1;if(next<0)return;trackTimer=setTimeout(()=>{trackIndex=next;audio.src=tracks[trackIndex];audio.play().catch(()=>toast('请点击播放器继续收听'))},tracks.length>1?700:0)})}
 else{audio.hidden=true;speechNote.textContent='这篇文章的 AI 朗读音频暂不可用。'}
 speed.onchange=()=>{audio.playbackRate=Number(speed.value)};
 repeatButton.onclick=()=>{repeat=!repeat;repeatButton.classList.toggle('active',repeat);repeatButton.setAttribute('aria-pressed',String(repeat));repeatButton.textContent=repeat?'循环播放：开':'循环播放：关'};
 window.addEventListener('pagehide',()=>{clearTimeout(trackTimer);audio.pause()});
}
