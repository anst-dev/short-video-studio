const PRESET_STORIES = {
  office_ai: `Câu chuyện về một team văn phòng giảm được 50-60% thời gian làm báo cáo và xử lý biên bản họp nhờ áp dụng AI bài bản.

1. Mở đầu bằng một màn hình hỗn loạn với báo cáo, bảng tính, biên bản họp, email và tin nhắn chồng chất.
2. Hiện câu hỏi: "Team mọi người đã áp dụng AI để giảm được một nửa thời gian làm báo cáo với biên bản họp chưa?"
3. Sau đó hiện: "Hay vẫn đang dùng AI chỉ để dịch thuật với viết caption?"
4. Thể hiện quá trình sai lầm: prompt ngắn → kết quả sáo rỗng → sửa tay liên tục → mất thời gian.
5. Biến sự hỗn loạn thành một hệ thống làm việc mạch lạc bằng các bảng tính động, dashboard KPI, checklist, sơ đồ quy trình và luồng dữ liệu đang chuyển động.
6. Xuất hiện quy trình mới PCTPR:
   → ChatGPT lập kế hoạch
   → Claude phân tích tài liệu
   → Gemini hỗ trợ nghiên cứu
   → GPTs/Gems chuyên biệt cho tóm tắt họp, kiểm tra lỗi dữ liệu và lập kế hoạch tuần.
7. Minh họa khối lượng công việc giảm từ 100% xuống còn 40%.
8. Cho thấy biên bản họp được tự động tóm tắt, báo cáo được tạo nhanh hơn, dữ liệu được kiểm tra theo checklist nghiệm thu.
9. Kết thúc bằng một không gian làm việc gọn gàng, nhân viên tập trung vào công việc giá trị cao thay vì xử lý giấy tờ.
10. Dòng chữ cuối: "Thời gian xử lý giấy tờ giảm thực tế 50-60%."
11. Sau đó: "Muốn dùng AI bài bản từ System Prompt đến kiểm chứng chất lượng?"`,

  saas_launch: `Video ra mắt nền tảng tự động hóa quy trình làm việc thế hệ mới.
- Mở đầu (0-8s): Cảnh quá tải thông báo, hàng chục cửa sổ chồng chéo, trễ tiến độ.
- Bước ngoặt (8-20s): Một cú nhấp kích hoạt hệ thống đồng bộ tức thì mọi đầu việc về một giao diện duy nhất.
- Tính năng cốt lõi (20-45s): Tự động phân loại yêu cầu, theo dõi tiến độ theo thời gian thực và kiểm tra chất lượng trước khi xuất bản.
- Kết thúc (45-60s): Tốc độ triển khai tăng gấp 3 lần, kêu gọi trải nghiệm ngay hôm nay.`,

  data_report: `Video giải thích báo cáo tăng trưởng và tối ưu vận hành quý 4.
- Mở đầu bằng con số nghịch lý khiến người xem tò mò.
- Bóc tách dữ liệu theo từng nhóm nguyên nhân cốt lõi bằng đồ họa trực quan.
- Minh họa sự thay đổi trước và sau khi chuẩn hóa quy trình kiểm soát chất lượng.
- Khép lại bằng thông điệp chiến lược cho quý tiếp theo.`,

  custom: ``
};

let allStyles = [];
let workspacePath = '';
let selectedSlugs = ['dark-keynote'];
let activeSource = 'ALL'; // 'ALL' | 'lemo' | 'dashi'
let activeCategory = 'ALL';
let pureCodeOnly = false;
let hoverPreviewEnabled = true;
let lastGeneratedSkillMd = '';
let currentModalStyle = null;
let currentModalMode = 'demo';

function fmtDur(sec) {
  if (!sec) return '';
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

function showToast(msg) {
  const el = document.getElementById('toastMsg');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 2500);
}

async function copyText(txt, label = 'Đã sao chép vào Clipboard!') {
  await navigator.clipboard.writeText(txt);
  showToast(label);
}

