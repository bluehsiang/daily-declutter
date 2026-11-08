'use strict';
const $=id=>document.getElementById(id), today=new Date(), pad=n=>String(n).padStart(2,'0');
let year=today.getFullYear(),month=today.getMonth()+1,selected=today.getDate(),view='month',records=[];
const dateKey=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('declutter-diary-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('records',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
async function tx(mode,fn){const db=await dbPromise;return new Promise((resolve,reject)=>{const t=db.transaction('records',mode),s=t.objectStore('records');let result;try{result=fn(s)}catch(e){reject(e);return}t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error)})}
async function load(){const db=await dbPromise;records=await new Promise((resolve,reject)=>{const r=db.transaction('records').objectStore('records').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});render()}
function showToast(s){$('toast').textContent=s;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',2700)}
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
function render(){const n=records.filter(r=>r.date.startsWith(year+'-')).length;$('total').textContent=n;$('goal').textContent=`/ ${((year%4===0&&year%100!==0)||year%400===0)?366:365} 件`;$('progress').style.width=`${Math.min(100,n/(((year%4===0&&year%100!==0)||year%400===0)?366:365)*100)}%`;['month','year','records'].forEach(v=>{$(v+'-view').classList.toggle('hidden',view!==v);$('tab-'+v).classList.toggle('active',view===v)});if(view==='month')renderMonth();if(view==='year')renderYear();if(view==='records')renderRecords()}
function renderMonth(){$('month-title').textContent=`${year} 年 ${month} 月`;$('selected-title').textContent=`${month} 月 ${selected} 日`;$('days').replaceChildren();const offset=new Date(year,month-1,1).getDay(),days=new Date(year,month,0).getDate();for(let i=0;i<offset;i++)$('days').append(el('div'));for(let d=1;d<=days;d++){const key=dateKey(year,month,d),items=records.filter(r=>r.date===key),b=el('button','day'+(d===selected?' selected':'')+(items.length?' done':''));b.type='button';if(items[0]?.photo){const img=el('img');img.src=items[0].photo;img.alt='';b.append(img)}b.append(el('span','number',String(d)));b.setAttribute('aria-label',`${key}，${items.length} 件`);b.onclick=()=>{selected=d;renderMonth()};$('days').append(b)}const items=records.filter(r=>r.date===dateKey(year,month,selected));$('day-count').textContent=`這天已放下 ${items.length} 件物品`;$('entries').replaceChildren();items.forEach(r=>$('entries').append(entryNode(r)))}
function entryNode(r){const box=el('div','entry');if(r.photo){const img=el('img');img.src=r.photo;img.alt=r.name;box.append(img)}const info=el('div','info');info.append(el('strong','',r.name),el('span','muted small',r.date));if(r.meaning)info.append(el('div','meaning',r.meaning));box.append(info);const b=el('button','danger','刪除');b.onclick=async()=>{if(!confirm(`確定刪除「${r.name}」嗎？`))return;await tx('readwrite',s=>s.delete(r.id));await load()};box.append(b);return box}
function renderYear(){$('year-title').textContent=`${year} 年度總覽`;$('months').replaceChildren();for(let m=1;m<=12;m++){const card=el('button','mini');const count=records.filter(r=>r.date.startsWith(`${year}-${pad(m)}-`)).length;card.append(el('strong','',`${m}月`),el('span','',`${count} 件`));const dots=el('div','mini-dots');const off=new Date(year,m-1,1).getDay();for(let i=0;i<off;i++)dots.append(el('i','blank'));for(let d=1;d<=new Date(year,m,0).getDate();d++)dots.append(el('i',records.some(r=>r.date===dateKey(year,m,d))?'done':''));card.append(dots);card.onclick=()=>{month=m;selected=1;view='month';render()};$('months').append(card)}}
function renderRecords(){$('all-entries').replaceChildren();const items=[...records].sort((a,b)=>b.date.localeCompare(a.date));if(!items.length)$('all-entries').append(el('p','', '還沒有紀錄，開始拍下第一件物品吧！'));items.forEach(r=>$('all-entries').append(entryNode(r)))}
['month','year','records'].forEach(v=>$('tab-'+v).onclick=()=>{view=v;render()});
function shiftMonth(n){month+=n;if(month<1){month=12;year--}if(month>12){month=1;year++}selected=1;render()}$('prev').onclick=()=>shiftMonth(-1);$('next').onclick=()=>shiftMonth(1);$('year-prev').onclick=()=>{year--;render()};$('year-next').onclick=()=>{year++;render()};
$('add').onclick=()=>{$('entry-form').reset();$('date').value=dateKey(year,month,selected);$('preview').classList.add('hidden');$('dialog').showModal()};$('cancel').onclick=()=>$('dialog').close();
function compress(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(reader.error);reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('無法讀取照片'));img.onload=()=>{const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.76))};img.src=reader.result};reader.readAsDataURL(file)})}
$('photo').onchange=async()=>{const f=$('photo').files?.[0];if(!f)return;try{const data=await compress(f);$('preview').src=data;$('preview').classList.remove('hidden')}catch(e){showToast(e.message)}};
$('entry-form').onsubmit=async e=>{e.preventDefault();const name=$('name').value.trim(),date=$('date').value;if(!name||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;const photo=$('preview').classList.contains('hidden')?null:$('preview').src;const meaning=$('meaning').value.trim();const r={id:crypto.randomUUID(),name,meaning,date,photo,createdAt:new Date().toISOString()};try{await tx('readwrite',s=>s.put(r));$('dialog').close();const [y,m,d]=date.split('-').map(Number);year=y;month=m;selected=d;view='month';await load();showToast('已儲存，今天也放下一件 🌿')}catch(err){showToast('儲存失敗，請檢查手機儲存空間')}};
$('export').onclick=async()=>{await load();const blob=new Blob([JSON.stringify({app:'declutter-diary',version:1,exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=`日日斷捨離備份_${dateKey(today.getFullYear(),today.getMonth()+1,today.getDate())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);showToast('備份已下載，請妥善保存')};
$('import-btn').onclick=()=>$('import-file').click();$('import-file').onchange=async()=>{const file=$('import-file').files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.app!=='declutter-diary'||!Array.isArray(data.records)||data.records.length>10000||!data.records.every(r=>typeof r.id==='string'&&typeof r.name==='string'&&(r.meaning===undefined||typeof r.meaning==='string')&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&(!r.photo||(typeof r.photo==='string'&&r.photo.startsWith('data:image/')))))throw Error('備份格式不正確');if(!confirm(`匯入 ${data.records.length} 筆紀錄？相同 ID 的紀錄會更新。`))return;await tx('readwrite',s=>data.records.forEach(r=>s.put(r)));await load();showToast('備份匯入成功')}catch(e){showToast('匯入失敗：'+e.message)}finally{$('import-file').value=''}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){const now=new Date();if(dateKey(now.getFullYear(),now.getMonth()+1,now.getDate())!==dateKey(today.getFullYear(),today.getMonth()+1,today.getDate())){today.setTime(now.getTime());year=now.getFullYear();month=now.getMonth()+1;selected=now.getDate();view='month';render()}}});
load().catch(()=>showToast('無法開啟本機資料庫，請使用 Chrome 瀏覽器'));
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
function askDelete(name) {
  return new Promise(resolve => {
    const dialog = document.getElementById('delete-dialog');
    const cancel = document.getElementById('delete-cancel');
    const confirm = document.getElementById('delete-confirm');

    document.getElementById('delete-message').textContent =
      `確定要刪除「${name}」嗎？`;

    function finish(result) {
      dialog.close();
      resolve(result);
    }

    cancel.onclick = () => finish(false);
    confirm.onclick = () => finish(true);
    dialog.oncancel = event => {
      event.preventDefault();
      finish(false);
    };

    dialog.showModal();
  });
}
