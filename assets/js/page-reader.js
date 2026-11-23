(() => {
  const button = document.querySelector('#page-reader');
  const main = document.querySelector('main');
  if (!main || !button) return;
  if (button.dataset.audio) {
    const player = document.createElement('audio');
    player.id = 'reading-audio';
    player.controls = true;
    player.preload = 'metadata';
    player.setAttribute('aria-label', '中英文正文朗读');
    player.addEventListener('error', () => {
      player.remove();
      button.hidden = !window.speechSynthesis;
    }, { once: true });
    player.src = button.dataset.audio;
    button.before(player);
  }
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  const synth = window.speechSynthesis;
  let active = null;
  let chunks = [];
  let index = 0;

  function pageText() {
    const article = main.querySelector('.post-single .post-content');
    const root = (article || main).cloneNode(true);
    root.querySelectorAll('nav, footer, script, style, template, button, input, pre, svg, .mermaid, .highlight, .toc, .breadcrumbs, .post-meta, .anchor, .footnotes, .footnote-ref, .share-buttons, [hidden], [aria-hidden="true"], details:not([open])').forEach(node => node.remove());
    const original = root.querySelector('.ielts-source-text');
    if (original) {
      const intro = [];
      const heading = root.querySelector('#introduction');
      for (let node = heading?.nextElementSibling; node && !node.matches('h1,h2'); node = node.nextElementSibling) {
        intro.push(node);
      }
      root.replaceChildren(...intro, original);
    }
    root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
      if (article && /^(?:参考(?:资料|链接|文献)|分享(?:链接)?|相关链接|references|sources|share)\s*[:：]?$/i.test(heading.textContent.trim())) {
        let next = heading.nextElementSibling;
        while (next && !next.matches('h1,h2,h3,h4,h5,h6')) {
          const removed = next;
          next = next.nextElementSibling;
          removed.remove();
        }
      }
      if (article || heading.matches('h1')) heading.remove();
    });
    root.querySelectorAll('p,li').forEach(node => {
      const anchor = node.querySelector('a');
      if (article && anchor && node.textContent.trim() === anchor.textContent.trim()) node.remove();
    });
    root.querySelectorAll('p,li,dt,dd,blockquote,div,tr,br,summary,h2,h3').forEach(node => node.append('␞'));
    const clips = [];
    for (const block of root.textContent.split('␞')) {
      const text = block.replace(/https?:\/\/[^\s<>，。；）]+/gu, '').replace(/\s+/g, ' ').trim();
      // Keep each English phrase together, including inline names and abbreviations.
      const runs = text.match(/[A-Za-z]+(?:[’'.-][A-Za-z]+)*(?:[ \t]+[A-Za-z0-9]+(?:[’'.-][A-Za-z]+)*)*|[^A-Za-z]+/gu) || [];
      let current = null;
      for (const run of runs) {
        const lang = /[A-Za-z]/.test(run) ? 'en-US' : /\p{Script=Han}/u.test(run) ? 'zh-CN' : null;
        if (!current || (lang && current.lang && lang !== current.lang)) {
          current = { lang, text: '' };
          clips.push(current);
        }
        current.lang ||= lang;
        current.text += run;
      }
    }
    return clips.flatMap(({ lang, text }) =>
      (text.trim().match(/.{1,180}(?:[。！？.!?；;]\s*|\s+|$)|.{1,180}/gu) || [])
        .filter(part => /[\p{L}\p{N}]/u.test(part))
        .map(part => ({ text: part, lang: lang || 'zh-CN' }))
    );
  }

  function reset() {
    active = null;
    chunks = [];
    index = 0;
    button.textContent = '朗读本页';
  }

  function play() {
    const clip = chunks[index];
    if (!clip) return reset();
    const utterance = new SpeechSynthesisUtterance(clip.text);
    utterance.lang = clip.lang;
    active = utterance;
    utterance.onend = () => {
      if (active !== utterance) return;
      index++;
      play();
    };
    utterance.onerror = () => {
      if (active !== utterance) return;
      reset();
      button.textContent = '朗读失败，重试';
    };
    button.textContent = '暂停朗读';
    synth.speak(utterance);
  }

  button.hidden = Boolean(button.dataset.audio);
  button.addEventListener('click', () => {
    if (active) {
      active = null;
      synth.cancel();
      button.textContent = '继续朗读';
      return;
    }
    if (!chunks.length) chunks = pageText();
    play();
  });
  window.addEventListener('pagehide', () => {
    reset();
    synth.cancel();
  });
})();