async function init() {
  const res = await fetch('/api/catalog');
  const data = await res.json();
  allStyles = data.styles || [];
  workspacePath = data.workspace || '.';

  document.getElementById('storyInput').value = PRESET_STORIES.office_ai;
  buildCategoryPills();
  populateSkillDropdown();
  renderCards();
  renderSelectedPills();
  updatePromptPreview();
  refreshInstalledSkills();
  refreshVideos();
  bindEvents();
}

function sourceFilteredStyles() {
  return allStyles.filter(s => activeSource === 'ALL' || s.source === activeSource);
}

function buildCategoryPills() {
  const wrap = document.getElementById('catPills');
  const baseList = sourceFilteredStyles();
  const counts = {};
  baseList.forEach(s => { counts[s.cat_vi] = (counts[s.cat_vi] || 0) + 1; });
  if (activeCategory !== 'ALL' && !counts[activeCategory]) {
    activeCategory = 'ALL';
  }
  const cats = [['ALL', `Tất cả chủ đề (${baseList.length})`], ...Object.entries(counts).map(([k, n]) => [k, `${k} (${n})`])];
  wrap.innerHTML = '';
  cats.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat-pill' + (activeCategory === key ? ' active' : '');
    b.textContent = label;
    b.onclick = () => {
      activeCategory = key;
      [...wrap.children].forEach(c => c.classList.remove('active'));
      b.classList.add('active');
      renderCards();
    };
    wrap.appendChild(b);
  });
}

