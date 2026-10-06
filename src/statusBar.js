const vscode = require('vscode');
const { formatReset } = require('./format');

class UsageStatusBar {
  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'usageMeter.focus';
  }

  update(s) {
    const it = this.item;
    it.backgroundColor = undefined;
    it.color = undefined;
    if (s.status === 'loading') {
      it.text = '$(sync~spin) Claude';
      it.tooltip = 'Reading Claude Code usage…';
    } else if (s.status === 'unavailable') {
      it.text = '$(circle-slash) Claude –';
      it.tooltip = s.reason;
    } else {
      const p = Math.round(s.percent);
      const reset = s.resetsAt ? formatReset(s.resetsAt) : undefined;
      if (p >= 100) {
        it.text = `$(circle-filled) Claude 100%${reset ? ` · resets ${reset}` : ''}`;
        it.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      } else if (p >= 80) {
        it.text = `Claude ${p}%`;
        it.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      } else if (p >= 50) {
        it.text = `Claude ${p}%`;
        it.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      } else {
        it.text = `Claude ${p}%`;
        it.color = new vscode.ThemeColor('testing.iconPassed');
      }
      it.tooltip = `Claude Code 5-hour usage: ${p}%${reset ? `\nResets ${reset}` : ''}${s.stale ? '\n(last refresh failed)' : ''}${s.simulated ? '\n(simulated)' : ''}`;
    }
    it.show();
  }

  dispose() { this.item.dispose(); }
}

module.exports = { UsageStatusBar };
