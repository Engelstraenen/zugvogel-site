// SJinn-Stapelskript mit Referenzbild JE AUFTRAG (gratis, Unlimited). Stand 20.11.2026, Projekt DRSCHIWAGO.
// Einspielen per javascript_tool in den eingeloggten Tab https://sjinn.ai/tool-mode/nano-banana-2.1
// 1) SB.setup('16:9','4K')  -> Unlimited an, Format, Auflösung (nach jedem Reload neu!)
// 2) Referenzen hochladen: Dialog öffnen (SB.click('Add reference images')), Datei per Chrome-file_upload
//    in das versteckte input[type=file] (Datei muss im Sitzungsordner liegen, sonst verweigert),
//    danach REF.name = document.querySelector('[role=dialog] img').src  (neueste Datei steht vorn)
// 3) SB.jobs = [{id:'X-01', ar:'16:9', ref:REF.name|null, prompt:'X-01 ...'}]; SB.run() (ohne await)
// 4) SB.harvest() -> {id: url} über alt-Text (= Prompt beginnt mit der ID)
// Lektionen: 4K gratis nimmt 2 Aufträge gleichzeitig an; „no-start“-Erkennung über den Generating-Zähler
// ist unzuverlässig (Auftrag läuft oft doch -> Doppel, kostet nichts). „Generation failed“ = einfach neu schicken.
window.sleep = ms => new Promise(r => setTimeout(r, ms));
window.REF = window.REF || {};
window.SB = { log: [], jobs: [], state: { i: 0, stop: false, msg: 'init' }, MAXC: 2 };
SB.btn = t => [...document.querySelectorAll('button,[role=button]')].find(b => ((b.getAttribute('aria-label') || '') + '|' + (b.title || '') + '|' + b.innerText).toLowerCase().includes(t.toLowerCase()));
SB.click = async (t, w = 700) => { const b = SB.btn(t); if (!b) { SB.log.push('MISSING ' + t); return false } b.click(); await sleep(w); return true };
SB.bar = () => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(t => /GPT|Nano|1:1|16:9|9:16|3:4|4:3|auto|1K|2K|4K|Unlimited|credits/.test(t)).join(' | ');
SB.gen = () => (document.body.innerText.match(/Generating/g) || []).length;
SB.setAR = async ar => { await SB.click('Aspect ratio'); await SB.click(ar); };
SB.setup = async (ar = '16:9', res = '4K') => {
  if (!/Unlimited · On/.test(SB.bar())) { await SB.click('Unlimited'); const o = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'No credits consumed'); if (o) { o.click(); await sleep(700); } }
  await SB.setAR(ar); await SB.click('Resolution'); await SB.click(res + ' resolution'); return SB.bar();
};
SB.clearRefs = async () => { for (let k = 0; k < 6; k++) { const b = [...document.querySelectorAll('button')].find(b => /^Remove Image/.test(b.getAttribute('aria-label') || '')); if (!b) break; b.click(); await sleep(500); } };
SB.setRef = async (src) => {
  if (!document.querySelector('[role=dialog]')) await SB.click('Add reference images', 1500);
  const dlg = document.querySelector('[role=dialog]'); if (!dlg) return 'NODLG';
  const clr = [...dlg.querySelectorAll('button')].find(b => /Clear selection/i.test(b.innerText)); if (clr) { clr.click(); await sleep(600); }
  if (src) { const img = [...dlg.querySelectorAll('img')].find(i => i.src === src); if (!img) return 'NOIMG'; let card = img; for (let k = 0; k < 7; k++) { card = card.parentElement; const sb = card && card.querySelector('button[aria-label^="Select image"]'); if (sb) { sb.click(); break; } } await sleep(600); }
  const use = [...dlg.querySelectorAll('button')].find(b => /^Use \d+ image|Apply selection/i.test(b.innerText.trim()));
  if (use && !use.disabled) { const t = use.innerText.trim(); use.click(); await sleep(900); return 'applied ' + t; }
  const c = [...dlg.querySelectorAll('button')].find(b => b.innerText.trim() === 'Cancel'); c && c.click(); await sleep(600); return 'cancel';
};
SB.run = async () => {
  const ta = () => document.querySelector('textarea');
  while (SB.state.i < SB.jobs.length && !SB.state.stop) {
    let w = 0; while (SB.gen() >= SB.MAXC && w < 3600) { await sleep(3000); w++ }
    const j = SB.jobs[SB.state.i];
    if (!j.prepared) { await SB.clearRefs(); if (j.ref) SB.log.push(j.id + ' ref ' + await SB.setRef(j.ref)); await SB.setAR(j.ar); await sleep(600); j.prepared = true; }
    const bar = SB.bar();
    if (!/Unlimited · On/.test(bar) || !/0 credits/.test(bar) || !bar.includes(j.ar)) { SB.state.msg = 'STOP ' + j.id + ': ' + bar; return }
    const g0 = SB.gen();
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta(), j.prompt);
    ta().dispatchEvent(new Event('input', { bubbles: true })); await sleep(900);
    const gb = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Generate'); if (gb) gb.click(); await sleep(6000);
    j.tries = (j.tries || 0) + 1;
    if (SB.gen() > g0) { SB.state.i++; SB.state.msg = 'submitted ' + j.id; SB.log.push(j.id + ' submitted ' + new Date().toLocaleTimeString()); }
    else { SB.log.push(j.id + ' no-start try ' + j.tries); await sleep(90000); }
  }
  if (SB.state.i >= SB.jobs.length) SB.state.msg = 'all submitted';
};
SB.harvest = () => { const out = {}; for (const j of SB.jobs) { const im = [...document.querySelectorAll('img')].find(i => i.alt && i.alt.trim().startsWith(j.id + ' ')); if (im && im.src.includes('/result/')) out[j.id] = im.src.split('?')[0]; } return out };
'SB ready';