function filteredStyles() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  return sourceFilteredStyles().filter(s => {
    if (pureCodeOnly && s.needs_image_gen) return false;
    if (activeCategory !== 'ALL' && s.cat_vi !== activeCategory) return false;
    if (!q) return true;
    const hay = `${s.slug} ${s.source} ${s.en} ${s.cn} ${s.cat_vi} ${s.cat_en} ${s.film || ''} ${s.line} ${(s.uses || []).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
}

function toggleSelect(slug) {
  const idx = selectedSlugs.indexOf(slug);
  if (idx >= 0) {
    if (selectedSlugs.length > 1) selectedSlugs.splice(idx, 1);
  } else {
    selectedSlugs.push(slug);
  }
  renderCards();
  renderSelectedPills();
  updatePromptPreview();
  syncModalSelectButton();
}

function attachHoverVideo(thumbEl, styleObj) {
  let timer = null;
  let vid = null;
  thumbEl.addEventListener('mouseenter', () => {
    if (!hoverPreviewEnabled) return;
    timer = setTimeout(() => {
      if (vid) return;
      vid = document.createElement('video');
      vid.className = 'hover-vid';
      vid.src = styleObj.demo_video;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      vid.oncanplay = () => {
        if (vid) vid.classList.add('ready');
      };
      thumbEl.appendChild(vid);
      vid.play().catch(() => {});
    }, 300);
  });
  thumbEl.addEventListener('mouseleave', () => {
    clearTimeout(timer);
    timer = null;
    if (vid) {
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
      vid.remove();
      vid = null;
    }
  });
}

function renderCards() {
  const grid = document.getElementById('cardsGrid');
  const list = filteredStyles();
  grid.innerHTML = '';
  list.forEach(s => {
    const isSel = selectedSlugs.includes(s.slug);
    const isDashi = s.source === 'dashi';
    const card = document.createElement('article');
    card.className = 'style-card' + (isSel ? ' selected' : '');
    card.onclick = (e) => {
      if (e.target.closest('.btn-play-overlay') || e.target.closest('.btn-demo') || e.target.closest('.btn-detail')) return;
      toggleSelect(s.slug);
    };
    const starBadge = s.needs_image_gen ? ' <span title="Cần công cụ sinh ảnh AI" style="color:#FBBF24">✦</span>' : '';
    const cachedTag = s.demo_cached && !isDashi ? `<span class="card-cached-tag" title="Đã lưu video demo trên máy">✓ Offline</span>` : '';
    const dashiTag = isDashi ? `<span class="card-dashi-tag" title="Kho Dashi AnimationStyle">DASHI</span>` : '';
    const specLabel = isDashi ? '风格卡.md' : 'STYLE.md';
    const usesHtml = (s.uses || []).slice(0, 2).map(u => `<span class="use-tag">${u}</span>`).join('');
    card.innerHTML = `
      <div class="card-thumb">
        <img src="${s.poster}" loading="lazy" alt="${s.en}" />
        <span class="card-num">#${s.num} · ${s.slug}</span>
        ${cachedTag}
        ${dashiTag}
        <div class="card-check" title="Nhấp vào thẻ để chọn/bỏ chọn">✓</div>
        <button type="button" class="btn-play-overlay" title="Mở xem phim Demo đầy đủ âm thanh">
          <span>▶ Xem Demo</span>
          <span class="card-dur">${fmtDur(s.dur)}</span>
        </button>
      </div>
      <div class="card-body">
        <div class="card-cat">${isDashi ? '🔥 DASHI · ' : ''}${s.cat_vi}</div>
        <div class="card-title"><span>${s.en}${starBadge}</span><span class="card-cn">${s.cn}</span></div>
        <div class="card-desc">${s.line}</div>
        <div class="card-foot">
          <div class="uses-wrap">${usesHtml}</div>
          <div class="card-actions">
            <button type="button" class="btn-mini btn-demo" title="Xem video demo mẫu">▶ Demo</button>
            <button type="button" class="btn-mini btn-detail" title="Đọc tài liệu kỹ thuật">${specLabel}</button>
          </div>
        </div>
      </div>
    `;
    const thumb = card.querySelector('.card-thumb');
    attachHoverVideo(thumb, s);

    card.querySelector('.btn-play-overlay').onclick = (e) => {
      e.stopPropagation();
      openStyleModal(s, 'demo');
    };
    card.querySelector('.btn-demo').onclick = (e) => {
      e.stopPropagation();
      openStyleModal(s, 'demo');
    };
    card.querySelector('.btn-detail').onclick = (e) => {
      e.stopPropagation();
      openStyleModal(s, 'spec');
    };
    grid.appendChild(card);
  });
}

function renderSelectedPills() {
  const wrap = document.getElementById('selectedPills');
  document.getElementById('selCountBadge').textContent = `Đã chọn: ${selectedSlugs.length} phong cách`;
  wrap.innerHTML = '';
  selectedSlugs.forEach((slug, i) => {
    const st = allStyles.find(x => x.slug === slug) || { en: slug };
    const pill = document.createElement('span');
    pill.className = 'sel-pill';
    pill.innerHTML = `${i + 1}. ${st.en} <small style="color:var(--mute)">(${slug})</small> <button type="button" title="Bỏ chọn">×</button>`;
    pill.querySelector('button').onclick = () => toggleSelect(slug);
    wrap.appendChild(pill);
  });
}

function buildAgentPrompt() {
  const dur = document.getElementById('durSelect').value;
  const aspect = document.getElementById('aspectSelect').value;
  const size = aspect === '9:16' ? '1080x1920' : '1920x1080';
  const voice = document.getElementById('voiceSelect').value;
  const cli = document.getElementById('cliTarget').value;
  const story = document.getElementById('storyInput').value.trim();

  const hasDashi = selectedSlugs.some(sl => sl.startsWith('dashi-'));
  const hasLemo = selectedSlugs.some(sl => !sl.startsWith('dashi-'));

  const skillBullets = [];
  if (hasLemo) skillBullets.push(`- \`.agents/skills/lemo-video-director/SKILL.md\` (và \`references/strict-qa-rubric.md\`)`);
  if (hasDashi) skillBullets.push(`- \`.agents/skills/dashi-explainer-director/SKILL.md\` (quy tắc chuyển thể Dashi sang tiếng Việt + Windows OFL fonts + \`动效部件.js\`)`);
  skillBullets.push(`- \`.agents/skills/lemo-voice-audio/SKILL.md\``);

  const styleLines = selectedSlugs.map((slug, i) => {
    const s = allStyles.find(x => x.slug === slug) || { en: slug };
    if (s.source === 'dashi') {
      const tpl = s.has_template ? '模板.html' : s.demo_html;
      return `  ${i + 1}. \`${slug}\` — Dashi · ${s.en} (\`${s.cn}\`) → đọc kỹ \`dashi-animationstyle/styles/${s.dashi_dir}/风格卡.md\`, kế thừa đế \`styles/${s.dashi_dir}/${tpl}\` + \`pipeline/动效部件.js\``;
    }
    return `  ${i + 1}. \`${slug}\` — ${s.en} (\`${s.cn}\`) → đọc kỹ \`lemo-opuscar/styles/${slug}/STYLE.md\``;
  }).join('\n');

  const voiceLine = voice === 'omnivoice'
    ? `Sử dụng giọng đọc tiếng Việt \`OmniVoice\` (\`.agents/skills/lemo-voice-audio/SKILL.md\`), viết số/phần trăm thành chữ trong trường \`say\`, kiểm tra lại bằng \`faster-whisper\`, khoảng nghỉ giữa các câu >= 0.32s, tuyệt đối không chồng câu hoặc cắt cụt cuối video.`
    : voice === 'none'
    ? `Không dùng lời thoại (No voiceover); kể chuyện hoàn toàn bằng hình ảnh, chữ trên màn hình, nhạc cụ VCSL và foley theo nhịp 120 BPM.`
    : `Sử dụng giọng đọc \`${voice}\`, kiểm tra ASR bằng \`faster-whisper\` và đảm bảo không đè câu.`;

  const wfNote = cli === 'agy' && selectedSlugs.length > 1
    ? `\n- Có thể chạy điều phối song song bằng workflow \`workflows/produce_multi_style.py\` hoặc \`workflows/run_film_pipeline.py\`.`
    : `\n- Sử dụng pipeline chuẩn \`workflows/run_film_pipeline.py\` để tự động nạp font, render, mix và kiểm định.`;

  return `Hãy đóng vai Đạo diễn & Kỹ sư sản xuất phim tại thư mục \`${workspacePath}\`.
Đọc và tuân thủ nghiêm ngặt các skill:
${skillBullets.join('\n')}${wfNote}

YÊU CẦU SẢN XUẤT (${selectedSlugs.length} phiên bản · ${dur} giây · ${size} @ 24fps):
Phong cách cần làm:
${styleLines}

KỊCH BẢN / CÂU CHUYỆN:
${story}

TIÊU CHÍ CHẤT LƯỢNG BẮT BUỘC (KHÔNG GÂY KHÓ CHỊU CHO NGƯỜI XEM):
1. Viết \`TREATMENT.md\` trước, dùng đúng engine/template và ngôn ngữ thị giác gốc của từng \`STYLE.md\` / \`风格卡.md\` (tuyệt đối không vẽ các hộp slide tĩnh sơ sài hay dùng emoji hệ điều hành).
2. Tự host 100% font OFL tiếng Việt qua \`fetch_vn_fonts.py\` và nạp bằng \`document.fonts.load\` trước \`window.READY = true\` (không dùng \`-apple-system\` hay font macOS \`PingFang SC\`, ngắt dòng tiếng Việt theo từ, không lỗi font Times New Roman, không tràn chữ hay đè nhãn).
3. ${voiceLine}
4. Soạn nhạc gốc bằng nhạc cụ mẫu CC0 VCSL (\`core/audio/sampler.py\`) + foley khớp khung hình (\`core/audio/sfx.py\`) và chuẩn hóa âm lượng \`-14.0 LUFS\` / True Peak \`<= -1.0 dBTP\`.
5. Chạy kiểm định tự động \`.agents/skills/lemo-video-director/scripts/qa_gate.py\` VÀ kiểm tra trực tiếp contact sheet cho từng bản đến khi đạt 100% PASS (exit code 0) rồi xuất ra \`OUTPUT_VIDEOS/\`.`;
}

