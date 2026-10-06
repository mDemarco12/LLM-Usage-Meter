(function () {
  const vscode = acquireVsCodeApi();
  const $ = (s) => document.querySelector(s);
  const root = $('#root'), box = $('.box'), fill = $('.fill'), num = $('.num'), detail = $('.detail');
  let tick;

  function fmt(ms) {
    const d = new Date(ms);
    const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return d.toDateString() === new Date().toDateString()
      ? t : d.toLocaleDateString([], { weekday: 'short' }) + ' ' + t;
  }
  function countdown(ms) {
    const m = Math.max(0, Math.round((ms - Date.now()) / 60000));
    return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + 'm';
  }
  function set(cls, pct, text, d, muted) {
    box.className = 'box ' + cls;
    fill.style.height = pct + '%';
    num.textContent = text;
    detail.textContent = d;
    detail.className = 'detail' + (muted ? ' muted' : '');
  }

  function render(s) {
    clearInterval(tick);
    if (s.status === 'loading') return set('none', 0, '…', 'Loading…', true);
    if (s.status === 'unavailable') return set('none', 0, '–', s.reason || 'Unavailable', true);
    const p = Math.round(s.percent);
    const cls = p >= 100 ? 'black' : p >= 80 ? 'red' : p >= 50 ? 'yellow' : 'green';
    const fillPct = Math.min(100, Math.max(0, s.percent));
    const suffix = (s.stale ? ' (stale)' : '') + (s.simulated ? ' (simulated)' : '');
    if (p >= 100 && s.resetsAt) {
      const draw = () => set(cls, fillPct, '100', 'Resets ' + fmt(s.resetsAt) + ' · ' + countdown(s.resetsAt) + suffix, false);
      draw();
      tick = setInterval(draw, 30000);
    } else {
      set(cls, fillPct, String(p), (s.resetsAt ? 'Resets ' + fmt(s.resetsAt) : '') + suffix, !s.resetsAt);
    }
  }

  window.addEventListener('message', (e) => { if (e.data.type === 'state') render(e.data.state); });
  const refresh = () => vscode.postMessage({ type: 'refresh' });
  root.addEventListener('click', refresh);
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') refresh(); });
  render({ status: 'loading' });
})();
