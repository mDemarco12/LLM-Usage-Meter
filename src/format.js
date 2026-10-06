function formatReset(ms) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
}
module.exports = { formatReset };