function updatePromptPreview() {
  document.getElementById('promptPreview').textContent = buildAgentPrompt();
}

function updateSkillDemoVideo(slug) {
  const s = allStyles.find(x => x.slug === slug);
  if (!s) return;
  const v = document.getElementById('skillDemoVideo');
  v.pause();
  v.poster = s.poster;
  v.src = s.demo_video;
  v.innerHTML = s.demo_vtt ? `<track kind="subtitles" srclang="zh" label="Phụ đề gốc" src="${s.demo_vtt}" default />` : '';
  const tag = s.source === 'dashi' ? 'Dashi' : 'Lemo';
  document.getElementById('skillDemoTitle').textContent = `🎬 [${tag}] "${s.film || s.en}" (${fmtDur(s.dur)} · ${s.demo_size_mb || '~3'} MB)`;
  document.getElementById('skillDemo1080').href = s.demo_1080p;
}

function populateSkillDropdown() {
  const sel = document.getElementById('skillStyleSelect');
  sel.innerHTML = '';
  const grpDashi = document.createElement('optgroup');
  grpDashi.label = '🔥 Dashi AnimationStyle (8 phong cách thuyết minh)';
  const grpLemo = document.createElement('optgroup');
  grpLemo.label = '🎬 Lemo-Opuscar (99 phong cách điện ảnh & đồ họa)';

  allStyles.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.slug;
    opt.textContent = `#${s.num} ${s.en} (${s.cn} · ${s.slug}) — ${s.cat_vi}`;
    if (s.source === 'dashi') grpDashi.appendChild(opt);
    else grpLemo.appendChild(opt);
  });
  sel.appendChild(grpDashi);
  sel.appendChild(grpLemo);
  const initSlug = selectedSlugs[0] || 'dark-keynote';
  sel.value = initSlug;
  updateSkillDemoVideo(initSlug);
  syncSkillPreview(false);
}

