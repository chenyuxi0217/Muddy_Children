import { buildHistory, bits } from './logic.js?v=2';
import { drawGraph } from './graph-visual.js?v=1';

const letters = ['A', 'B', 'C', 'D', 'E'];
const colors = ['#2b8874', '#cd9a37', '#6b88b2', '#c98280', '#9380b7'];
const state = { lang: 'zh', n: 3, mask: 7, announce: true, step: 0, ghost: true, selected: null, playing: false, fullscreen: false };
let timer = null;
let toastTimer = null;
const copy = {
  zh: {
    brand:'泥孩谜题', brandSub:'THE MUDDY CHILDREN LAB', backgroundLabel:'背景说明', share:'分享实验',
    eyebrow:'一个关于知识的思想实验', title:'泥巴不说话，<em>沉默会。</em>',
    subtitle:'他们看得见彼此，却看不见自己。一次次沉默，如何让答案变得确定？',
    puzzleIntro:'几个孩子中，有些人头上沾着泥巴。每个孩子能看见别人，却看不见自己。爸爸先公开宣布「至少一人有泥巴」，随后反复说：「知道自己头上有泥巴的小孩，请站出来。」孩子们都能正确推理，并同时回应。他们会在第几轮确定自己的状态？',
    config:'设置场景', count:'孩子人数', decrease:'减少孩子人数', increase:'增加孩子人数',
    preset1:'3 人 · 全有泥巴', preset2:'4 人 · 2 人有泥巴', preset3:'5 人 · 3 人有泥巴',
    announce:'先公开宣布「至少一人有泥巴」', scene:'孩子们的世界', sceneNote:'每个人都看得见其他人',
    actual:'真实世界', fatherSays:'爸爸说', beforeSpeech:'爸爸即将作出公开公告。', noAnnounceSpeech:'爸爸没有宣布「至少一人有泥巴」。',
    announcementSpeech:'「你们当中，至少有一人头上有泥巴。」', roundSpeech:'「知道自己头上有泥巴的小孩，请站出来。」',
    muddy:'有泥巴', clean:'干净', stepped:'站出了', toggleMud:'切换泥巴状态', sceneHint:'点击孩子，改变他头上的泥巴；回到初始模型',
    knowledge:'孩子现在知道什么？', afterUpdate:'当前模型中的知识', knowsMud:'知道有泥巴', knowsClean:'知道干净', uncertain:'还不确定',
    model:'克里普克模型', worlds:'个可能世界', expand:'放大模型', close:'关闭放大模型', regionCaption:'彩色椭圆：各孩子仍认为可能的世界',
    showRemoved:'显示已排除世界', possible:'他认为可能的世界', actualLegend:'真实世界',
    detailPrompt:'点击一个节点，查看这个可能世界', noMud:'无人有泥巴', muddyIn:'有泥巴', excluded:'已排除', retained:'仍可能',
    footnote:'1 = 有泥巴，0 = 干净；位序为 A、B、C…；连线双向，自环省略。',
    process:'推理进程', initial:'初始状态', announcement:'公开公告', round:'第 {n} 轮', complete:'推理完成', fixed:'模型不再变化',
    reset:'重新开始', previous:'上一步', play:'自动演示', pause:'暂停演示', next:'下一轮提问', nextAnnouncement:'作出公开公告', finished:'已得出答案',
    initialExplain:'<strong>每个孩子都不知道自己的状态。</strong>所有 {total} 种分布都有可能；每人只在自己有无泥巴的两个世界之间犹豫。',
    announcementExplain:'<strong>「至少一人有泥巴」成为共同知识。</strong>全员干净的世界 {zero} 被排除，每个孩子都知道其他人也听到了这句话。',
    silentExplain:'<strong>没有人站出来。</strong>排除 {removed} 个与这一回应不符的世界。在那些世界里，本应有孩子知道自己有泥巴并站出。',
    readyExplain:' <strong>{names} 已知道自己有泥巴，将在下一轮站出。</strong>',
    successExplain:'<strong>{names} 同时站出来。</strong>完整的公开回应只留下真实世界。干净的孩子此时也能确定自己干净，但不需要站出。',
    stagnantExplain:'<strong>没有人站出来，模型也没有改变。</strong>没有初始公告，重复提问和沉默不会增加知识；之后仍会如此。',
    eliminated:'本步排除 {n} 个世界',
    info1Title:'为什么沉默也是信息？',
    info1:'如果只有一个泥孩，他看见其他人都干净，就能在公告后立即确定自己有泥巴。如果无人站出，大家便能排除「只有一人有泥巴」。继续推理，有 k 个泥孩时，他们会在第 k 次提问时一起站出。',
    info2Title:'让可能世界逐步收缩',
    info2:'节点表示泥巴分布，连线表示孩子无法区分的世界。由于规则、推理能力和公开历史都是共同知识，每个孩子都能推导出当前模型的全部节点与连线；尚未确定的是，真实世界究竟是哪一个节点。公告与公开回应不断排除不相容的世界，使模型逐步收缩。',
    info2More:'模型已知，为什么还不知道答案？', info2Detail:'每一轮，孩子们都用上一轮模型计算各个世界里的站出者，再按实际公开观察到的名单删去不符的世界，因此能同步推导出同一个新模型。图中深绿的真实节点与各孩子的彩色椭圆，是为方便观察者理解而标出的。孩子能根据眼前的泥巴识别自己的候选节点，但未必知道哪一个才是真实世界。',
    info3Title:'已知的信息，为何仍有作用？',
    info3:'至少两人有泥巴时，孩子们起初已各自知道「有人有泥巴」，但这还不是共同知识。爸爸公开宣布后，人人知道、人人知道别人知道……，形成递归的共同保证。看似重复的公告，改变了他们关于彼此知识的知识，因此仍能推动推理。',
    footer:'为好奇心而做 · 一个可以亲手推演的思想实验', references:'进一步阅读', referenceLead:'进一步阅读：', source1:'公开宣告', source1Free:'配套讲义', referenceOpen:'（', referenceClose:'）',
    minMud:'有初始公告时，至少要有一位泥孩。关闭公告后可尝试全员干净。',
    needMud:'已为 A 添加泥巴，使「至少一人有泥巴」的公告为真。', copied:'实验链接已复制', copyFailed:'可复制浏览器地址来分享这个实验。',
    regionsHint:'椭圆颜色与 A、B、C… 对应；圈住两个世界表示仍不确定，只剩一个表示已知自己的状态。',
    regionDescription:'{child} 仍认为可能：{worlds}',
    roundA11y:'观察第 {n} 次提问后的回应', initialA11y:'查看最初的完整模型', announcementA11y:'查看公开公告后的模型',
    selectedWorld:'所选世界', keyboard:'空格或回车选择世界',
  },
  en: {
    brand:'Muddy Children', brandSub:'AN EPISTEMIC LOGIC LAB', backgroundLabel:'Background', share:'Share experiment',
    eyebrow:'A THOUGHT EXPERIMENT ABOUT KNOWLEDGE', title:'Mud is quiet.<br><em>Silence speaks.</em>',
    subtitle:'They can see each other, but not themselves. How does saying nothing reveal the answer?',
    puzzleIntro:'Some children have mud on their foreheads. Each child can see everyone else, but not themselves. Father announces, “At least one of you is muddy,” then repeatedly asks, “If you know you are muddy, step forward.” Everyone reasons correctly and responds at the same time. On which round can they work out their own status?',
    config:'The setup', count:'Children', decrease:'Fewer children', increase:'More children',
    preset1:'3 kids · all muddy', preset2:'4 kids · 2 muddy', preset3:'5 kids · 3 muddy',
    announce:'First announce “At least one of you is muddy”', scene:'The children’s world', sceneNote:'Everyone sees the others',
    actual:'ACTUAL WORLD', fatherSays:'Father says', beforeSpeech:'Father is about to make a public announcement.', noAnnounceSpeech:'Father makes no initial announcement about mud.',
    announcementSpeech:'“At least one of you has mud on your forehead.”', roundSpeech:'“If you know you have mud on your forehead, step forward.”',
    muddy:'Muddy', clean:'Clean', stepped:'Stepped out', toggleMud:'Toggle mud', sceneHint:'Click a child to change their mud and return to the initial model.',
    knowledge:'What do they know now?', afterUpdate:'Knowledge in this model', knowsMud:'Knows: muddy', knowsClean:'Knows: clean', uncertain:'Not sure yet',
    model:'The Kripke model', worlds:'possible worlds', expand:'Expand model', close:'Close expanded model', regionCaption:'Colored ellipses: each child’s possible worlds',
    showRemoved:'Show eliminated', possible:'Worlds they consider possible', actualLegend:'Actual world',
    detailPrompt:'Select a node to inspect a possible world', noMud:'Nobody is muddy', muddyIn:'muddy', excluded:'Eliminated', retained:'Still possible',
    footnote:'1 = muddy, 0 = clean; order: A, B, C…; links are bidirectional; self-loops are implicit.',
    process:'The reasoning', initial:'Initial model', announcement:'Announcement', round:'Round {n}', complete:'Puzzle solved', fixed:'A fixed point',
    reset:'Restart', previous:'Previous step', play:'Auto-play', pause:'Pause', next:'Ask next round', nextAnnouncement:'Announce first', finished:'Answer reached',
    initialExplain:'<strong>Nobody knows their own status yet.</strong> All {total} distributions are possible. Each child is uncertain between two worlds that differ only in their own mud.',
    announcementExplain:'<strong>“At least one is muddy” becomes common knowledge.</strong> The all-clean world {zero} is removed. Everyone knows that everyone else heard this announcement.',
    silentExplain:'<strong>Nobody steps forward.</strong> Eliminate {removed} worlds incompatible with this response: in those worlds, someone would already know they are muddy and step forward.',
    readyExplain:' <strong>{names} now know they are muddy and will step forward next round.</strong>',
    readySingleExplain:' <strong>{names} now knows they are muddy and will step forward next round.</strong>',
    successExplain:'<strong>{names} step forward together.</strong> The full public response leaves only the actual world. Clean children now know they are clean, so they stay put.',
    successSingleExplain:'<strong>{names} steps forward.</strong> The full public response leaves only the actual world. Clean children now know they are clean, so they stay put.',
    stagnantExplain:'<strong>Nobody steps forward, and the model stays unchanged.</strong> Without the initial announcement, repeated requests and silence add no knowledge. This will continue indefinitely.',
    eliminated:'{n} worlds removed this step',
    info1Title:'When silence becomes information',
    info1:'With just one muddy child, seeing everyone else clean makes the announcement enough to know. If nobody steps forward, “only one is muddy” can be ruled out. Repeat this reasoning: with k muddy children, they step forward together on request k.',
    info2Title:'A shrinking world of possibilities',
    info2:'Nodes represent mud distributions; links join worlds a child cannot distinguish. Because the rules, reasoning assumptions, and public history are common knowledge, every child can reconstruct all the worlds and links in the current model. What may remain uncertain is which node is the actual world. Announcements and public responses remove incompatible worlds, shrinking the model.',
    info2More:'Knowing the model, but not the answer', info2Detail:'Each round, the children use the previous model to calculate who would respond in every world, then eliminate worlds that disagree with the publicly observed responders. They can therefore reconstruct the same updated model. The dark green actual node and colored possibility ellipses are marked for the observer. Each child can identify their candidate nodes from the mud they see, without necessarily knowing which is actual.',
    info3Title:'Why announce what everyone knows?',
    info3:'With at least two muddy children, everyone initially knows that someone is muddy, but this fact is not yet common knowledge. Father’s public announcement makes everyone know it, know that everyone knows it, and so on. This shared guarantee changes what they can infer about one another’s knowledge, even though the statement sounds familiar.',
    footer:'Made for curiosity · A thought experiment you can play with', references:'Further reading', referenceLead:'Further reading: ', source1:'Public Announcements', source1Free:'Companion slides', referenceOpen:' (', referenceClose:')',
    minMud:'With the initial announcement on, at least one child must be muddy. Turn it off to try an all-clean world.',
    needMud:'A is now muddy so that the announcement “At least one is muddy” is true.', copied:'Experiment link copied', copyFailed:'Copy the browser address to share this experiment.',
    regionsHint:'Colors match A, B, C… Two enclosed worlds mean uncertainty; one remaining world means they know their own status.',
    regionDescription:'{child} considers possible: {worlds}',
    roundA11y:'Observe the response after request {n}', initialA11y:'View the initial full model', announcementA11y:'View the model after the announcement',
    selectedWorld:'Selected world', keyboard:'Press Enter or Space to select',
  },
};

