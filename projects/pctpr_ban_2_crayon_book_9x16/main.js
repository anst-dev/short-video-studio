// Entry — load every self-hosted Vietnamese OFL face (with VN sample glyphs) BEFORE window.READY.
import { BOIL } from './crayon.js';
const Q = new URLSearchParams(location.search);

const VN_SAMPLE = 'Team mọi người đã áp dụng AI để giảm một nửa thời gian làm báo cáo với biên bản họp chưa? Muốn dùng AI bài bản từ System Prompt đến kiểm chứng chất lượng? Quy trình PCTPR 50–60% 100% 40%';
const fontsToLoad = ['400 40px "Patrick Hand"', '400 40px "Be Vietnam Pro"', '500 40px "Be Vietnam Pro"', '700 40px "Be Vietnam Pro"'];
await Promise.all(fontsToLoad.map(f => document.fonts.load(f, VN_SAMPLE)));
await document.fonts.ready;

const M = await import('./film.js');
window.DUR = M.DUR;
window.EV = M.EV;
window.render = t => { BOIL.step = Math.floor(t * 12 + 1e-6); M.frame(t); };
if (M.TEXTS) window.TEXTS = M.TEXTS;
window.READY = true;