// ---- V2 (20.11.2026): Schleife mit Lauf-Kennung. NIE zwei Schleifen gleichzeitig! ----
// Alte Schleife hart beenden: const g0 = SB.gen; SB.gen = () => { throw 0 }; await sleep(7000); SB.gen = g0;
// Dann: SB.queue = [jobs...]; SB.run2();  Status: SB.q
SB.run2 = async () => {
  const my = SB.runId = Date.now(); const ta = () => document.querySelector('textarea'); SB.q = { i: 0, msg: 'start' };
  while (SB.q.i < SB.queue.length && SB.runId === my) {
    let w = 0; while (SB.gen() >= SB.MAXC && w < 3600 && SB.runId === my) { await sleep(3000); w++; }
    if (SB.runId !== my) return;
    const j = SB.queue[SB.q.i];
    if (!j.prepared) { await SB.clearRefs(); if (j.ref) { const r = await SB.setRef(j.ref); SB.log.push(j.id + ' ref ' + r); if (!/applied/.test(r)) { SB.q.msg = 'STOP ref ' + j.id; return; } } await SB.setAR(j.ar); await sleep(600); j.prepared = true; }
    const bar = SB.bar();
    if (!/Unlimited · On/.test(bar) || !/0 credits/.test(bar) || !bar.includes(j.ar)) { SB.q.msg = 'STOP ' + j.id + ': ' + bar; return; }
    const g0 = SB.gen();
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta(), j.prompt);
    ta().dispatchEvent(new Event('input', { bubbles: true })); await sleep(900);
    const gb = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Generate'); if (gb) gb.click(); await sleep(6000);
    j.tries = (j.tries || 0) + 1;
    if (SB.gen() > g0 || j.tries >= 2) { SB.q.i++; SB.q.msg = 'submitted ' + j.id; SB.log.push(j.id + ' submitted ' + new Date().toLocaleTimeString()); }
    else { SB.log.push(j.id + ' no-start ' + j.tries); await sleep(60000); }
  }
  if (SB.runId === my) SB.q.msg = 'all submitted';
};
// Lektion 22.11.2026: Beim Austausch der Warteschlange kann die alte Schleife noch SB.q.i++ auf das NEUE q-Objekt machen
// (erster neuer Job wird übersprungen). Nach SB.runId = 0 mind. 7 s warten, dann SB.q neu setzen, oder SB.q.i prüfen/zurücksetzen.
// Lektion 22.11.2026: Bei vielen Uploads steht eine alte Referenz nicht mehr auf der ersten Dialog-Seite → setRef meldet NOIMG.
// Lösung: vor dem Auswählen „Load more“ klicken, bis das Bild im Dialog steht:
// SB.setRefOrig = SB.setRef; SB.setRef = async src => { ...Load more bis img.src === src... ; return SB.setRefOrig(src); };
// Lektion 23.11.2026: SB.run3 setzt SB.q NICHT zurück. Vor jeder neuen Warteschlange: SB.runId = 0; 7 s warten; SB.q = {i: 0, msg: 'start'}; SB.queue = [...]; SB.jobs = alle Jobs (für harvest); dann SB.run3().
