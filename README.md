# Claude Usage Meter

Shows your Claude Code **5-hour** usage as a rounded box with the percentage inside, in the Claude Code sidebar and the status bar.
<img width="641" height="488" alt="Screenshot 2026-10-06 at 10 49 34" src="https://github.com/user-attachments/assets/b411916e-9246-4330-9f0e-41006fdd6a92" />
<img width="641" height="167" alt="Screenshot 2026-10-06 at 10 49 23" src="https://github.com/user-attachments/assets/fbad0a85-9964-4edb-821c-973be710d229" />

- Below 50%: green. 50–79%: yellow. 80–99%: red. 100%: black, with the reset time.
- Dotted lines mark 50% and 80%.
- Click the box to refresh. Refreshes every 5 minutes (`usageMeter.refreshMinutes`), on window focus, and when the limit resets.

The meter sits in the Claude Code sidebar as a "Usage" view; drag it under the chat once and VS Code remembers the spot.

Usage is read from the `claude` binary bundled with the Claude Code extension via its experimental `get_usage` request, so no prompt is sent and no credentials are handled here. Anthropic may change that request in a future update; it is isolated in `src/usageClient.js`.

## Run

Open this folder in VS Code and press F5. To install permanently, symlink the folder to `~/.vscode/extensions/local.claude-usage-meter-0.0.1` and reload the window.

Commands: `Usage Meter: Refresh`, `Usage Meter: Simulate Percentage` (to preview the colour states).
