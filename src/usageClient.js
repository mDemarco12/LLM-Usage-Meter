const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TIMEOUT_MS = 30000;

function binaryPath(claudeExtPath) {
  const p = path.join(claudeExtPath, 'resources', 'native-binary', 'claude');
  return fs.existsSync(p) ? p : undefined;
}

// Asks the Claude Code binary bundled with the Claude extension for rate limits,
// using the same control request the chat panel uses. No prompt is sent.
function fetchUsage(claudeExtPath) {
  return new Promise((resolve, reject) => {
    const bin = binaryPath(claudeExtPath);
    if (!bin) return reject(new Error('Claude Code binary not found'));

    const child = cp.spawn(
      bin,
      ['-p', '--output-format', 'stream-json', '--verbose', '--input-format', 'stream-json'],
      { cwd: os.homedir(), stdio: ['pipe', 'pipe', 'ignore'] }
    );

    let done = false;
    let buf = '';
    const finish = (err, val) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { child.stdin.end(); } catch {}
      child.kill();
      err ? reject(err) : resolve(val);
    };
    const timer = setTimeout(() => finish(new Error('Timed out reading usage')), TIMEOUT_MS);

    child.on('error', (e) => finish(e));
    child.on('exit', () => finish(new Error('Claude process exited early')));
    child.stdout.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.type !== 'control_response' || msg.response?.request_id !== 'usage1') continue;
        if (msg.response.subtype !== 'success') {
          return finish(new Error(String(msg.response.error || 'get_usage failed')));
        }
        return finish(null, parse(msg.response.response));
      }
    });

    const send = (o) => child.stdin.write(JSON.stringify(o) + '\n');
    send({ type: 'control_request', request_id: 'init1', request: { subtype: 'initialize' } });
    send({ type: 'control_request', request_id: 'usage1', request: { subtype: 'get_usage', skip_behaviors: true } });
  });
}

function parse(r) {
  const w = r?.rate_limits?.five_hour;
  if (!r?.rate_limits_available || !w || typeof w.utilization !== 'number') {
    return { available: false, reason: 'No 5-hour limit for this account (sign in with a Claude subscription)' };
  }
  const t = w.resets_at ? Date.parse(w.resets_at) : NaN;
  return {
    available: true,
    percent: w.utilization,
    resetsAt: Number.isFinite(t) ? t : undefined,
  };
}

module.exports = { fetchUsage };
