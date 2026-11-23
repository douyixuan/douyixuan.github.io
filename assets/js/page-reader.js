(() => {
  const button = document.querySelector('#page-reader');
  const main = document.querySelector('main');
  if (!main || !button || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  const synth = window.speechSynthesis;
  let active = null;
  let chunks = [];
  let index = 0;

  function pageText() {
    const root = main.cloneNode(true);
    root.querySelectorAll('nav, footer, script, style, template, button, input, pre, svg, .mermaid, .highlight, .toc, .breadcrumbs, .post-meta, .anchor, [hidden], [aria-hidden="true"]').forEach(node => node.remove());
    root.querySelectorAll('details:not([open])').forEach(node => node.replaceWith(node.querySelector('summary')?.textContent || ''));
    root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,div,tr,br,summary').forEach(node => node.append('␞'));
    return root.textContent.split('␞').flatMap(block => {
      const line = block.replace(/\s+/g, ' ').trim();
      return line.match(/.{1,180}(?:[。！？.!?；;]\s*|\s+|$)|.{1,180}/gu) || [];
    });
  }

  function reset() {
    active = null;
    chunks = [];
    index = 0;
    button.textContent = '朗读本页';
  }

  function play() {
    const text = chunks[index];
    if (!text) return reset();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u3400-\u9fff]/u.test(text) ? 'zh-CN' : 'en-US';
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

  button.hidden = false;
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