async function syncSkillPreview(saveToDisk = false) {
  const slug = document.getElementById('skillStyleSelect').value;
  const snameRaw = document.getElementById('skillNameInput').value.trim() || `lemo-style-${slug}`;
  const body = {
    slug,
    skill_name: snameRaw,
    accent: document.getElementById('skillAccentInput').value.trim(),
    aspect: document.getElementById('skillAspectSelect').value,
    voice: document.getElementById('skillVoiceSelect').value,
    lang: 'vi',
    extra_rules: document.getElementById('skillRulesInput').value.trim(),
    save_to_disk: saveToDisk,
  };
  const res = await fetch('/api/create-skill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.ok) {
    lastGeneratedSkillMd = data.markdown;
    document.getElementById('skillMdPreview').textContent = data.markdown;
    document.getElementById('skillCliSnippet').textContent =
      `Hãy kích hoạt skill \`.agents/skills/${data.skill_name}/SKILL.md\` và tạo cho tôi một video 60 giây theo đúng phong cách \`${slug}\` cho kịch bản sau:\n\n[Dán nội dung kịch bản của bạn vào đây]`;
    if (saveToDisk) {
      showToast(`Đã lưu Skill '${data.skill_name}' vào .agents/skills/!`);
      refreshInstalledSkills();
    }
  }
}

async function refreshInstalledSkills() {
  const res = await fetch('/api/skills');
  const data = await res.json();
  const wrap = document.getElementById('installedSkillsList');
  wrap.innerHTML = '';
  (data.skills || []).forEach(sk => {
    const sp = document.createElement('span');
    sp.className = 'sel-pill';
    sp.textContent = `✓ ${sk.name}`;
    wrap.appendChild(sp);
  });
}