const icons = {
  arrow:'<path d="M4 8h8m-3-3 3 3-3 3"/>', back:'<path d="m10 4-4 4 4 4"/>',
  play:'<path d="m5 3 7 5-7 5Z"/>', pause:'<path d="M5 3v10M11 3v10"/>',
  reset:'<path d="M3 7a5.5 5.5 0 1 1 1 4M3 3v4h4"/>',
  expand:'<path d="M6 3H3v3m7-3h3v3M3 10v3h3m7-3v3h-3"/>', close:'<path d="m4 4 8 8m0-8-8 8"/>',
  bulb:'<path d="M6 12h4m-4 2h4M5 9a4.5 4.5 0 1 1 6 0c-.8.6-1 1-1 2H6c0-1-.2-1.4-1-2Z"/>',
  cursor:'<path d="m4 2 1.5 11 3-4 4-2.5L4 2Zm5 7 3 4"/>',
  share:'<path d="M8 10V2m-3 3 3-3 3 3M3 8v5h10V8"/>',
};
function icon(name) { return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`; }
function t(key, vars = {}) { let value = copy[state.lang][key] ?? key; for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v)); if(state.lang === 'en' && key === 'eliminated' && vars.n === 1) value=value.replace('worlds','world'); return value; }
function code(mask) { return bits(mask, state.n).map(x => Number(x)).join(''); }
function names(indices) { return indices.map(i => letters[i]).join(state.lang === 'zh' ? '、' : ', '); }
function muddyNames(mask) { return names(letters.slice(0, state.n).map((_, i) => i).filter(i => mask & (1 << i))); }
function getHistory() { return buildHistory(state.n, state.mask, state.announce); }
function getCurrent() { return getHistory()[state.step]; }
function worldDescription(mask) { const children = muddyNames(mask); return children ? `${children} ${t('muddyIn')}` : t('noMud'); }
function badge(text) { return `<span class="phase-badge">${text}</span>`; }

function boy(i, muddy) {
  const shirts = ['#83aa94', '#d2b36d', '#94aeca', '#d29c98', '#b4a1ce'];
  const standing = getCurrent().responders.includes(i);
  return `<button class="child ${standing ? 'standing' : ''}" data-child="${i}" id="child-${i}" aria-label="${letters[i]}: ${muddy ? t('muddy') : t('clean')}. ${t('toggleMud')}" aria-pressed="${muddy}">
  <svg viewBox="0 0 110 138" role="img" aria-label="${letters[i]} ${muddy ? t('muddy') : t('clean')}">
    <ellipse class="step-shadow" cx="55" cy="129" rx="25" ry="4" fill="#cdd9c3" opacity=".6"/>
    <path d="M38 91 39 118 49 118 51 99h8l2 19h10l1-27" fill="#667b69"/>
    <path d="m40 116-1 10h11v-10m10 0v10h11l-1-10" fill="#edc4a4"/>
    <path d="M38 124h13v6H35q-1-4 3-6m21 0h13l4 6H59Z" fill="#3d5347"/>
    <path d="m36 65-11 23 8 4 9-18m32-9 11 23-8 4-9-18" fill="#edc4a4"/>
    <path d="M40 61 31 66l5 15 4-2-3 23h36l-3-23 4 2 5-15-10-5Z" fill="${shirts[i]}"/>
    <path d="M47 58v8q8 8 16 0v-8" fill="#edc4a4"/>
    <path d="M47 62q8 7 16 0" fill="none" stroke="#d9aa8c" stroke-width="1.5"/>
    <ellipse cx="30" cy="37" rx="5" ry="7" fill="#e7b897"/><ellipse cx="80" cy="37" rx="5" ry="7" fill="#e7b897"/>
    <path d="M30 24Q30 5 54 5q27 0 27 24v11q-1 23-26 24Q30 62 29 40Z" fill="#f0cbac"/>
    <path d="M29 34q-5-16 5-25Q50-3 68 4q19 3 15 29l-6-7-3-11q-15 9-30 2l-9 8-1 12Z" fill="#4b493b"/>
    <path d="m39 9 1-5 6 3m17-4 7-1-1 6" fill="#4b493b"/>
    ${muddy ? '<path d="M45 25q1-6 7-3l5-2 4 4 6 1-1 6-5 2-4-2-5 1-6-3Z" fill="#947347"/><circle cx="69" cy="34" r="1.7" fill="#947347"/>' : ''}
    <path d="m39 36 6-1m20 0 6 1" stroke="#6b5643" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="43" cy="40" rx="1.6" ry="2.1" fill="#4d4c3f"/><ellipse cx="67" cy="40" rx="1.6" ry="2.1" fill="#4d4c3f"/>
    <path d="m54 41-1 5h3m-8 5q7 5 14-1" stroke="#ad7e5f" stroke-width="1.1" stroke-linecap="round" fill="none"/>
    <ellipse cx="38" cy="46" rx="4" ry="2" fill="#e6b096" opacity=".45"/><ellipse cx="72" cy="46" rx="4" ry="2" fill="#e6b096" opacity=".45"/>
  </svg><span class="child-label"><span class="child-letter">${letters[i]}</span>${standing ? `<span class="child-status">${t('stepped')}</span>` : muddy ? t('muddy') : t('clean')}</span></button>`;
}

function graphMarkup(snapshot) {
  return drawGraph({
    n: state.n, actualMask: state.mask, snapshot,
    showRemoved: state.ghost, selected: state.selected, colors,
    labels: {
      code, worldDescription, text: t,
      possibility: (child, worlds) => t('regionDescription', { child: letters[child], worlds: worlds.map(code).join(' / ') }),
    },
  });
}

function explanation(snapshot) {
  if (snapshot.phase === 'initial') return t('initialExplain', { total: 2 ** state.n });
  if (snapshot.phase === 'announcement') return t('announcementExplain', { zero: code(0) });
  if (snapshot.stagnant) return t('stagnantExplain');
  if (snapshot.responders.length) return t(state.lang === 'en' && snapshot.responders.length === 1 ? 'successSingleExplain' : 'successExplain', { names: names(snapshot.responders) });
  const ready = snapshot.knowledge.map((k, i) => k.muddy ? i : -1).filter(i => i >= 0);
  return t('silentExplain', { removed: snapshot.removed.length }) + (ready.length ? t(state.lang === 'en' && ready.length === 1 ? 'readySingleExplain' : 'readyExplain', { names: names(ready) }) : '');
}
function phaseTitle(snapshot) {
  if (snapshot.phase === 'initial') return t('initial');
  if (snapshot.phase === 'announcement') return t('announcement');
  return t('round', { n: snapshot.round });
}

function render() {
  const focusId = document.activeElement?.id;
  const history = getHistory();
  state.step = Math.min(state.step, history.length - 1);
  const snapshot = history[state.step];
  const done = state.step === history.length - 1;
  const speech = snapshot.phase === 'initial' ? (state.announce ? 'beforeSpeech' : 'noAnnounceSpeech') : snapshot.phase === 'announcement' ? 'announcementSpeech' : 'roundSpeech';
  const selected = state.selected;
  const selectedDetail = selected === null ? t('detailPrompt') : `<strong>${t('selectedWorld')} ${code(selected)}</strong> · ${worldDescription(selected)}`;
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.title = state.lang === 'zh' ? '泥孩谜题 · 交互式逻辑实验室' : 'Muddy Children · An Interactive Logic Lab';
  document.querySelector('meta[name="description"]').content = state.lang === 'zh' ? '探索泥孩谜题，逐轮观察克里普克模型、共同知识与公开公告如何改变孩子们的知识。' : 'Explore the muddy children puzzle with live Kripke models, public announcements, and step-by-step epistemic reasoning.';
  document.getElementById('app').innerHTML = `
  <header><a class="brand" href="#" aria-label="${t('brand')}"><span class="brand-symbol" aria-hidden="true"></span><span class="brand-name">${t('brand')}<small>${t('brandSub')}</small></span></a><div class="header-right"><button id="share" class="header-link" style="border:0;background:none;display:flex;align-items:center;gap:5px">${icon('share')} ${t('share')}</button><div class="language" role="group" aria-label="Language / 语言"><button id="lang-zh" class="${state.lang === 'zh' ? 'active' : ''}" aria-pressed="${state.lang === 'zh'}" lang="zh-CN">中文</button><button id="lang-en" class="${state.lang === 'en' ? 'active' : ''}" aria-pressed="${state.lang === 'en'}" lang="en">EN</button></div></div></header>
  <main><section class="hero"><div><div class="eyebrow">${t('eyebrow')}</div><h1>${t('title')}</h1><p class="subtitle">${t('subtitle')}</p><p class="puzzle-intro">${t('puzzleIntro')}</p></div></section>
  <section class="lab" aria-label="${t('brand')}">
    <div class="lab-toolbar"><div class="toolbar-left"><span class="section-number">01</span><span class="toolbar-label">${t('config')}</span><div class="count-control"><button id="decrease" aria-label="${t('decrease')}" ${state.n <= 2 ? 'disabled' : ''}>−</button><span aria-label="${t('count')}">${state.n}</span><button id="increase" aria-label="${t('increase')}" ${state.n >= 5 ? 'disabled' : ''}>+</button></div><span class="toolbar-divider"></span><div class="presets">${[[3,7,'preset1'],[4,3,'preset2'],[5,21,'preset3']].map(([n, m, key], i) => `<button id="preset-${i}" data-preset="${i}" class="chip ${state.n === n && state.mask === m && state.announce ? 'active' : ''}">${t(key)}</button>`).join('')}</div></div><label class="announcement-toggle"><input id="announcement-toggle" type="checkbox" ${state.announce ? 'checked' : ''}><span class="switch" aria-hidden="true"></span>${t('announce')}</label></div>
    <div class="experiment-grid">
      <section class="scene-panel"><div class="panel-heading"><div class="panel-title"><span class="tiny-dot"></span>${t('scene')}</div><span class="panel-note">${t('sceneNote')}</span></div>
        <div class="scene"><div class="scene-top"><span class="real-tag">${t('actual')}</span><span class="world-code">w = ${code(state.mask)}</span></div><div class="speech"><span class="speech-speaker">${snapshot.phase === 'initial' ? t('config') : t('fatherSays')}</span>${t(speech)}</div><div class="children">${bits(state.mask,state.n).map((muddy, i) => boy(i, muddy)).join('')}</div></div><div class="scene-hint">${icon('cursor')}${t('sceneHint')}</div>
        <div class="knowledge-heading"><span>${t('knowledge')}</span><small>${t('afterUpdate')}</small></div><div class="knowledge-list">${snapshot.knowledge.map((k, i) => `<div class="knowledge-card ${k.muddy || k.clean ? 'known' : ''}"><span class="kid-letter" style="color:${colors[i]}">${letters[i]}</span><p>${k.muddy ? t('knowsMud') : k.clean ? t('knowsClean') : t('uncertain')}</p></div>`).join('')}</div>
      </section>
      <section class="model-panel ${state.fullscreen ? 'graph-fullscreen' : ''}" ${state.fullscreen ? 'role="dialog" aria-modal="true"' : ''} aria-label="${t('model')}"><div class="panel-heading"><div class="panel-title"><span class="tiny-dot" style="background:#91a37e"></span>${t('model')}</div><div class="model-title-right"><span class="model-stats"><strong>${snapshot.worlds.length}</strong> / ${2 ** state.n} ${t('worlds')}</span><button id="expand-model" class="icon-button" title="${t('expand')}" aria-label="${t('expand')}">${icon('expand')}</button><button id="close-model" class="icon-button close-fullscreen" title="${t('close')}" aria-label="${t('close')}">${icon('close')}</button></div></div>
        <div class="perspective-bar model-view-options"><span class="region-caption">${t('regionCaption')}</span><label class="ghost-toggle"><input id="ghost-toggle" type="checkbox" ${state.ghost ? 'checked' : ''}>${t('showRemoved')}</label></div>
        <div class="graph-wrap">${graphMarkup(snapshot)}</div>
        <div class="model-caption"><div class="graph-legend"><div class="edge-legend">${letters.slice(0,state.n).map((letter,i) => `<span class="legend-item"><i style="background:${colors[i]}"></i>${letter}</span>`).join('')}</div><span class="actual-legend">${t('actualLegend')}</span></div>
        <div class="world-detail"><span>${selectedDetail}</span>${selected !== null ? `<span>${snapshot.worlds.includes(selected) ? t('retained') : t('excluded')}</span>` : ''}</div><p class="model-footnote">${t('regionsHint')}</p><p class="model-footnote">${t('footnote')}</p></div>
        <div class="model-navigation"><span class="model-step-status" role="status" aria-live="polite">${phaseTitle(snapshot)} · ${state.step + 1} / ${history.length}</span><div class="model-step-actions"><button id="model-previous" class="btn" ${state.step === 0 ? 'disabled' : ''}>${icon('back')}${t('previous')}</button><button id="model-next" class="btn primary" ${done ? 'disabled' : ''}>${done ? snapshot.stagnant ? t('fixed') : t('finished') : state.step === 0 && state.announce ? t('nextAnnouncement') : t('next')}${icon('arrow')}</button></div></div>
      </section>
    </div>
    <section class="round-panel" aria-label="${t('process')}"><div class="round-top"><div class="round-title"><span class="section-number">02</span>${t('process')}${badge(snapshot.done ? snapshot.stagnant ? t('fixed') : t('complete') : phaseTitle(snapshot))}</div><div class="round-actions"><button id="reset" class="btn secondary icon" title="${t('reset')}" aria-label="${t('reset')}">${icon('reset')}</button><button id="previous" class="btn icon" title="${t('previous')}" aria-label="${t('previous')}" ${state.step === 0 ? 'disabled' : ''}>${icon('back')}</button><button id="play" class="btn" aria-label="${state.playing ? t('pause') : t('play')}">${icon(state.playing ? 'pause' : 'play')}${state.playing ? t('pause') : t('play')}</button><button id="next" class="btn primary" ${done ? 'disabled' : ''}>${done ? snapshot.stagnant ? t('fixed') : t('finished') : state.step === 0 && state.announce ? t('nextAnnouncement') : t('next')}${icon('arrow')}</button></div></div>
      <nav class="timeline" aria-label="${t('process')}">${history.map((s,i) => `<button id="step-${i}" data-step="${i}" class="timeline-step ${i === state.step ? 'active' : i < state.step ? 'past' : ''}" aria-current="${i === state.step ? 'step' : 'false'}" aria-label="${s.phase === 'initial' ? t('initialA11y') : s.phase === 'announcement' ? t('announcementA11y') : t('roundA11y',{n:s.round})}"><span class="step-dot">${s.phase === 'initial' ? '○' : s.phase === 'announcement' ? '!' : s.round}</span><span class="step-label">${phaseTitle(s)}</span></button>`).join('')}</nav>
      <div class="round-explanation" role="status" aria-live="polite" aria-atomic="true"><span class="insight-icon">${icon('bulb')}</span><div class="explanation-text">${explanation(snapshot)}</div><span class="removed-counter">${t('eliminated',{n:snapshot.removed.length})}</span></div>
    </section>
  </section>
  <section class="below" id="background" aria-label="${t('backgroundLabel')}">
    <article class="info-card"><div class="info-index">01 / THE PUZZLE</div><h2>${t('info1Title')}</h2><p>${t('info1')}</p></article>
    <article class="info-card"><div class="info-index">02 / POSSIBLE WORLDS</div><h2>${t('info2Title')}</h2><p>${t('info2')}</p><details><summary>${t('info2More')}</summary><p>${t('info2Detail')}</p></details></article>
    <article class="info-card"><div class="info-index">03 / COMMON KNOWLEDGE</div><h2>${t('info3Title')}</h2><p>${t('info3')}</p></article>
  </section>
  </main>
  <footer><span>${t('footer')}</span><div class="footer-links" aria-label="${t('references')}"><span class="reference-group">${t('referenceLead')}<a href="https://link.springer.com/chapter/10.1007/978-1-4020-5839-4_4" title="Dynamic Epistemic Logic · Chapter 4: Public Announcements · §4.10 Muddy Children, p.93 · Full text requires access" target="_blank" rel="noopener noreferrer">${t('source1')}</a>${t('referenceOpen')}<a href="https://personal.us.es/hvd/del/DELgraduate.pdf#page=38" title="Hans van Ditmarsch · Course slides listed on the Dynamic Epistemic Logic companion website · Muddy Children · PDF p.38" target="_blank" rel="noopener noreferrer">${t('source1Free')}</a>${t('referenceClose')}</span></div></footer>`;
  bindEvents();
  document.body.style.overflow = state.fullscreen ? 'hidden' : '';
  const focusTarget = focusId ? document.getElementById(focusId) : null;
  if (focusTarget && !focusTarget.disabled) focusTarget.focus({ preventScroll: true });
  if (state.fullscreen && !document.querySelector('.graph-fullscreen').contains(document.activeElement)) {
    document.getElementById(focusId === 'model-next' ? 'model-previous' : 'close-model').focus({ preventScroll: true });
  }
  updateHash();
}

function pause() { clearInterval(timer); timer = null; state.playing = false; }
function restart() { pause(); state.step = 0; state.selected = null; }
function configChanged(initial = false) { pause(); state.step = initial ? 0 : state.announce ? 1 : 0; state.selected = null; render(); }
function toast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4000); }
function stepTo(step) { pause(); state.step = step; render(); }
function next() { if (state.step < getHistory().length - 1) state.step++; render(); }
function play() {
  if (state.playing) { pause(); render(); return; }
  if (state.step === getHistory().length - 1) state.step = 0;
  state.playing = true;
  render();
  timer = setInterval(() => {
    if (state.step < getHistory().length - 1) state.step++;
    if (state.step === getHistory().length - 1) pause();
    render();
  }, 2300);
}
function bindEvents() {
  document.getElementById('lang-zh').onclick = () => { state.lang='zh'; render(); };
  document.getElementById('lang-en').onclick = () => { state.lang='en'; render(); };
  document.getElementById('decrease').onclick = () => { if(state.n <= 2) return; state.n--; state.mask &= (1 << state.n)-1; if(state.announce && !state.mask) state.mask=1; configChanged(); };
  document.getElementById('increase').onclick = () => { if(state.n >= 5) return; state.n++; configChanged(); };
  document.querySelectorAll('[data-preset]').forEach(btn => { btn.onclick = () => { const [n,mask] = [[3,7],[4,3],[5,21]][Number(btn.dataset.preset)]; Object.assign(state,{n,mask,announce:true}); configChanged(); }; });
  document.getElementById('announcement-toggle').onchange = event => { state.announce=event.target.checked; if(state.announce && !state.mask) {state.mask=1; toast(t('needMud'));} configChanged(); };
  document.querySelectorAll('[data-child]').forEach(btn => { btn.onclick = () => { const mask = state.mask ^ (1 << Number(btn.dataset.child)); if(state.announce && !mask){toast(t('minMud'));return;} state.mask=mask; configChanged(true); }; });
  document.getElementById('ghost-toggle').onchange = event => {state.ghost=event.target.checked;render();};
  document.querySelectorAll('[data-world]').forEach(node => { const select = () => {state.selected=Number(node.dataset.world); render();}; node.onclick = select; node.onkeydown = event => {if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}}; });
  document.getElementById('reset').onclick = () => {restart();render();};
  document.getElementById('previous').onclick = () => stepTo(Math.max(0,state.step-1));
  document.getElementById('next').onclick = () => {pause();next();};
  document.getElementById('model-previous').onclick = () => stepTo(Math.max(0,state.step-1));
  document.getElementById('model-next').onclick = () => {pause();next();};
  document.getElementById('play').onclick = play;
  document.querySelectorAll('[data-step]').forEach(btn => { btn.onclick = () => stepTo(Number(btn.dataset.step)); });
  document.getElementById('expand-model').onclick = () => {state.fullscreen=true; pause();render();document.getElementById('close-model').focus();};
  document.getElementById('close-model').onclick = closeFullscreen;
  document.getElementById('share').onclick = async () => {updateHash();try {await navigator.clipboard.writeText(location.href);toast(t('copied'));} catch {toast(t('copyFailed'));}};
}
function closeFullscreen() {state.fullscreen=false;render();document.getElementById('expand-model').focus();}
document.addEventListener('keydown', event => {
  if (!state.fullscreen) return;
  if(event.key === 'Escape') {event.preventDefault();closeFullscreen();return;}
  if(event.key === 'Tab') {
    const controls = [...document.querySelectorAll('.graph-fullscreen button:not([disabled]), .graph-fullscreen input, .graph-fullscreen [tabindex="0"]')].filter(el => el.getClientRects().length);
    const first=controls[0], last=controls.at(-1);
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }
});

function updateHash() {
  const hash = `n=${state.n}&mud=${state.mask}&a=${Number(state.announce)}&s=${state.step}&lang=${state.lang}`;
  if(location.hash !== `#${hash}`) history.replaceState(null,'',`#${hash}`);
}
function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  if(!params.has('n')) return;
  const n=Number(params.get('n')), mask=Number(params.get('mud'));
  if(!Number.isInteger(n)||n<2||n>5||!Number.isInteger(mask)||mask<0||mask>=2**n) return;
  Object.assign(state,{n,mask,announce:params.get('a')!=='0',lang:params.get('lang')==='en'?'en':'zh'});
  if(!mask) state.announce=false;
  const step=Number(params.get('s'));
  state.step=Number.isInteger(step)&&step>=0?Math.min(step,getHistory().length-1):0;
}
window.addEventListener('hashchange',()=>{if(new URLSearchParams(location.hash.slice(1)).has('n')){pause();state.selected=null;readHash();render();}});
readHash();
render();
