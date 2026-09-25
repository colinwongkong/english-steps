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
 const prose=article.text.split(/\n\s*\n/).map(paragraph=>`<p>${paragraph.split(/(\s+)/).map(part=>/^\s+$/.test(part)?part:`<span class="word" data-word="${clean(part.toLowerCase().replace(/[^a-z'-]/g,''))}">${clean(part)}</span>`).join('')}</p>`).join('');
 document.getElementById('prose').innerHTML=prose;
 document.getElementById('translation').innerHTML=`<b>中文参考</b>${clean(article.translation)}`;
 const wordList=document.getElementById('wordlist');
 function renderWords(){wordList.innerHTML=Object.entries(article.words).slice(-12).reverse().map(([word,meaning])=>`<div class="vocab"><b>${clean(word)}</b><span>${clean(meaning)}</span></div>`).join('')}
 renderWords();
 const normalized=value=>value.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z'-]/g,'');
 async function lookup(word){const entries=Object.entries(article.words);const found=entries.find(([key])=>normalized(key)===word)||entries.find(([key])=>normalized(key).replace(/s$|ed$|ing$/,'')===word.replace(/s$|ed$|ing$/,''));if(found){toast(`${word} · ${found[1]}`);return}if(article.words[word]){toast(`${word} · ${article.words[word]}`);return}toast(`正在查询“${word}”…`);try{const response=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`);if(!response.ok)throw new Error();const result=await response.json();const meaning=result?.responseData?.translatedText?.trim();if(!meaning||meaning.toLowerCase()===word.toLowerCase()||/QUERY LENGTH|PLEASE SELECT|NO QUERY/i.test(meaning))throw new Error();article.words[word]=meaning;try{const saved=JSON.parse(localStorage.getItem('englishStepsWords')||'{}');saved[article.id]={...(saved[article.id]||{}),[word]:meaning};localStorage.setItem('englishStepsWords',JSON.stringify(saved))}catch{}renderWords();toast(`${word} · ${meaning}`)}catch{toast(`“${word}”在线释义暂不可用，请检查网络后重试`)}}
 document.querySelectorAll('.word').forEach(node=>node.addEventListener('click',()=>lookup(node.dataset.word)));
 let repeat=false,utterance=null,parts=[],partIndex=0,generation=0,gapTimer=null,gapPaused=false;
 const playButton=document.getElementById('playButton'),pauseButton=document.getElementById('pauseButton'),repeatButton=document.getElementById('repeatButton');
 const speed=document.getElementById('speed'),voiceSelect=document.getElementById('voiceSelect'),speechNote=document.getElementById('speechNote');
 function voices(){return 'speechSynthesis'in window?speechSynthesis.getVoices().filter(voice=>/^en([-_]|$)/i.test(voice.lang)):[]}
 function preferredVoice(list){return list.find(voice=>/natural|neural|premium/i.test(voice.name))||list.find(voice=>/Google US English|Microsoft Aria|Microsoft Jenny/i.test(voice.name))||list.find(voice=>/^en-US$/i.test(voice.lang))||list[0]}
 function loadVoices(){const list=voices(),current=voiceSelect.value;voiceSelect.innerHTML='<option value="">自动选择清晰英语语音</option>'+list.map((voice,index)=>`<option value="${index}">${clean(voice.name)} · ${clean(voice.lang)}${voice.default?' · 默认':''}</option>`).join('');if(current&&list.some((_,index)=>String(index)===current))voiceSelect.value=current;else{const best=preferredVoice(list);if(best)voiceSelect.value=String(list.indexOf(best))}speechNote.textContent=list.length?'按句朗读，句间停顿约半秒。已优先选择设备可用的英语语音；也可自行切换。':'按句朗读，句间停顿约半秒。当前设备未提供英语语音时，浏览器会使用默认语音。'}
 if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
 function selectedVoice(){const list=voices();return list[Number(voiceSelect.value)]||preferredVoice(list)||null}
 function controls(active){pauseButton.disabled=!active;pauseButton.textContent=speechSynthesis.paused||gapPaused?'继续':'暂停';playButton.textContent=active?'重新播放':'播放朗读'}
 function splitSentences(text){return text.split(/\n\s*\n/).flatMap((paragraph,paragraphIndex)=>paragraph.trim().match(/[^.!?]+(?:[.!?]+[”’"')\]]*|$)/g)?.map(sentence=>({text:sentence.trim(),paragraphIndex}))||[]).filter(item=>item.text)}
 function speakPart(run){if(run!==generation)return;if(partIndex>=parts.length){if(repeat){partIndex=0;gapTimer=setTimeout(()=>speakPart(run),900)}else controls(false);return}const item=parts[partIndex++];utterance=new SpeechSynthesisUtterance(item.text);utterance.lang=selectedVoice()?.lang||'en-US';const voice=selectedVoice();if(voice)utterance.voice=voice;utterance.rate=Number(speed.value);utterance.pitch=1;utterance.onend=()=>{if(run!==generation)return;gapPaused=false;const next=parts[partIndex];const pause=next&&next.paragraphIndex!==item.paragraphIndex?850:520;gapTimer=setTimeout(()=>speakPart(run),pause);controls(true)};utterance.onerror=event=>{if(run!==generation)return;if(event.error==='canceled'||event.error==='interrupted')return;controls(false);toast('语音播放遇到问题，请尝试切换语音')};speechSynthesis.speak(utterance);controls(true)}
 function speak(){if(!('speechSynthesis'in window)){toast('此浏览器暂不支持语音朗读');return}generation++;const run=generation;clearTimeout(gapTimer);speechSynthesis.cancel();gapPaused=false;parts=splitSentences(article.text);partIndex=0;speakPart(run)}
 playButton.onclick=speak;
 pauseButton.onclick=()=>{if(gapPaused){gapPaused=false;speakPart(generation)}else if(speechSynthesis.paused){speechSynthesis.resume()}else if(speechSynthesis.speaking){speechSynthesis.pause()}else if(gapTimer){clearTimeout(gapTimer);gapTimer=null;gapPaused=true}controls(true)};
 repeatButton.onclick=()=>{repeat=!repeat;repeatButton.classList.toggle('active',repeat);repeatButton.setAttribute('aria-pressed',String(repeat));repeatButton.textContent=repeat?'循环播放：开':'循环播放：关'};
 window.addEventListener('pagehide',()=>{generation++;clearTimeout(gapTimer);if('speechSynthesis'in window)speechSynthesis.cancel()});
}