async function refreshVideos() {
  const res = await fetch('/api/outputs');
  const data = await res.json();
  const grid = document.getElementById('videosGrid');
  grid.innerHTML = '';
  const vids = data.videos || [];
  if (!vids.length) {
    grid.innerHTML = `<p style="color:var(--dim)">Chưa có video nào trong thư mục OUTPUT_VIDEOS.</p>`;
    return;
  }
  vids.forEach(v => {
    const div = document.createElement('div');
    div.className = 'video-card';
    const posterAttr = v.poster_url ? `poster="${v.poster_url}"` : '';
    const trackAttr = v.srt_url ? `<track kind="subtitles" src="${v.srt_url}" srclang="vi" label="Tiếng Việt" default>` : '';
    const folderLine = v.folder ? `<span style="color:var(--dim);font-size:12px">📁 ${v.folder}/</span>` : '';
    div.innerHTML = `
      <video controls preload="metadata" ${posterAttr} src="${v.url}">${trackAttr}</video>
      <div class="video-meta">
        <strong>${v.name}</strong>
        ${folderLine}
        <span style="font-family:'JBMono',monospace;color:var(--accent)">${v.size_mb} MB · -14 LUFS</span>
      </div>
    `;
    grid.appendChild(div);
  });
}

function syncModalSelectButton() {
  if (!currentModalStyle) return;
  const btn = document.getElementById('btnModalSelect');
  const isSel = selectedSlugs.includes(currentModalStyle.slug);
  btn.classList.toggle('is-selected', isSel);
  btn.textContent = isSel ? '✓ Đã chọn vào Prompt' : '+ Chọn phong cách này';
}

function switchModalTab(mode) {
  currentModalMode = mode;
  document.getElementById('mTabDemo').classList.toggle('active', mode === 'demo');
  document.getElementById('mTabSpec').classList.toggle('active', mode === 'spec');
  document.getElementById('modalDemoPane').style.display = mode === 'demo' ? 'flex' : 'none';
  document.getElementById('modalSpecPane').style.display = mode === 'spec' ? 'block' : 'none';

  const vid = document.getElementById('demoModalVideo');
  if (mode === 'spec') {
    vid.pause();
  } else if (document.getElementById('styleModal').classList.contains('open')) {
    vid.play().catch(() => {});
  }
}

async function openStyleModal(s, mode = 'demo') {
  currentModalStyle = s;
  const isDashi = s.source === 'dashi';
  const modal = document.getElementById('styleModal');
  document.getElementById('modalTitle').textContent = `#${s.num} ${s.en} (${s.cn})`;
  const srcPath = isDashi ? `dashi-animationstyle/styles/${s.dashi_dir}/` : `lemo-opuscar/styles/${s.slug}/`;
  document.getElementById('modalSub').textContent = `${s.cat_vi} · ${srcPath} · ${fmtDur(s.dur)} · ${s.demo_size_mb || '~3'} MB`;
  document.getElementById('demoFilmHeading').textContent = `Phim mẫu: "${s.film || s.en}" ${s.film_cn ? `(${s.film_cn})` : ''}`;
  document.getElementById('demoFilmLine').textContent = s.line || '';
  document.getElementById('linkDemo1080').href = s.demo_1080p;

  const cacheBtn = document.getElementById('btnCacheDemo');
  cacheBtn.disabled = false;
  cacheBtn.textContent = (s.demo_cached || isDashi) ? '✓ Có sẵn Offline trên máy' : `⬇️ Lưu Offline (${s.demo_size_mb || '~8'} MB)`;

  syncModalSelectButton();

  const vid = document.getElementById('demoModalVideo');
  vid.pause();
  vid.poster = s.poster;
  vid.src = s.demo_video;
  vid.innerHTML = s.demo_vtt ? `<track kind="subtitles" srclang="zh" label="Phụ đề gốc" src="${s.demo_vtt}" default />` : '';
  vid.load();

  modal.classList.add('open');
  switchModalTab(mode);

  document.getElementById('modalSpecPane').textContent = 'Đang tải đặc tả phong cách...';
  const res = await fetch(`/api/style/${s.slug}`);
  const data = await res.json();
  if (currentModalStyle && currentModalStyle.slug === s.slug) {
    const demoExtra = data.demo_markdown ? `\n\n========================================\nDEMO.md (Ghi chú bản phim mẫu)\n========================================\n\n${data.demo_markdown}` : '';
    document.getElementById('modalSpecPane').textContent = (data.markdown || data.error || '') + demoExtra;
  }
}

