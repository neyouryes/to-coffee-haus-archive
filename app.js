let ITEMS = [];
let activeFilter = "all";

const $ = (s)=>document.querySelector(s);

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

/* routing */
function route(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if(id) showDetail(id);
  else showList();
}

function showList(){
  renderList();
  detailView.classList.add("hidden");
  listView.classList.remove("hidden");
}

function showDetail(id){
  renderDetail(id);
  listView.classList.add("hidden");
  detailView.classList.remove("hidden");
}

function goList(){
  history.pushState({}, "", location.pathname);
  showList();
  window.scrollTo({ top: 0 });
}

function goDetail(id){
  history.pushState({}, "", `?id=${encodeURIComponent(id)}`);
  showDetail(id);
  window.scrollTo({ top: 0 });
}

/* label */
function itemLabel(it){
  if(it.type === "blend") return "BLEND";
  if(it.type === "single") return "SINGLE";
  return "GUIDE";
}

/* 왼쪽 넘버 */
function listNo(it, idx){
  if((it.type === "blend" || it.type === "single") && it.no) return it.no;
  if(it.type === "guide") return "MD";
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

function renderList(){
  const keyword = (q.value||"").trim();

  let filtered = ITEMS
    .filter(it => activeFilter === "all" ? true : it.type === activeFilter)
    .filter(it => matchesSearch(it, keyword));

  countTxt.textContent = String(filtered.length);

  itemList.innerHTML = filtered.map((it, idx)=>{
    const no = escapeHtml(listNo(it, idx));
    const title = escapeHtml(it.name);
    const sub = it.type === "blend"
      ? escapeHtml((it.origin||[]).join(" · "))
      : escapeHtml(it.sub || ((it.origin||[]).join(" · ") || ""));
    const badge = itemLabel(it);

    return `
      <div class="item" data-id="${escapeHtml(it.id)}">
        <div class="no">${no}</div>
        <div class="title">
          <div class="mainT">${title}</div>
          <div class="subT">${sub}</div>
        </div>
        <div class="badgeCol">
          <span class="badge">${badge}</span>
          <span class="chev">›</span>
        </div>
      </div>
    `;
  }).join("");

  itemList.querySelectorAll(".item").forEach(el=>{
    el.addEventListener("click", ()=> goDetail(el.dataset.id));
  });
}

/* ===== Recipes Data ===== */
const RECIPES = {
  blend_filter: {
    water_temp: "88°C",
    hot: { dose:"20g", total:"300g", pours:"30g (Bloom)\n90g\n170g\n20g", add:"가수 10–20g", time:"2:40" },
    ice: { dose:"20g", total:"200g", pours:"30g (Bloom)\n40g\n110g\n20g", note:"얼음 칠링", time:"2:20" }
  },
  single_filter: {
    water_temp: "90°C",
    hot: { dose:"20g", total:"300ml", pours:"30g\n90g\n170g\n20g", add:"가수 10–20g", time:"2:30" },
    ice: { dose:"20g", total:"200ml", pours:"30g\n50g\n100g\n20g", time:"2:30" }
  },
  dripbag_guide: {
    hot: {
      temp:"90°C",
      total:"180g",
      pours:"20g (Bloom 30s)\n60g\n60g\n40g",
      detail:"가수 10g",
      time:"1:40–2:00"
    },
    ice: {
      temp:"90°C",
      total:"110g",
      pours:"20g (Bloom 30s)\n45g\n45g",
      detail:"얼음 칠링",
      time:"1:30–1:50"
    }
  }
};

/* ===== Protocol Helpers ===== */
function protoStepsHtml(text=""){
  const lines = String(text).split("\n").map(s=>s.trim()).filter(Boolean);
  return `
    <div class="protoSteps">
      ${lines.map(l=>`<div class="protoStep">${escapeHtml(l)}</div>`).join("")}
    </div>
  `;
}

function protoCardHtml(title, rows){
  const trs = rows.map(r=>`
    <tr>
      <td class="protoK">${escapeHtml(r.k)}</td>
      <td class="protoV">${
        r.type === "steps"
          ? protoStepsHtml(r.v)
          : `<div>${escapeHtml(r.v)}</div>`
      }</td>
    </tr>
  `).join("");

  return `
    <div class="card protoCard">
      <div class="sectionTitle">${escapeHtml(title)}</div>
      <table class="protoGrid"><tbody>${trs}</tbody></table>
    </div>
  `;
}

/* ===== Roast ===== */
function roastLevel(roast=""){
  const r = String(roast).toLowerCase();
  if(r.includes("light")) return 0.22;
  if(r.includes("medium-dark")) return 0.72;
  if(r.includes("dark")) return 0.86;
  if(r.includes("medium")) return 0.55;
  return 0.55;
}

function roastBarHtml(roast){
  if(!roast) return "";
  const pct = roastLevel(roast) * 100;
  return `
    <div class="roastWrap">
      <div class="roastRow">
        <div class="roastLabel">Roasting Point</div>
        <div class="roastStack">
          <div class="roastBar">
            <div class="roastTicks"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="roastDot" style="left:${pct}%"></div>
          </div>
          <div class="roastMarks">
            <span>L</span><span>M</span><span>D</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ===== Detail ===== */
function renderDetail(id){
  const it = ITEMS.find(x=>x.id===id);
  if(!it) return;

  crumbName.textContent = (it.no ? `${it.no} ${it.name}` : it.name);

  let recipeBlocks = "";

  if(it.type === "guide"){
    const g = RECIPES.dripbag_guide;

    recipeBlocks += protoCardHtml("Drip Bag · HOT", [
      { k:"Temp", v:g.hot.temp },
      { k:"Water Total", v:g.hot.total },
      { k:"Pour", v:g.hot.pours, type:"steps" },
      { k:"Add", v:g.hot.detail },
      { k:"Time", v:g.hot.time }
    ]);

    recipeBlocks += protoCardHtml("Drip Bag · ICE", [
      { k:"Temp", v:g.ice.temp },
      { k:"Water Total", v:g.ice.total },
      { k:"Pour", v:g.ice.pours, type:"steps" },
      { k:"Note", v:g.ice.detail },
      { k:"Time", v:g.ice.time }
    ]);
  }

  detail.innerHTML = `
    <div class="card">
      <h2 class="h1">${escapeHtml(it.no || it.name)}</h2>
      <div class="subTitle">${escapeHtml(it.name)}</div>
      ${roastBarHtml(it.roast)}
    </div>
    ${recipeBlocks}
  `;
}

/* init */
async function init(){
  const res = await fetch("items.json");
  ITEMS = await res.json();

  q.addEventListener("input", renderList);
  backBtn.addEventListener("click", goList);
  homeBtn.addEventListener("click", e=>{ e.preventDefault(); goList(); });

  tabs.addEventListener("click", e=>{
    const btn = e.target.closest(".tab");
    if(!btn) return;
    activeFilter = btn.dataset.filter;
    tabs.querySelectorAll(".tab").forEach(b=>b.classList.remove("isOn"));
    btn.classList.add("isOn");
    renderList();
  });

  window.addEventListener("popstate", route);
  route();
}

init();

