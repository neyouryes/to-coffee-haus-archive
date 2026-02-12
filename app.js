let ITEMS = [];
let activeFilter = "all";

const $ = s => document.querySelector(s);

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

function route(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if(id) showDetail(id);
  else showList();
}

function showList(){
  detailView.classList.add("hidden");
  listView.classList.remove("hidden");
  renderList();
}

function showDetail(id){
  listView.classList.add("hidden");
  detailView.classList.remove("hidden");
  renderDetail(id);
}

function goDetail(id){
  history.pushState({}, "", `?id=${id}`);
  showDetail(id);
}

function goList(){
  history.pushState({}, "", location.pathname);
  showList();
}

function renderList(){
  const keyword = (q.value||"").toLowerCase();

  const filtered = ITEMS.filter(it=>{
    if(activeFilter!=="all" && it.type!==activeFilter) return false;
    return it.name.toLowerCase().includes(keyword);
  });

  countTxt.textContent = filtered.length;

  itemList.innerHTML = filtered.map(it=>`
    <div class="item" data-id="${it.id}">
      <div class="no">${it.no || ""}</div>
      <div>
        <div class="mainT">${it.name}</div>
        <div class="subT">${it.sub||""}</div>
      </div>
      <div>›</div>
    </div>
  `).join("");

  itemList.querySelectorAll(".item").forEach(el=>{
    el.addEventListener("click",()=>goDetail(el.dataset.id));
  });
}

function renderDetail(id){
  const it = ITEMS.find(x=>x.id===id);
  if(!it) return;

  crumbName.textContent = it.name;

  detail.innerHTML = `
    <div class="card">
      <h2 class="h1">${it.no||""}</h2>
      <div class="subTitle">${it.name}</div>
      <p class="desc">${it.desc||""}</p>
      ${(it.cup_note||[]).map(n=>`<span class="chip">${n}</span>`).join("")}
    </div>
  `;
}

async function init(){
  const res = await fetch("items.json");
  ITEMS = await res.json();

  q.addEventListener("input", renderList);
  backBtn.addEventListener("click", goList);
  homeBtn.addEventListener("click", e=>{e.preventDefault();goList();});

  tabs.addEventListener("click", e=>{
    const btn=e.target.closest(".tab");
    if(!btn) return;
    activeFilter=btn.dataset.filter;
    tabs.querySelectorAll(".tab").forEach(b=>b.classList.remove("isOn"));
    btn.classList.add("isOn");
    renderList();
  });

  window.addEventListener("popstate", route);
  route();
}

init();