function closeStyleModal() {
  const modal = document.getElementById('styleModal');
  modal.classList.remove('open');
  const vid = document.getElementById('demoModalVideo');
  vid.pause();
  vid.removeAttribute('src');
  vid.innerHTML = '';
  vid.load();
}

function stepModalStyle(delta) {
  if (!currentModalStyle) return;
  const list = filteredStyles();
  if (!list.length) return;
  const idx = list.findIndex(x => x.slug === currentModalStyle.slug);
  const nextIdx = idx < 0 ? 0 : (idx + delta + list.length) % list.length;
  openStyleModal(list[nextIdx], currentModalMode);
}

async function cacheCurrentDemo() {
  if (!currentModalStyle) return;
  const s = currentModalStyle;
  if (s.demo_cached || s.source === 'dashi') {
    showToast(`Video demo '${s.slug}.mp4' đã có sẵn Offline trên máy!`);
    return;
  }
  const btn = document.getElementById('btnCacheDemo');
  btn.disabled = true;
  btn.textContent = '⏳ Đang tải về máy...';
  try {
    const res = await fetch('/api/cache-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: s.slug }),
    });
    const data = await res.json();
    if (data.ok) {
      s.demo_cached = true;
      s.demo_video = data.local_url;
      btn.textContent = `✓ Đã lưu Offline (${data.size_mb} MB)`;
      renderCards();
      showToast(`✓ Đã lưu '${s.slug}.mp4' vào bộ nhớ đệm cục bộ!`);
    } else {
      btn.disabled = false;
      btn.textContent = '⬇️ Thử lưu lại';
      showToast('Lỗi tải video: ' + (data.error || 'Không xác định'));
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '⬇️ Thử lưu lại';
    showToast('Lỗi kết nối khi tải video demo.');
  }
}

function jumpToSkillForSlug(slug) {
  closeStyleModal();
  document.getElementById('skillStyleSelect').value = slug;
  document.getElementById('skillNameInput').value = `lemo-style-${slug}`;
  updateSkillDemoVideo(slug);
  syncSkillPreview(false);
  document.querySelector('[data-tab="tab-skill"]').click();
}

