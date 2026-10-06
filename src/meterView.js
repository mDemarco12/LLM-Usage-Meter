const vscode = require('vscode');

class MeterViewProvider {
  constructor(extensionUri, onRefresh) {
    this.extensionUri = extensionUri;
    this.onRefresh = onRefresh;
    this.views = new Set();
    this.state = { status: 'loading' };
  }

  resolveWebviewView(view) {
    const media = vscode.Uri.joinPath(this.extensionUri, 'media');
    view.webview.options = { enableScripts: true, localResourceRoots: [media] };
    const nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const css = view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'meter.css'));
    const js = view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'meter.js'));
    view.webview.html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${view.webview.cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${css}"></head><body>
<div id="root" role="button" tabindex="0" title="Click to refresh">
  <div class="box"><div class="fill"></div><div class="line l50"></div><div class="line l80"></div><div class="num">–</div></div>
  <div class="side"><div class="label">5-hour usage</div><div class="detail"></div></div>
</div>
<script nonce="${nonce}" src="${js}"></script></body></html>`;

    this.views.add(view);
    view.onDidDispose(() => this.views.delete(view));
    view.webview.onDidReceiveMessage((m) => { if (m.type === 'refresh') this.onRefresh(); });
    view.onDidChangeVisibility(() => { if (view.visible) this.push(view); });
    this.push(view);
  }

  update(state) {
    this.state = state;
    this.views.forEach((v) => this.push(v));
  }

  push(view) {
    view.webview.postMessage({ type: 'state', state: this.state });
  }
}

module.exports = { MeterViewProvider };
