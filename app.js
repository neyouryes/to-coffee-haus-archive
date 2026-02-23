/* app.js — To. coffee haus | Archive (FULL)
   - tabs filter (all/blend/single/guide)
   - search (name/origin/cup_note/kw)
   - list view + detail view
   - URL param routing (?id=xxx)
   - header states: isCompact / isSearch
   - YouTube thumb -> click to play
   - ✅ Auto video label (no extra field needed)
*/

let ITEMS = [];
let activeFilter = "all";

const $ = (s)=>document.querySelector(s);

const header = document.querySelector(".header");
const listView = $("#listView");
const detailView = $("#detailView");
const itemList = $("#itemList");
const detail = $("#detail");
const q = $("#q");
const backBtn = $("#backBtn");
const homeBtn = $("#homeBtn");
const countTxt = $("#countTxt");
const crumbName = $("#crumbName");
const tabs = $("#tabs");

/* util */
function escapeHtml(str=""){
  return String(str).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
function normalizeText(s=""){
  return String(s)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[·•,\-_.:;()|[\]{}]/g, "");
}

/* header motion */
function setupHeaderMotion(){
  const onScroll = ()=>{
    header.classList.toggle("isCompact", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  q.addEventListener("focus", ()=> header.classList.add("isSearch"));
  q.addEventListener("blur",  ()=> header.classList.remove("isSearch"));
}

/* routing */
function route(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if(id) showDetail(id);
  else showList();
}

/* view transition helpers */
function animateSwap(hideEl, showEl){
  hideEl.classList.remove("enter");
  hideEl.classList.add("leave");
  showEl.classList.remove("leave");

  showEl.classList.remove("hidden");
  showEl.classList.add("enter");

  setTimeout(()=>{
    hideEl.classList.add("hidden");
    hideEl.classList.remove("leave");
    showEl.classList.remove("enter");
  }, 260);
}

function showList(){
  if(detailView.classList.contains("hidden")){
    renderList();
    return;
  }
  renderList();
  animateSwap(detailView, listView);
}

function showDetail(id){
  renderDetail(id);
  if(detailView.classList.contains("hidden")){
    animateSwap(listView, detailView);
  }
}

function goList(){
  history.pushState({}, "", location.pathname);
  showList();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function goDetail(id){
  history.pushState({}, "", `?id=${encodeURIComponent(id)}`);
  showDetail(id);
  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ui label */
function itemLabel(it){
  if(it.type === "blend") return "BLEND";
  if(it.type === "single") return "SINGLE";
  return "GUIDE";
}
function listNo(it, idx){
  if((it.type === "blend" || it.type === "single") && it.no) return it.no;
  if(it.type === "guide") return "MD";            // ✅ 왼쪽 넘버만 MD
  return String(idx + 1).padStart(2,"0");
}

/* search */
function matchesSearch(it, keyword){
  const k = normalizeText(keyword || "");
  if(!k) return true;

  const hay = normalizeText([
    it.no, it.name, it.sub, it.desc,
    it.kw,
    (it.origin||[]).join(" "),
    it.process, it.variety,
    (it.cup_note||[]).join(" "),
    it.roast
  ].filter(Boolean).join(" "));

  return hay.includes(k);
}

function renderEmpty(){
  itemList.innerHTML = `
    <div class="empty">
      <div class="emptyBox">
        <div class="emptyTitle">No Result — To. coffee haus</div>
        <p class="emptySub">Try another keyword. (ex. 콜롬비아 · 에티오피아 · 디카페인 · 드립백 · 콜드브루)</p>
      </div>
    </div>
  `;
}

function renderList(){
  const keyword = (q.value||"").trim();

  const filtered = ITEMS
    .filter(it => activeFilter === "all" ? true : it.type === activeFilter)
    .filter(it => matchesSearch(it, keyword));

  countTxt.textContent = String(filtered.length);

  if(filtered.length === 0){
    renderEmpty();
    return;
  }

  itemList.innerHTML = filtered.map((it, idx)=>{
    const no = escapeHtml(listNo(it, idx));
    const title = escapeHtml(it.name);

    const sub = it.type === "blend"
      ? escapeHtml((it.origin||[]).join(" · "))
      : escapeHtml(it.sub || ((it.origin||[]).join(" · ") || ""));

    const badge = itemLabel(it);
    const dim = it.coming_soon ? " dim" : "";
    const right = it.coming_soon ? "…" : "›";

    return `
      <div class="item" role="listitem" data-id="${escapeHtml(it.id)}">
        <div class="no">${no}</div>
        <div class="title">
          <div class="mainT">${title}</div>
          <div class="subT">${sub}</div>
        </div>
        <div class="badgeCol">
          <span class="badge${dim}">${badge}</span>
          <span class="chev">${right}</span>
        </div>
      </div>
    `;
  }).join("");

  itemList.querySelectorAll(".item").forEach(el=>{
    el.addEventListener("click", ()=> goDetail(el.dataset.id));
  });
}

/* recipes (fixed specs + 문구 변경 반영) */
const RECIPES = {
  blend_filter: {
    water_temp: "88°C",
    hot: { dose:"20g", water_total:"300g", pours:"30g (Bloom) → 90g → 170g → 20g", add:"가수 10g", time:"2:40" },
    ice: { dose:"20g", water_total:"200g", pours:"30g (Bloom) → 40g → 110g → 20g", note:"얼음 칠링", time:"2:20" }
  },
  blend_espresso: {
    no12: { basket:"IMS 18g", dose:"16.8g", yield:"35g", time:"25–28s", temp:"93°C" },
    no34: { basket:"IMS 18g", dose:"17g",   yield:"35g", time:"29–32s", temp:"93°C" },
    no5:  { basket:"IMS 18g", dose:"17g",   yield:"38g", time:"33–35s", temp:"93°C" }
  },
  single_filter: {
    water_temp: "90°C",
    hot: { dose:"20g", water_total:"300ml", pours:"30g → 90g → 170g → 20g", add:"가수 10g", time:"2:30" },
    ice: { dose:"20g", water_total:"200ml", pours:"30g → 50g → 100g → 20g", note:"얼음 칠링", time:"2:30" }
  },
  single_espresso: {
    ethiopia: { basket:"IMS 18g", dose:"16.8g", yield:"47g", time:"38–40s", temp:"93°C" },
    default:  { basket:"IMS 18g", dose:"17.5g", yield:"50g", time:"40–43s", temp:"93°C" }
  },
  dripbag_guide: {
    hot: {
      temp:"90°C",
      water_total:"180g",
      pours:"20g (Bloom 30s)\n60g\n60g\n40g",
      detail:"가수 10g",
      time:"1:40–2:00"
    },
    ice: {
      temp:"90°C",
      water_total:"110g",
      pours:"20g (Bloom 30s)\n45g\n45g",
      detail:"얼음 칠링",
      time:"1:30–1:50"
    }
  },
  coldbrew_guide: { lines: ["Concentrate 80g", "Water 120g", "Total 200g"] }
};

/* roast bar */
function roastLevel(roast=""){
  const r = String(roast).toLowerCase().replace(/\s+/g,"");
  if(r.includes("light")) return 0.22;
  if(r.includes("medium-dark") || r.includes("mediumdark")) return 0.72;
  if(r.includes("dark")) return 0.86;
  if(r.includes("medium")) return 0.55;
  return 0.55;
}
function roastBarHtml(roast){
  if(!roast) return "";
  const pct = Math.max(0.05, Math.min(0.95, roastLevel(roast))) * 100;

  return `
    <div class="roastWrap">
      <div class="roastLabel">Roasting Point</div>
      <div class="roastBar" aria-label="Roasting bar">
        <div class="roastTicks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="roastDot" style="left:${pct}%"></div>
      </div>
      <div class="roastEnds" aria-hidden="true">
        <span>L</span><span>M</span><span>D</span>
      </div>
    </div>
  `;
}

/* ---------- Video Label Auto Generator ---------- */
function videoLabel(it){
  if(it.type === "guide"){
    if(it.id === "guide-coldbrew") return "Cold Brew Recipe";
    if(it.id === "guide-dripbag") return "Drip Bag Brew Guide";
    return "Guide Video";
  }
  if(it.type === "blend"){
    const head = it.no ? `${it.no} ` : "";
    return `${head}Espresso Recipe`;
  }
  if(it.type === "single"){
    const head = it.no ? `${it.no} ` : "";
    return `${head}Recipe`;
  }
  return "Recipe";
}

/* video thumb */
function createYouTubeThumb(videoId, caption="Recipe"){
  const cap = escapeHtml(caption);
  return `
    <div class="yt-wrap" data-video="${escapeHtml(videoId)}" data-caption="${cap}">
      <button class="yt-thumb" type="button" aria-label="Play ${cap}">
        <img src="https://i.ytimg.com/vi/${escapeHtml(videoId)}/hqdefault.jpg" alt="${cap} thumbnail">
        <div class="yt-overlay"></div>
        <div class="yt-playDot" aria-hidden="true"></div>
        <div class="yt-caption">${cap}</div>
      </button>
    </div>
  `;
}

/* detail */
function renderDetail(id){
  const it = ITEMS.find(x=>x.id===id);
  if(!it){
    crumbName.textContent = "Not found";
    detail.innerHTML = `<div class="card"><p>항목을 찾을 수 없어요.</p></div>`;
    return;
  }

  // ✅ 타입별 스타일 적용(싱글/MD 강조)
  detail.className = `detail ${it.type}`;

  crumbName.textContent = (it.no ? `${it.no} ${it.name}` : it.name);

  const mainTitle = (it.type === "blend" || it.type === "single") ? escapeHtml(it.no || it.name) : escapeHtml(it.name);
  const subTitle  = (it.type === "blend" || it.type === "single") ? escapeHtml(it.name) : escapeHtml(it.sub || "");
  const subtitle  = subTitle ? `<div class="subTitle">${subTitle}</div>` : "";
  const desc      = it.desc ? `<p class="desc">${escapeHtml(it.desc)}</p>` : "";

  const chips = [];
  if(it.type === "blend"){
    if(it.origin?.length) chips.push(`Origin: ${it.origin.join(" · ")}`);
  } else if(it.type === "single"){
    if(it.sub) chips.push(it.sub);
    if(it.origin?.length) chips.push(`Origin: ${it.origin.join(" · ")}`);
    if(it.process) chips.push(`Process: ${it.process}`);
    if(it.variety) chips.push(`Variety: ${it.variety}`);
  } else {
    if(it.sub) chips.push(it.sub);
  }
  const chipHtml = chips.map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("");

  const noteHtml = (it.cup_note||[]).map(n=>`<span class="chip">${escapeHtml(n)}</span>`).join("");
  const cupNoteBlock = (it.cup_note && it.cup_note.length)
    ? `<div class="card"><div class="sectionTitle">Cup Note</div><div class="subline">${noteHtml}</div></div>`
    : "";

  const videoBlock = it.video_id
    ? `<div class="card">
         <div class="sectionTitle">Video</div>
         ${createYouTubeThumb(it.video_id, videoLabel(it))}
       </div>`
    : `<div class="card">
         <div class="sectionTitle">Video</div>
         <div class="emptyBox" style="margin-top:10px">
           <div class="emptyTitle">Coming soon</div>
           <p class="emptySub">Recipe video will be updated.</p>
         </div>
       </div>`;

  let recipeBlocks = "";

  if(it.type === "blend"){
    const f = RECIPES.blend_filter;
    let esp;
    if(it.no === "NO.1" || it.no === "NO.2") esp = RECIPES.blend_espresso.no12;
    else if(it.no === "NO.3" || it.no === "NO.4") esp = RECIPES.blend_espresso.no34;
    else esp = RECIPES.blend_espresso.no5;

    const cold = it.cold_brew
      ? `<div class="card"><div class="sectionTitle">Cold Brew</div><pre>${RECIPES.coldbrew_guide.lines.join("\n")}</pre></div>`
      : "";

    recipeBlocks = `
      <div class="card">
        <div class="sectionTitle">Espresso</div>
        <pre>${esp.basket} Basket
Dose ${esp.dose}
Yield ${esp.yield}
Time ${esp.time}
Water Temp ${esp.temp}</pre>
      </div>

      <div class="card">
        <div class="sectionTitle">Filter</div>
        <pre>Water Temp ${f.water_temp}

HOT
Dose ${f.hot.dose}
Water Total ${f.hot.water_total}
${f.hot.pours}
${f.hot.add}
Time ${f.hot.time}

ICE
Dose ${f.ice.dose}
Water Total ${f.ice.water_total}
${f.ice.pours}
${f.ice.note}
Time ${f.ice.time}</pre>
      </div>

      ${cold}
    `;
  }

  if(it.type === "single"){
    if(it.coming_soon){
      recipeBlocks = `<div class="card"><div class="sectionTitle">Recipe</div><pre>Coming soon</pre></div>`;
    } else {
      const f = RECIPES.single_filter;
      const esp = RECIPES.single_espresso[it.espresso_profile || "default"] || RECIPES.single_espresso.default;

      recipeBlocks = `
        <div class="card">
          <div class="sectionTitle">Espresso</div>
          <pre>${esp.basket} Basket
Dose ${esp.dose}
Yield ${esp.yield}
Time ${esp.time}
Water Temp ${esp.temp}</pre>
        </div>

        <div class="card">
          <div class="sectionTitle">Filter</div>
          <pre>Water Temp ${f.water_temp}

HOT
Dose ${f.hot.dose}
Water Total ${f.hot.water_total}
${f.hot.pours}
${f.hot.add}
Time ${f.hot.time}

ICE
Dose ${f.ice.dose}
Water Total ${f.ice.water_total}
${f.ice.pours}
${f.ice.note}
Time ${f.ice.time}</pre>
        </div>
      `;
    }
  }

  if(it.type === "guide"){
    if(it.id === "guide-dripbag"){
      const g = RECIPES.dripbag_guide;
      recipeBlocks = `
        <div class="card">
          <div class="sectionTitle">Drip Bag</div>
          <pre>HOT
Temp ${g.hot.temp}
Water Total ${g.hot.water_total}
${g.hot.pours}
${g.hot.detail}
Time ${g.hot.time}

ICE
Temp ${g.ice.temp}
Water Total ${g.ice.water_total}
${g.ice.pours}
${g.ice.detail}
Time ${g.ice.time}</pre>
        </div>
      `;
    } else if(it.id === "guide-coldbrew"){
      recipeBlocks = `
        <div class="card">
          <div class="sectionTitle">Cold Brew</div>
          <pre>${RECIPES.coldbrew_guide.lines.join("\n")}</pre>
        </div>
      `;
    } else {
      recipeBlocks = `<div class="card"><div class="sectionTitle">Guide</div><pre>Coming soon</pre></div>`;
    }
  }

  detail.innerHTML = `
    <div class="card">
      <h2 class="h1">${mainTitle}</h2>
      ${subtitle}
      ${desc}
      ${chipHtml ? `<div class="subline infoGap">${chipHtml}</div>` : ``}
      ${roastBarHtml(it.roast)}
    </div>

    ${cupNoteBlock}
    ${videoBlock}
    ${recipeBlocks}
  `;
}

/* click thumb -> play */
document.addEventListener("click", (e)=>{
  const wrap = e.target.closest(".yt-wrap");
  if(!wrap) return;
  if(wrap.querySelector("iframe")) return;

  const id = wrap.dataset.video;
  const cap = wrap.dataset.caption || "Recipe";

  wrap.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      title="${cap}">
    </iframe>
  `;
});

/* tabs */
function setActiveTab(name){
  activeFilter = name;
  tabs.querySelectorAll(".tab").forEach(btn=>{
    btn.classList.toggle("isOn", btn.dataset.filter === name);
  });
  renderList();
}

/* init */
async function init(){
  const res = await fetch("items.json", { cache:"no-store" });
  ITEMS = await res.json();

  q.addEventListener("input", renderList);
  backBtn.addEventListener("click", goList);
  homeBtn.addEventListener("click", (e)=>{ e.preventDefault(); goList(); });

  tabs.addEventListener("click", (e)=>{
    const btn = e.target.closest(".tab");
    if(!btn) return;
    setActiveTab(btn.dataset.filter);
  });

  window.addEventListener("popstate", route);

  setupHeaderMotion();
  route();
}

init();
