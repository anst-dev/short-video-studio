// Entry — load every self-hosted Vietnamese OFL face (with VN sample glyphs) BEFORE window.READY.
import { BOIL } from './film.js';
const Q = new URLSearchParams(location.search);

const VN_SAMPLE = 'Team mọi người đã áp dụng AI để giảm một nửa thời gian làm báo cáo với biên bản họp chưa? Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption? Quy trình PCTPR kiểm chứng chất lượng 50–60% 100% 40%';
const fontsToLoad = [
  '400 40px Inter', '500 40px Inter', '600 40px Inter', '700 40px Inter', '800 40px Inter',
  '500 40px InterTight', '600 40px InterTight', '700 40px InterTight',
  '400 40px JBMono', '500 40px JBMono', '600 40px JBMono', '700 40px JBMono',
  '400 40px BeVietnam', '500 40px BeVietnam', '700 40px BeVietnam', '800 40px BeVietnam',
];
await Promise.all(fontsToLoad.map(f => document.fonts.load(f, VN_SAMPLE)));
await document.fonts.ready;

const M = await import('./film.js');
window.DUR = M.DUR;
window.EV = M.EV;
window.render = t => { BOIL.step = t; M.frame(t); };
if (M.TEXTS) window.TEXTS = M.TEXTS;
window.READY = true;
