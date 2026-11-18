# TREATMENT — Bản 3: Mô Hình Văn Phòng Tinh Gọn (Isometric Infographic)

Style: `iso-infographic` (`styles/iso-infographic/STYLE.md`)
Duration: 60.0 s · 1920×1080 · 24 fps · 120 BPM (30 bars)
Language: Tiếng Việt (voiceover OmniVoice + map-label subtitle card + `.srt`)
Palette: Warm cream ground `#F3EFE6`, ink `#231A2C`, paper-chaos coral `#E05A47`, AI-route electric blue `#2B6CB0`, ChatGPT mint `#2F9E77`, Claudeochre `#D9822B`, Gemini sky `#3B82F6`, Gems plum `#7C4DFF`, KPI mustard `#E6AE2E` (all shaded strictly in 3 flat isometric face tones: top +20% warm white, left base, right −22% cool `#231A2C`, zero outlines on solids)

## 1. Three candidate structures & choice

1. **Tower Floors Cutaway**: Tilt top-to-bottom down a 5-storey office building. *Hides the horizontal flow of documents between AI models.*
2. **Cycle Loop**: Follow one meeting transcript around a closed loop three times. *Repetitive across 60 s.*
3. **Two-State Isometric Plinth + Cutaway AI Pipeline + Isotype 100→40 Matrix (CHOSEN)**: A floating isometric office plinth with visible cross-section strata begins buried under towering 3-tone stacks of reports, spreadsheets, meeting binders and red notification cubes around overwhelmed miniature workers; leader pins pop Question 1 & Question 2. Camera tracks along a jagged red conveyor of the 4-step broken prompt loop (`Prompt ngắn` → `Sáo rỗng` → `Sửa tay` → `Mất thời gian`). After a dead-silent beat at 16.0 s, dashed **Cutaway** lines slice open the new system board: dynamic table slabs, rising KPI bar plinths, checklist gates, and moving blue data cubes traveling along crisp ink route lines through 4 cutaway AI chambers (**PCTPR**: `ChatGPT` → `Claude` → `Gemini` → `GPTs/Gems`). Camera pulls out to an **Isotype 10×10 icon matrix** where 60 coral paper blocks lift away leaving 40 clean blocks (`100% → 40%`), circular **Inset** frames verify meeting summary / fast report / QA checklist, and the final **Scale Reveal** frames a serene tidy office diorama with the legend card stating `50–60%` and the System Prompt → QA call to action.

## 2. Logline & Arc

- **Logline**: Trên một sa bàn isometric ba sắc độ sống động, cả một văn phòng ngập trong núi hồ sơ được giải cứu khi dây chuyền cắt lớp PCTPR tự động hóa từ khâu lập kế hoạch đến nghiệm thu, rút 100 khối việc xuống 40 và trả lại bàn làm việc thoáng đãng cho con người.
- **Arc**: Overloaded office plinth & broken conveyor (0–16.0 s) → Silence + Cutaway PCTPR AI pipeline & moving data cubes (16.0–38.5 s) → Isotype 100→40 block drop, 3 station proofs, calm office scale reveal & legend verdict (38.5–60.0 s).

## 3. Benchmark

- **Reference works**: (1) *Monument Valley* / *SimCity 2000* cutaway plinths (true 30° isometric projection, crisp 3-tone faces without outlines on solids, strata edge); (2) Otto Neurath *Isotype* & Kurzgesagt system explainers (quantities built out of countable identical 3D icons, leader pins that draw before labels appear).
- **What to learn**: Every motion led by a drawn ink route/leader line; focus + context desaturation when highlighting one station; solids arrive by motion/bounce, never semi-transparent ghosting.
- **What not to take**: No Kurzgesagt birds, Monument Valley architecture, or brand logos.

## 4. Shot List (7 isometric log-zoom & pan moves)

| Shot | Time | Iso Camera (`wx, wy, wz, k`) | Why |
|---|---|---|---|
| S1 | 0.0–4.8 s | Locked medium-close (`k 38 → 28`) on overwhelmed office desks as coral paper stacks & mail blocks rain onto desks; leader pin draws up to Question 1 banner | Immediate tactile physicalization of office paperwork overload |
| S2 | 4.8–8.5 s | Lateral pan + push (`k 34`) with **Focus + Context** (background desaturates to warm grey) onto a lone worker typing at a tiny terminal; pin reveals Question 2 | Isolates the "only translation & captions" habit |
| S3 | 8.5–16.0 s | Follow along a crooked red dashed route (`k 30`) past 4 jammed stations (`Prompt ngắn` → `Kết quả sáo rỗng` → `Sửa tay liên tục` → `Mất thời gian`) where workers re-stack fallen blocks | Physicalizes wasted manual effort |
| S4 | 16.0–25.0 s | Silence at 15.8 s; fast log pull-out (`k 22`) on 16.5 s downbeat as blue route lines shoot across the plinth, raising 4 clean stations: Dynamic Table, KPI Plinth, Checklist Gate, Moving Data Stream | Clean architectural transformation |
| S5 | 25.0–38.5 s | Follow along the main **PCTPR** trunk (`k 29`) as **Cutaway** skins slide off 4 specialized chambers (`ChatGPT`, `Claude`, `Gemini`, `GPTs/Gems`) with hatched rims and glowing data cubes hopping station-to-station | Signature `iso-infographic` *Cutaway* + *Tracked subject* moves |
| S6 | 38.5–48.5 s | Wide + **Circular Inset** (`k 23`): centre plinth shows a 10×10 **Isotype** grid of 100 blocks dropping 60 blocks to leave `40%`, while leader-line insets show Auto Minutes, Fast Report & QA Checklist | Numbers drawn as countable Isotype solids (`STYLE.md` §1, §8) |
| S7 | 48.5–60.0 s | Smooth **Scale Reveal** pull-back (`k 18.5`) over the tidy sunlit isometric office where workers collaborate at a clean strategy table; silence at 53.4 s; finished Infographic Legend Card locks in on the right (`50–60%` & System Prompt → QA CTA) | Ends as a museum-grade complete infographic poster |

## 5. Beat Sheet, Cue Map & Sound Design

- **120 BPM** shared timeline (`master_vo_v2/vo_timeline.json`).
- **Foley (`window.EV`)**: paper stack thuds, ink leader-line zip, cutaway slide whoosh, woodblock/kalimba pops per Isotype block (`100 → 40`), crisp stamp/gate ticks on checklist pass.
- **Music**: Acoustic kalimba/marimba/harp/pizzicato ensemble (`sampler.py` VCSL + `pluck.py` physical string bass) with woodblock/shaker pulse, dropping to silence at `15.8–16.5 s` and `53.4–54.0 s`.
- **Subtitles**: Pale cream map-label card (`#FAF7F0`, 2 px `#231A2C` ink border, tiny isometric legend cube chip, bottom-centre clear of the plinth) in self-hosted `Be Vietnam Pro` / `Space Grotesk`.
