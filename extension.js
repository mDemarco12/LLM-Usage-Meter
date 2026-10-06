const vscode = require('vscode');
const { fetchUsage } = require('./src/usageClient');
const { MeterViewProvider } = require('./src/meterView');
const { UsageStatusBar } = require('./src/statusBar');

const CLAUDE_EXT = 'anthropic.claude-code';

function activate(context) {
  let state = { status: 'loading' };
  let inFlight = false;
  let timer, resetTimer;

  const statusBar = new UsageStatusBar();
  const provider = new MeterViewProvider(context.extensionUri, () => refresh());
  const publish = (s) => { state = s; provider.update(s); statusBar.update(s); };
  publish(state);

  async function refresh() {
    if (inFlight) return;
    inFlight = true;
    try {
      const ext = vscode.extensions.getExtension(CLAUDE_EXT);
      if (!ext) throw new Error('Claude Code extension is not installed');
      const u = await fetchUsage(ext.extensionPath);
      if (!u.available) {
        publish({ status: 'unavailable', reason: u.reason });
      } else {
        publish({ status: 'ok', percent: u.percent, resetsAt: u.resetsAt });
        scheduleResetRefresh(u.resetsAt);
      }
    } catch (e) {
      publish(state.status === 'ok'
        ? { ...state, stale: true, simulated: false }
        : { status: 'unavailable', reason: String(e.message || e) });
    } finally {
      inFlight = false;
    }
  }

  function scheduleResetRefresh(resetsAt) {
    clearTimeout(resetTimer);
    if (!resetsAt) return;
    const wait = resetsAt - Date.now() + 2000;
    if (wait > 0 && wait < 2 ** 31 - 1) resetTimer = setTimeout(refresh, wait);
  }

  function startPolling() {
    clearInterval(timer);
    const mins = Math.max(1, vscode.workspace.getConfiguration('usageMeter').get('refreshMinutes', 5));
    timer = setInterval(refresh, mins * 60000);
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('usageMeter.secondary', provider),
    vscode.window.registerWebviewViewProvider('usageMeter.primary', provider),
    vscode.commands.registerCommand('usageMeter.refresh', refresh),
    vscode.commands.registerCommand('usageMeter.focus', async () => {
      for (const id of ['usageMeter.secondary', 'usageMeter.primary']) {
        try { await vscode.commands.executeCommand(`${id}.focus`); return; } catch {}
      }
    }),
    vscode.commands.registerCommand('usageMeter.simulate', async () => {
      const v = await vscode.window.showInputBox({
        prompt: 'Percentage to display (0–100). Run "Usage Meter: Refresh" to return to real data.',
        validateInput: (t) => (isFinite(Number(t)) && t.trim() !== '' && Number(t) >= 0 && Number(t) <= 100 ? undefined : 'Enter a number from 0 to 100'),
      });
      if (v === undefined) return;
      publish({ status: 'ok', percent: Number(v), resetsAt: Date.now() + 2.5 * 3600 * 1000, simulated: true });
    }),
    vscode.window.onDidChangeWindowState((w) => { if (w.focused) refresh(); }),
    vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('usageMeter')) startPolling(); }),
    statusBar,
    { dispose: () => { clearInterval(timer); clearTimeout(resetTimer); } }
  );

  startPolling();
  refresh();
}

function deactivate() {}
module.exports = { activate, deactivate };
