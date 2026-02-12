let ITEMS=[];
let activeFilter="all";

const $=s=>document.querySelector(s);

function normalizeText(s=""){
  return String(s).toLowerCase().replace(/\s+/g,"");
}

function matchesSearch(it,keyword){
  const k=normalizeText(keyword||"");
  if(!k) return true;

  const hay=normalizeText([
    it.no,it.name,it.sub,it.desc,it.kw,
    (it.origin||[]).join(" "),
    (it.cup_note||[]).join(" "),
    it.roast
  ].join(" "));

  return hay.includes(k);
}

function roastLevel(value){
  const map={
    "Light":0.2,
    "Medium":0.5,
    "Medium-Dark":0.7,
    "Dark":0.9
  };
  return map[value]||0.5;
}

function roastBarHtml(roast){
  if(!roast) return "";
  const pct=roastLevel(roast)*100;

  return `
    <div class="roastWrap">
      <div class="roastRow">
        <div class="roastLabel">ROASTING POINT</div>
        <div class="roastBar">
          <div class="roastDot" style="left:${pct}%"></div>
        </div>
      </div>
      <div class="roastMarks">
        <span>L</span>
        <span class="mid">M</span>
        <span>D</span>
      </div>
    </div>
  `;
}

function renderList(){
  const keyword=$("#q").value;
  const list=$("#itemList");

  let filtered=ITEMS.filter(it=>{
    if(activeFilter==="all") return true;
    return it.type===activeFilter;
  }).filter(it=>matchesSearch(it,keyword));

  if(filtered.length===0){
    list.innerHTML=`<div class="noResult">No Result — To. coffee haus</div>`;
    return;
  }

  list.innerHTML=filtered.map(it=>`
    <div class="item" data-id="${it.id}">
      <div class="no">${it.no||""}</div>
      <div class="title">
        <div class="mainT">${it.name}</div>
        <div class="subT">${it.sub||""}</div>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".item").forEach(el=>{
    el.addEventListener("click",()=>{
      const id=el.dataset.id;
      renderDetail(id);
    });
  });
}

function renderDetail(id){
  const it=ITEMS.find(x=>x.id===id);
  const detail=$("#detail");

  detail.innerHTML=`
    <div class="card">
      <h2 class="h1">${it.no||""} ${it.name}</h2>
      <div class="desc">${it.desc||""}</div>
      ${roastBarHtml(it.roast)}
    </div>
  `;
}

async function init(){
  const res=await fetch("items.json");
  ITEMS=await res.json();

  $("#q").addEventListener("input",renderList);

  renderList();
}

init();
