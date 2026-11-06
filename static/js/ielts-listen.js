/* Progressive-enhancement listening pilot: speech is local to the visitor's browser.
   The entire source comes from the canonical IELTS post's rendered MIT News section. */
(() => {
  "use strict";
  const byId = (id) => document.getElementById(id);
  const source = byId("listen-source");
  if (!source) return;
  const src = source.content.querySelector(".ielts-source-text");
  const display = byId("listen-text");
  const count = byId("listen-count");
  const state = byId("listen-state");
  const chapterLabel = byId("listen-chapter");
  const progress = byId("listen-progress");
  const playButton = byId("listen-play");
  const prevButton = byId("listen-prev");
  const nextButton = byId("listen-next");
  const rateSelect = byId("listen-rate");
  const chapterSelect = byId("listen-jump");
  const help = byId("listen-help");
  const explanation = byId("listen-explanation");
  const terms = byId("listen-terms");
  const helpAudio = byId("listen-help-audio");
  const support = byId("listen-support");
  if (!src) {
    display.textContent = "未找到英文原文，请返回文章页。";
    return;
  }

  const guides = {
    "Introduction": {
      idea: "研究者报告：光照可能使水分子直接从水面脱离，不必单靠热量。先把“观察到的现象”和“可能的用途”分开。",
      words: "evaporation 蒸发 · water surface 水面 · desalination 淡化"
    },
    "A newfound phenomenon": {
      idea: "研究团队用了 14 类测试和测量验证这种效应，研究发现入射角、偏振和颜色有关。但颜色为什么有影响，尚未得到解释。",
      words: "hydrogel 水凝胶 · polarization 偏振 · account for 解释"
    },
    "Solving a cloud conundrum": {
      idea: "这一机制可能帮助解释云层吸收阳光的观测差异，也可能用于淡化和干燥。报道中的 could 和 may 表示可能性，并非已经投入商业应用。",
      words: "discrepancy 差异 · thermal limit 热力学极限 · harness 利用"
    }
  };
  const clips = [];
  const firstOfChapter = new Map();
  let chapter = "Introduction";
  const normalize = (text) => text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

  function makeClips(text) {
    const sentences = typeof Intl.Segmenter === "function"
      ? Array.from(new Intl.Segmenter("en", { granularity: "sentence" }).segment(text), (item) => item.segment)
      : text.split(/(?<=[.!?])\s+(?=[A-Z“"‘])/);
    const pieces = [];
    let current = "";
    for (const sentence of sentences) {
      for (const word of sentence.split(/\s+/).filter(Boolean)) {
        if (current && current.length + word.length + 1 > 230) {
          pieces.push(current);
          current = "";
        }
        current += (current ? " " : "") + word;
      }
    }
    if (current) pieces.push(current);
    return pieces;
  }

  for (const paragraph of src.querySelectorAll("p")) {
    const text = normalize(paragraph.textContent);
    if (!text) continue;
    const bold = paragraph.querySelector("strong");
    if (bold && normalize(bold.textContent) === text) {
      chapter = text;
      continue;
    }
    for (const segment of makeClips(text)) {
      if (!firstOfChapter.has(chapter)) firstOfChapter.set(chapter, clips.length);
      clips.push({ chapter, text: segment });
    }
  }

  if (!clips.length) {
    display.textContent = "正文暂无可朗读段落。";
    return;
  }

  const storageKey = "ielts-listen-2026-11-02";
  function load() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch (_) { return {}; }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ index, rate: rateSelect.value })); }
    catch (_) { /* Storage may be disabled by the browser. */ }
  }
  const saved = load();
  let index = Math.max(0, Math.min(clips.length - 1, Number.isInteger(saved.index) ? saved.index : 0));
  if (["0.8", "1", "1.2"].includes(saved.rate)) rateSelect.value = saved.rate;
  let isPlaying = false;
  let playToken = 0;
  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;

  for (const [name, offset] of firstOfChapter.entries()) {
    const option = document.createElement("option");
    option.value = String(offset);
    option.textContent = name;
    chapterSelect.appendChild(option);
  }

  function update() {
    const clip = clips[index];
    display.textContent = clip.text;
    chapterLabel.textContent = clip.chapter;
    count.textContent = "第 " + (index + 1) + " / " + clips.length + " 段";
    progress.max = clips.length;
    progress.value = index + 1;
    chapterSelect.value = String(firstOfChapter.get(clip.chapter));
    explanation.textContent = guides[clip.chapter]?.idea || "先听本段，再回到原文阅读练习核对。";
    terms.textContent = guides[clip.chapter]?.words || "";
    playButton.textContent = isPlaying ? "暂停" : "播放";
    playButton.setAttribute("aria-label", isPlaying ? "暂停英文" : "播放英文");
    prevButton.disabled = index === 0;
    nextButton.disabled = index === clips.length - 1;
    save();
  }

  function stop() {
    playToken += 1;
    isPlaying = false;
    if (synth) synth.cancel();
    state.textContent = "已暂停";
    update();
  }

  function englishVoice() {
    const voices = synth.getVoices();
    return voices.find((voice) => /^en-GB/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang)) || null;
  }

  function speakCurrent() {
    if (!synth || !isPlaying) return;
    const token = ++playToken;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(clips[index].text);
    utterance.lang = "en-US";
    utterance.rate = Number(rateSelect.value);
    const voice = englishVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (token !== playToken || !isPlaying) return;
      if (index < clips.length - 1) {
        index += 1;
        update();
        speakCurrent();
      } else {
        stop();
        state.textContent = "已完成";
      }
    };
    utterance.onerror = (event) => {
      if (token !== playToken || !isPlaying) return;
      if (event.error === "canceled" || event.error === "interrupted") return;
      stop();
      state.textContent = "播放中断，请点击播放重试";
    };
    state.textContent = "英文朗读中";
    synth.speak(utterance);
  }

  function navigate(to) {
    const newIndex = Math.max(0, Math.min(clips.length - 1, to));
    const resume = isPlaying;
    stop();
    index = newIndex;
    help.open = false;
    update();
    if (resume) {
      isPlaying = true;
      update();
      speakCurrent();
    }
  }

  playButton.addEventListener("click", () => {
    if (!synth) return;
    if (isPlaying) {
      stop();
    } else {
      isPlaying = true;
      update();
      speakCurrent();
    }
  });
  prevButton.addEventListener("click", () => navigate(index - 1));
  nextButton.addEventListener("click", () => navigate(index + 1));
  chapterSelect.addEventListener("change", () => navigate(Number(chapterSelect.value)));
  rateSelect.addEventListener("change", () => {
    save();
    if (isPlaying) speakCurrent();
  });
  helpAudio.addEventListener("click", () => {
    if (!synth) return;
    stop();
    const utterance = new SpeechSynthesisUtterance(explanation.textContent);
    utterance.lang = "zh-CN";
    utterance.rate = 0.95;
    const voice = synth.getVoices().find((item) => /^zh/i.test(item.lang));
    if (voice) utterance.voice = voice;
    state.textContent = "中文提示朗读中";
    utterance.onend = () => { state.textContent = "已暂停"; };
    synth.speak(utterance);
  });
  window.addEventListener("pagehide", () => { if (synth) synth.cancel(); });
  if (!synth) {
    playButton.disabled = true;
    helpAudio.disabled = true;
    support.textContent = "此浏览器不支持网页语音朗读；仍可使用分段纯净阅读。";
  }
  update();
})();
