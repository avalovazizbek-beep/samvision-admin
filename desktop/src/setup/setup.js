const $ = (id) => document.getElementById(id);
const msg = $('msg');

function show(text, ok) {
  msg.textContent = text;
  msg.className = `msg ${ok ? 'ok' : 'err'}`;
}

window.setupApi.load().then((s) => {
  $('serverUrl').value = s.serverUrl ?? '';
  $('publicUrl').value = s.publicUrl ?? '';
});

$('cancel').addEventListener('click', () => window.setupApi.cancel());

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = $('save');
  button.disabled = true;
  button.textContent = 'Tekshirilmoqda…';
  try {
    const r = await window.setupApi.test($('serverUrl').value);
    if (!r.ok) {
      show(r.message, false);
      return;
    }
    show(`Ulanish muvaffaqiyatli: ${r.serverUrl}`, true);
    await window.setupApi.save({ serverUrl: r.serverUrl, publicUrl: $('publicUrl').value });
  } catch (err) {
    show(String(err?.message ?? err), false);
  } finally {
    button.disabled = false;
    button.textContent = 'Tekshirish va saqlash';
  }
});