function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      const skVid = document.getElementById('skillDemoVideo');
      if (skVid) skVid.pause();

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'tab-videos') refreshVideos();
    };
  });

  // Source filter buttons (ALL / lemo / dashi)
  document.querySelectorAll('.src-pill').forEach(btn => {
    btn.onclick = () => {
      activeSource = btn.dataset.src;
      document.querySelectorAll('.src-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildCategoryPills();
      renderCards();
    };
  });

  document.getElementById('searchInput').oninput = renderCards;
  document.getElementById('btnPreset5').onclick = () => {
    selectedSlugs = ['dark-keynote', 'spreadsheet', 'iso-infographic', 'swiss-motion', 'blueprint'];
    renderCards(); renderSelectedPills(); updatePromptPreview();
    showToast('Đã chọn bộ 5 phong cách đỉnh cao cho Công sở & AI!');
  };
  document.getElementById('btnPureCode').onclick = (e) => {
    pureCodeOnly = !pureCodeOnly;
    e.currentTarget.style.borderColor = pureCodeOnly ? 'var(--accent)' : '';
    e.currentTarget.style.color = pureCodeOnly ? 'var(--accent)' : '';
    renderCards();
  };
  document.getElementById('btnHoverToggle').onclick = (e) => {
    hoverPreviewEnabled = !hoverPreviewEnabled;
    e.currentTarget.textContent = hoverPreviewEnabled ? '🎬 Rê chuột xem trước: BẬT' : '🎬 Rê chuột xem trước: TẮT';
    e.currentTarget.classList.toggle('secondary', !hoverPreviewEnabled);
  };
  document.getElementById('btnClearSel').onclick = () => {
    selectedSlugs = [selectedSlugs[0] || 'dark-keynote'];
    renderCards(); renderSelectedPills(); updatePromptPreview();
  };

  document.getElementById('presetStory').onchange = (e) => {
    if (e.target.value !== 'custom') {
      document.getElementById('storyInput').value = PRESET_STORIES[e.target.value] || '';
    }
    updatePromptPreview();
  };
  ['storyInput', 'durSelect', 'aspectSelect', 'voiceSelect', 'cliTarget'].forEach(id => {
    document.getElementById(id).oninput = updatePromptPreview;
    document.getElementById(id).onchange = updatePromptPreview;
  });

  document.getElementById('btnCopyPrompt').onclick = () => copyText(buildAgentPrompt(), '✓ Đã sao chép Prompt chuẩn cho Agent CLI!');
  document.getElementById('btnJumpSkill').onclick = () => jumpToSkillForSlug(selectedSlugs[0] || 'dark-keynote');

  // Skill Builder events
  document.getElementById('skillStyleSelect').onchange = (e) => {
    document.getElementById('skillNameInput').value = `lemo-style-${e.target.value}`;
    updateSkillDemoVideo(e.target.value);
    syncSkillPreview(false);
  };
  ['skillNameInput', 'skillAccentInput', 'skillAspectSelect', 'skillVoiceSelect', 'skillRulesInput'].forEach(id => {
    document.getElementById(id).onchange = () => syncSkillPreview(false);
  });
  document.getElementById('btnSaveSkillDisk').onclick = () => syncSkillPreview(true);
  document.getElementById('btnDownloadSkill').onclick = async () => {
    await syncSkillPreview(false);
    const slug = document.getElementById('skillStyleSelect').value;
    const blob = new Blob([lastGeneratedSkillMd], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SKILL-${slug}.md`;
    a.click();
  };
  document.getElementById('btnCopySkillCmd').onclick = () =>
    copyText(document.getElementById('skillCliSnippet').textContent, '✓ Đã sao chép câu lệnh gọi Skill!');

  document.getElementById('btnRefreshVideos').onclick = refreshVideos;

  // Modal events
  document.getElementById('mTabDemo').onclick = () => switchModalTab('demo');
  document.getElementById('mTabSpec').onclick = () => switchModalTab('spec');
  document.getElementById('btnPrevStyle').onclick = () => stepModalStyle(-1);
  document.getElementById('btnNextStyle').onclick = () => stepModalStyle(1);
  document.getElementById('btnModalSelect').onclick = () => {
    if (currentModalStyle) toggleSelect(currentModalStyle.slug);
  };
  document.getElementById('btnCacheDemo').onclick = cacheCurrentDemo;
  document.getElementById('btnModalJumpSkill').onclick = () => {
    if (currentModalStyle) jumpToSkillForSlug(currentModalStyle.slug);
  };
  document.getElementById('btnCloseModal').onclick = closeStyleModal;
  document.getElementById('styleModal').onclick = (e) => {
    if (e.target.id === 'styleModal') closeStyleModal();
  };
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('styleModal').classList.contains('open')) return;
    if (e.key === 'Escape') closeStyleModal();
    if (e.key === 'ArrowLeft') stepModalStyle(-1);
    if (e.key === 'ArrowRight') stepModalStyle(1);
  });
}

init();
