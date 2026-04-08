const SURL='https://ufdzyseexhajmzghhsem.supabase.co';
const SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZHp5c2VleGhham16Z2hoc2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjk4ODIsImV4cCI6MjA4OTUwNTg4Mn0.56BkKgvZYBwSEAQg4m8X9xReJCekN2AUULdGmFi37Qg';
const sb=supabase.createClient(SURL,SKEY);
let user=null,view='hoy',cat='compras',items={};
const COLORS={compras:'#1d9e75',eventos:'#ba7517',peliculas:'#7f77dd',libros:'#378add',citas:'#E8637A',salud:'#e24b4a',cumples:'#d85a30',ejercicio:'#0f6e56',recordatorios:'#534ab7',ideas:'#888780',cultura:'#C084C0',bts:'#9B8EC4'};
const BADGES={compras:'bt',eventos:'ba',peliculas:'bpu',libros:'bb',citas:'bp',salud:'bp',cumples:'bc',ejercicio:'bt',recordatorios:'bpu',ideas:'bgr',cultura:'bpu',bts:'bpu'};
const LABELS={compras:'Compras',eventos:'Evento',peliculas:'Película',libros:'Libro',citas:'Cita',salud:'Salud',cumples:'Cumpleaños',ejercicio:'Ejercicio',recordatorios:'To-Do',ideas:'Idea',cultura:'Cultura',bts:'BTS 💜'};
const HINTS={compras:'¿Qué necesitas comprar?',eventos:'Nombre del evento...',peliculas:'Título de la película...',libros:'Título del libro...',citas:'¿Con quién y dónde?',salud:'Síntoma, medicamento, nota médica...',cumples:'Nombre de la persona...',ejercicio:'Rutina, meta, actividad...',recordatorios:'Tarea, nota, checklist...',ideas:'Anota tu idea...',cultura:'Película, serie, libro, juego...',bts:'Nombre del álbum, single, show...'};
const NEED_DATE=['eventos','citas','salud','cumples','recordatorios','ejercicio','cultura','bts'];
const NEED_LOC=['eventos','citas','ejercicio','bts'];
const SALUD_TYPES=[{key:'sintoma',label:'🤒 Síntoma'},{key:'medicamento',label:'💊 Medicamento'},{key:'nota',label:'📋 Nota médica'},{key:'resultado',label:'🧪 Resultado'}];

const EVENTO_TYPES=[
  {key:'concierto',label:'🎤 Concierto'},
  {key:'teatro',label:'🎭 Teatro / Show'},
  {key:'cena',label:'🍽️ Cena / Restaurante'},
  {key:'fiesta',label:'🎉 Fiesta / Reunión'},
  {key:'viaje',label:'✈️ Viaje'},
  {key:'deporte',label:'🏃 Deporte / Actividad'},
  {key:'otro',label:'📅 Otro'},
];

const CULTURA_TYPES=[
  {key:'musica',label:'🎵 Música'},
  {key:'serie',label:'🎬 Serie / Película'},
  {key:'libro',label:'📚 Libro'},
  {key:'juego',label:'🎮 Videojuego'},
];

const BTS_TYPES=[
  {key:'album',label:'💿 Álbum / Mini Álbum'},
  {key:'single',label:'🎵 Single / Canción'},
  {key:'app',label:'📱 Weverse / App'},
  {key:'docu',label:'🎬 Documental / Película'},
  {key:'show',label:'📺 Show / Reality'},
  {key:'concierto',label:'🎤 Concierto / Tour'},
];

let selectedSubtype=null;
let eventoFilter=null;
let eventoView='list'; // 'list' | 'timeline' | 'cards'
let statsOpen=false;

// All available tabs definition
const ALL_TABS=[
  {key:'hoy',label:'Hoy',color:'var(--pink)',always:true},
  {key:'compras',label:'Compras',color:'#1d9e75'},
  {key:'eventos',label:'Eventos',color:'#ba7517'},
  {key:'citas',label:'Citas',color:'#E8637A'},
  {key:'salud',label:'Salud',color:'#e24b4a'},
  {key:'cumples',label:'Cumpleaños',color:'#d85a30'},
  {key:'ejercicio',label:'Ejercicio',color:'#0f6e56'},
  {key:'recordatorios',label:'To-Do ✅',color:'#534ab7'},
  {key:'ideas',label:'Ideas',color:'#888780'},
  {key:'cultura',label:'Cultura',color:'#C084C0'},
  {key:'bts',label:'BTS 💜',color:'#9B8EC4'},
];

// Load hidden tabs from localStorage
let hiddenTabs=new Set(JSON.parse(localStorage.getItem('kamiHiddenTabs')||'[]'));

function saveHiddenTabs(){localStorage.setItem('kamiHiddenTabs',JSON.stringify([...hiddenTabs]));}

function renderNavTabs(){
  const nav=document.querySelector('.nav-tabs');
  nav.innerHTML=ALL_TABS.filter(t=>!hiddenTabs.has(t.key)).map((t,i)=>{
    const isBts=t.key==='bts';
    const activeClass=view===t.key?'active':'';
    return `<button class="tab ${activeClass}" data-view="${t.key}" onclick="switchView('${t.key}',this)">
      <div class="tab-dot" style="background:${t.color}"></div>
      <span ${isBts?'style="color:#9B8EC4;font-weight:500"':''}>${t.label}</span>
    </button>`;
  }).join('');
}

function openTabsConfig(){
  const list=document.getElementById('tabsList');
  list.innerHTML=ALL_TABS.map(t=>`
    <div class="tab-toggle-item">
      <div class="tab-toggle-dot" style="background:${t.color}"></div>
      <div class="tab-toggle-label">${t.label}</div>
      ${t.always?'<span style="font-size:11px;color:var(--text3)">Siempre visible</span>':`
      <button class="toggle-switch ${hiddenTabs.has(t.key)?'off':'on'}" onclick="toggleTab('${t.key}',this)"></button>`}
    </div>`).join('');
  document.getElementById('tabsScreen').classList.add('open');
}

function closeTabsConfig(){
  document.getElementById('tabsScreen').classList.remove('open');
  renderNavTabs();
}

function toggleTab(key,btn){
  if(hiddenTabs.has(key)){hiddenTabs.delete(key);btn.className='toggle-switch on';}
  else{hiddenTabs.add(key);btn.className='toggle-switch off';}
  saveHiddenTabs();
  // If current view is now hidden, go to hoy
  if(hiddenTabs.has(view)){view='hoy';}
}

function addToCalendarById(id,c){
  const item=(items[c]||[]).find(i=>i.id===id);
  if(item)addToCalendar(item,c);
}

// Invite card generator
let inviteCardBlob=null;

function openInviteCard(id,c){
  const item=(items[c]||[]).find(i=>i.id===id);
  if(!item)return;
  drawInviteCard(item,c);
  document.getElementById('inviteCardOverlay').classList.add('open');
}

function closeInviteCard(){
  document.getElementById('inviteCardOverlay').classList.remove('open');
  inviteCardBlob=null;
}

function drawInviteCard(item,c){
  const canvas=document.getElementById('inviteCanvas');
  const ctx=canvas.getContext('2d');
  const W=680,H=680;
  canvas.width=W;canvas.height=H;

  // Detect dark mode
  const dark=window.matchMedia('(prefers-color-scheme:dark)').matches;

  // Background
  const palettes={
    eventos:{bg:['#FFF8F0','#FFF0D6'],accent:'#ba7517',text:'#2a1a00'},
    citas:{bg:['#FFF0F3','#FFE0E8'],accent:'#E8637A',text:'#2a0010'},
    ejercicio:{bg:['#F0FBF5','#D6F5E5'],accent:'#0f6e56',text:'#002a1a'},
    salud:{bg:['#FFF0F0','#FFD6D6'],accent:'#e24b4a',text:'#2a0000'},
    cumples:{bg:['#FFF5F0','#FFE5D0'],accent:'#d85a30',text:'#2a1000'},
    bts:{bg:['#F5F0FF','#E8D6FF'],accent:'#9B8EC4',text:'#1a0040'},
    cultura:{bg:['#FDF0FF','#F5D6FF'],accent:'#C084C0',text:'#2a0040'},
  };
  const pal=palettes[c]||{bg:['#F7F6F3','#EFEDE8'],accent:'#E8637A',text:'#1a1a18'};

  // Gradient background
  const grad=ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,pal.bg[0]);
  grad.addColorStop(1,pal.bg[1]);
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  // Decorative circle top right
  ctx.beginPath();
  ctx.arc(W+60,-60,220,0,Math.PI*2);
  ctx.fillStyle=pal.accent+'22';
  ctx.fill();

  // Decorative circle bottom left
  ctx.beginPath();
  ctx.arc(-60,H+60,200,0,Math.PI*2);
  ctx.fillStyle=pal.accent+'18';
  ctx.fill();

  // Accent bar top
  ctx.fillStyle=pal.accent;
  ctx.fillRect(0,0,W,8);

  // Logo
  ctx.font='bold 28px serif';
  ctx.fillStyle=pal.accent;
  ctx.fillText('kami',48,72);

  // Category emoji + label
  const emojis={eventos:'📅',citas:'🤝',ejercicio:'🏃',salud:'💊',cumples:'🎂',bts:'💜',cultura:'✨'};
  const emoji=emojis[c]||'✨';
  ctx.font='52px serif';
  ctx.fillText(emoji,48,170);

  // Title
  const title=item.text;
  ctx.font='bold 44px sans-serif';
  ctx.fillStyle=pal.text;
  // Word wrap
  const words=title.split(' ');
  let line='',y=250,lineH=56;
  for(const word of words){
    const test=line+word+' ';
    if(ctx.measureText(test).width>W-96&&line){
      ctx.fillText(line.trim(),48,y);
      line=word+' ';y+=lineH;
    } else line=test;
  }
  ctx.fillText(line.trim(),48,y);
  y+=lineH+20;

  // Divider
  ctx.strokeStyle=pal.accent+'55';
  ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(48,y);ctx.lineTo(W-48,y);ctx.stroke();
  y+=32;

  // Date & time
  if(item.date){
    ctx.font='28px sans-serif';
    ctx.fillStyle=pal.accent;
    const dateStr=fmtDate(item.date);
    const timeStr=item.date.includes('T')?fmtTime(item.date):'';
    ctx.fillText(`📅  ${dateStr}${timeStr?' · '+timeStr:''}`,48,y);
    y+=48;
  }

  // Location — strip @@ cumpleId suffix before parsing
  const rawLocCard=item.location?item.location.split('@@')[0].split('||')[0]:'';
  const{locName}=parseLocationFull(rawLocCard||null);
  if(locName){
    ctx.font='28px sans-serif';
    ctx.fillStyle=pal.text+'bb';
    const locText=`📍  ${locName}`;
    if(ctx.measureText(locText).width>W-96){
      ctx.fillText(locText.slice(0,38)+'…',48,y);
    } else {
      ctx.fillText(locText,48,y);
    }
    y+=48;
  }

  // Cumple badge on card
  const cumpleIdCard=item.location&&item.location.includes('@@')?item.location.split('@@')[1]:null;
  const cumplePersonCard=cumpleIdCard?(items.cumples||[]).find(i=>i.id===cumpleIdCard):null;
  if(cumplePersonCard){
    ctx.font='22px sans-serif';
    ctx.fillStyle=pal.accent;
    ctx.fillText(`🎂 Cumple de ${cumplePersonCard.text.split(' ')[0]}`,48,y);
    y+=40;
  }

  // Invite CTA
  const userName=user?.user_metadata?.full_name?.split(' ')[0]||'';
  const inviteLink=buildInviteLink(item,c,user?.user_metadata?.full_name||'');
  y+=8;
  ctx.font='22px sans-serif';
  ctx.fillStyle=pal.text+'99';
  ctx.fillText(userName?`${userName} te invita ✨`:'Te invita a un plan ✨',48,y);

  // Bottom bar
  ctx.fillStyle=pal.accent;
  ctx.fillRect(0,H-6,W,6);
}

async function shareInviteCard(){
  const canvas=document.getElementById('inviteCanvas');
  try{
    canvas.toBlob(async blob=>{
      if(!blob)return;
      // Try Web Share API first (works on iOS/Android)
      if(navigator.share&&navigator.canShare){
        const file=new File([blob],'kami-invite.png',{type:'image/png'});
        if(navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:'Invitación',text:'¡Te invito a un plan! 🎉'});
          return;
        }
      }
      // Fallback: download
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download='kami-invite.png';
      document.body.appendChild(a);a.click();
      document.body.removeChild(a);URL.revokeObjectURL(url);
    },'image/png');
  }catch(e){console.error(e);}
}

// Calendar .ics generation
function addToCalendar(item,c){
  if(!item.date){alert('Este item no tiene fecha.');return;}
  const d=parseLocalDate(item.date);
  const pad=n=>String(n).padStart(2,'0');
  const fmt=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const start=fmt(d);
  const end=fmt(new Date(d.getTime()+60*60*1000));
  // Properly strip @@ and || before parsing location
  const rawLoc=item.location?item.location.split('@@')[0].split('||')[0]:'';
  const{locName,lat,lon,mapsLink}=parseLocationFull(rawLoc||null);
  const finalMapLink=mapsLink||mapsUrl(lat,lon,locName);
  const{note}=parseRelease(item.location||'');
  const desc=note||LABELS[c]||'';
  const locationLine=locName?`LOCATION:${locName}${finalMapLink?' ('+finalMapLink+')':''}\n`:'';
  const ics=`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Kami//EN\nBEGIN:VEVENT\nUID:${item.id}@kami\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${item.text}\nDESCRIPTION:${desc}\n${locationLine}BEGIN:VALARM\nTRIGGER:-PT30M\nACTION:DISPLAY\nDESCRIPTION:Recordatorio\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
  const blob=new Blob([ics],{type:'text/calendar'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`${item.text.replace(/\s+/g,'_')}.ics`;
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}

// Daily summary for WhatsApp
function sendDailySummary(){
  const today=new Date();
  const ts=today.toISOString().split('T')[0];
  const days=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dayName=days[today.getDay()];
  const dateLabel=`${dayName} ${today.getDate()} ${months[today.getMonth()]}`;

  let todayItems=[];
  Object.entries(items).forEach(([c,arr])=>{
    arr.forEach(item=>{if(item.date&&item.date.startsWith(ts)&&!item.done)todayItems.push({...item,cat:c});});
  });

  let msg=`☀️ *Mi día — ${dateLabel}*\n`;

  if(!todayItems.length){
    msg+='\nSin eventos programados hoy ✨';
  } else {
    todayItems.sort((a,b)=>a.date>b.date?1:-1).forEach(item=>{
      const c=item.cat;
      const emoji={eventos:'📅',citas:'🤝',ejercicio:'🏃',salud:'💊',recordatorios:'🔔',bts:'💜',cultura:'✨',cumples:'🎂'}[c]||'•';
      const t=item.date&&item.date.includes('T')?fmtTime(item.date):'';
      const{locName}=parseLocationFull(item.location?item.location.split('||')[0]:null);
      const{note}=parseRelease(item.location||'');
      const parts=[t,locName,note].filter(Boolean).join(' · ');
      msg+=`\n${emoji} *${item.text}*${parts?' — '+parts:''}`;
    });
  }

  // Pendientes rápidos
  const compras=(items.compras||[]).filter(i=>!i.done);
  if(compras.length){
    msg+=`\n\n🛒 *Pendiente comprar:*`;
    compras.slice(0,5).forEach(i=>msg+=`\n  • ${i.text}`);
  }

  msg+='\n\n_vía kami 🌸_';
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank');
}

// Place data storage: {name, lat, lon}
let placeData={sheet:null,edit:null,cumple:null};
let placeTimer=null;

async function searchPlace(input,sugId){
  const q=input.value.trim();
  const sug=document.getElementById(sugId);
  if(q.length<3){sug.style.display='none';return;}
  clearTimeout(placeTimer);
  placeTimer=setTimeout(async()=>{
    try{
      // Search with countrycodes=mx for better Mexico results
      const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&accept-language=es&countrycodes=mx&addressdetails=1`);
      const data=await r.json();
      if(!data.length){
        // Show manual entry option if no results
        sug.innerHTML=`<div class="place-item" style="color:var(--text3)" onmousedown="useManualPlace(event,'${input.id}','${sugId}')">✍️ Usar "${q}" como está</div>`;
        sug.style.display='block';
        return;
      }
      sug.innerHTML=data.map((p,i)=>{
        const safeName=p.display_name.replace(/'/g,'').replace(/"/g,'');
        const handler=`selectPlace(event,'${sugId}','${input.id}',${p.lat},${p.lon},'${safeName}')`;
        const city=p.address?.city||p.address?.town||p.address?.municipality||'';
        const suburb=p.address?.suburb||p.address?.neighbourhood||'';
        const sub=[suburb,city].filter(Boolean).join(', ');
        return `<div class="place-item" onmousedown="${handler}" ontouchstart="${handler}"><b>${p.display_name.split(',')[0]}</b><small>${sub||p.display_name.split(',').slice(1,3).join(',')}</small></div>`;
      }).join('');
      // Add manual option at bottom
      sug.innerHTML+=`<div class="place-item" style="color:var(--text3);border-top:0.5px solid var(--border)" onmousedown="useManualPlace(event,'${input.id}','${sugId}')" ontouchstart="useManualPlace(event,'${input.id}','${sugId}')">✍️ Usar "${q}" como está</div>`;
      sug.style.display='block';
    }catch(e){sug.style.display='none';}
  },400);
}

function useManualPlace(e,inputId,sugId){
  e.preventDefault();
  const val=document.getElementById(inputId).value.trim();
  if(!val)return;
  const key=inputId==='sheetLocation'?'sheet':inputId==='editLocation'?'edit':'cumple';
  placeData[key]={name:val,lat:null,lon:null};
  document.getElementById(sugId).style.display='none';
}

function selectPlace(e,sugId,inputId,lat,lon,name){
  e.preventDefault();
  const shortName=name.split(',')[0];
  document.getElementById(inputId).value=shortName;
  const key=inputId==='sheetLocation'?'sheet':inputId==='editLocation'?'edit':'cumple';
  placeData[key]={name:shortName,lat,lon};
  document.getElementById(sugId).style.display='none';
  // Fetch extra place info from Overpass if it's the main sheet
  if(inputId==='sheetLocation') fetchPlaceInfo(lat,lon,'sheetPlaceInfo');
  else if(inputId==='editLocation') fetchPlaceInfo(lat,lon,'editPlaceInfo');
}

async function fetchPlaceInfo(lat,lon,infoId){
  const infoEl=document.getElementById(infoId);
  if(!infoEl)return;
  infoEl.style.display='none';
  infoEl.innerHTML='';
  try{
    // Search nearby OSM node for this exact place
    const query=`[out:json][timeout:5];node(around:50,${lat},${lon})[name];out 1;`;
    const r=await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data=await r.json();
    if(!data.elements||!data.elements.length)return;
    const tags=data.elements[0].tags||{};
    const lines=[];
    if(tags.cuisine)lines.push(`🍽️ ${tags.cuisine.replace(';',' · ')}`);
    if(tags.opening_hours)lines.push(`🕐 ${tags.opening_hours}`);
    if(tags.phone||tags['contact:phone'])lines.push(`📞 <a href="tel:${(tags.phone||tags['contact:phone']).replace(/\s/g,'')}" style="color:var(--pink)">${tags.phone||tags['contact:phone']}</a>`);
    if(tags.website||tags['contact:website'])lines.push(`🌐 <a href="${tags.website||tags['contact:website']}" target="_blank" style="color:var(--pink)">Sitio web</a>`);
    if(tags['contact:instagram']||tags['social:instagram'])lines.push(`📸 <a href="https://instagram.com/${(tags['contact:instagram']||tags['social:instagram']).replace('@','')}" target="_blank" style="color:var(--pink)">Instagram</a>`);
    if(tags['contact:facebook']||tags['social:facebook'])lines.push(`👍 <a href="${tags['contact:facebook']||tags['social:facebook']}" target="_blank" style="color:var(--pink)">Facebook</a>`);
    if(!lines.length)return;
    // Store social links in placeData
    const key=infoId==='sheetPlaceInfo'?'sheet':'edit';
    if(placeData[key]){
      placeData[key].website=tags.website||tags['contact:website']||null;
      placeData[key].instagram=tags['contact:instagram']||tags['social:instagram']||null;
      placeData[key].phone=tags.phone||tags['contact:phone']||null;
      placeData[key].hours=tags.opening_hours||null;
    }
    infoEl.innerHTML=lines.join('<br>');
    infoEl.style.display='block';
  }catch(e){/* silently fail */}
}

function hideSug(sugId){setTimeout(()=>{const s=document.getElementById(sugId);if(s)s.style.display='none';},400);}

function getLocationStr(key){
  // Get values from fields
  const inputId=key==='sheet'?'sheetLocation':key==='edit'?'editLocation':'cumpleEventLocation';
  const mapsId=key==='sheet'?'sheetMapsLink':key==='edit'?'editMapsLink':'cumpleMapsLink';
  const webId=key==='sheet'?'sheetWebLink':key==='edit'?'editWebLink':'cumpleWebLink';
  const name=(document.getElementById(inputId)?.value||'').trim();
  const mapsLink=(document.getElementById(mapsId)?.value||'').trim();
  const webLink=(document.getElementById(webId)?.value||'').trim();

  // Start from placeData if available (has coords from autocomplete)
  const obj=placeData[key]?{...placeData[key]}:{name,lat:null,lon:null};

  // Override name if user typed something
  if(name&&!obj.name)obj.name=name;

  // Add links if provided
  if(mapsLink)obj.mapsLink=mapsLink;
  if(webLink)obj.website=webLink;

  // If absolutely nothing useful — return null (location is optional)
  if(!obj.name&&!obj.mapsLink&&!obj.website&&!obj.lat&&!obj.lon)return null;

  return JSON.stringify(obj);
}

function parseLocationFull(raw){
  if(!raw)return{loc:null,lat:null,lon:null,guest:null,locName:null,website:null,instagram:null,phone:null,hours:null,mapsLink:null};
  // Strip cancelled: prefix if present
  const cleaned=raw.startsWith('cancelled:')?raw.slice(10):raw;
  const parts=cleaned.split('||');
  const locPart=parts[0]||null;
  const guest=parts[1]||null;
  if(!locPart)return{loc:null,lat:null,lon:null,guest,locName:null,website:null,instagram:null,phone:null,hours:null,mapsLink:null};
  try{
    const obj=JSON.parse(locPart);
    return{loc:locPart,lat:obj.lat,lon:obj.lon,locName:obj.name||null,guest,website:obj.website||null,instagram:obj.instagram||null,phone:obj.phone||null,hours:obj.hours||null,mapsLink:obj.mapsLink||null};
  }catch{
    return{loc:locPart,lat:null,lon:null,locName:locPart,guest,website:null,instagram:null,phone:null,hours:null,mapsLink:null};
  }
}

function mapsUrl(lat,lon,name){
  if(lat&&lon)return `https://maps.google.com/?q=${lat},${lon}`;
  if(name)return `https://maps.google.com/?q=${encodeURIComponent(name)}`;
  return null;
}

// Invite system
let inviteData=null;

function checkInviteParams(){
  const params=new URLSearchParams(window.location.search);
  if(!params.get('invite')&&!params.get('cal'))return false;
  inviteData={
    cat:params.get('invite')||'eventos',
    text:params.get('txt')||'',
    date:params.get('date')||null,
    location:params.get('loc')||null,
    mapsLink:params.get('maps')||null,
    from:params.get('de')||'Alguien',
    calOnly:params.get('cal')==='1'
  };
  return true;
}

function showInviteScreen(){
  if(!inviteData)return;
  const{cat,text,date,location,mapsLink,from,calOnly}=inviteData;
  // Build a proper location JSON for the fakeItem
  const locObj=location||mapsLink?JSON.stringify({name:location||'',lat:null,lon:null,mapsLink:mapsLink||null}):null;
  if(calOnly&&date){
    const fakeItem={id:'invite',text,date,location:locObj};
    setTimeout(()=>addToCalendar(fakeItem,cat),500);
  }
  const icons={ejercicio:'🏃',eventos:'📅',citas:'🤝',peliculas:'🎬',libros:'📚',compras:'🛒',salud:'💊',cumples:'🎂',recordatorios:'🔔',ideas:'💡',bts:'💜',cultura:'✨'};
  document.getElementById('inviteIcon').textContent=icons[cat]||'✨';
  document.getElementById('inviteTitle').textContent=text;
  document.getElementById('inviteFrom').textContent=`${from} te invitó a un plan`;
  let meta='';
  if(date)meta+=`📅 ${fmtDate(date)}${date.includes('T')?', '+fmtTime(date):''}<br>`;
  if(location)meta+=`📍 ${location}`;
  if(mapsLink)meta+=` <a href="${mapsLink}" target="_blank" style="color:var(--pink)">Maps</a>`;
  document.getElementById('inviteMeta').innerHTML=meta||'Sin detalles adicionales';
  if(date)document.getElementById('inviteCalBtn').style.display='block';
  document.getElementById('loadingScreen').style.display='none';
  document.getElementById('inviteScreen').style.display='flex';
}

function addInviteToCalendar(){
  if(!inviteData||!inviteData.date)return;
  const{text,date,location,mapsLink,cat}=inviteData;
  const locObj=location||mapsLink?JSON.stringify({name:location||'',lat:null,lon:null,mapsLink:mapsLink||null}):null;
  addToCalendar({id:'invite',text,date,location:locObj},cat);
}

async function saveInvite(){
  const btn=document.getElementById('inviteSaveBtn');
  btn.textContent='Guardando...';btn.disabled=true;
  if(!user){
    // Save invite data to sessionStorage and redirect to auth
    sessionStorage.setItem('pendingInvite',JSON.stringify(inviteData));
    await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.href}});
    return;
  }
  const{cat,text,date,location}=inviteData;
  await addItem(cat,text,date,location);
  btn.textContent='¡Guardado! ✨';
  setTimeout(()=>{
    document.getElementById('inviteScreen').style.display='none';
    showApp();
  },1000);
}

function dismissInvite(){
  document.getElementById('inviteScreen').style.display='none';
  if(user)showApp();else showAuth();
}

function buildInviteLink(item,c,from){
  // Clean location: strip @@cumpleId suffix, parse JSON to get name
  const rawLoc=item.location?item.location.split('@@')[0]:'';
  const{locName,lat,lon,mapsLink}=parseLocationFull(rawLoc||null);
  const finalMapLink=mapsLink||mapsUrl(lat,lon,locName);
  const locParam=locName?`&loc=${encodeURIComponent(locName)}`:'';
  const mapsParam=finalMapLink?`&maps=${encodeURIComponent(finalMapLink)}`:'';
  const dateParam=item.date?`&date=${encodeURIComponent(item.date)}`:'';
  const fromParam=from?`&de=${encodeURIComponent(from)}`:'';
  return `https://kami-kohl.vercel.app?invite=${c}&txt=${encodeURIComponent(item.text)}${dateParam}${locParam}${mapsParam}${fromParam}`;
}

async function init(){
  const safetyTimer=setTimeout(()=>{
    if(document.getElementById('loadingScreen').style.display!=='none'){
      if(checkInviteParams())showInviteScreen();
      else showAuth();
    }
  },5000);

  try{
    // Check for pending invite from sessionStorage after OAuth redirect
    const pending=sessionStorage.getItem('pendingInvite');
    if(pending){
      inviteData=JSON.parse(pending);
      sessionStorage.removeItem('pendingInvite');
    } else {
      checkInviteParams();
    }

    const{data:{session}}=await sb.auth.getSession();
    clearTimeout(safetyTimer);

    if(session){
      user=session.user;
      if(inviteData){
        // Auto-save pending invite
        await loadItems();
        await addItem(inviteData.cat,inviteData.text,inviteData.date,inviteData.location);
        inviteData=null;
        // Clean URL
        window.history.replaceState({},'','/');
        await showApp();
      } else {
        await showApp();
      }
    } else {
      if(inviteData)showInviteScreen();
      else showAuth();
    }
  }catch(e){
    clearTimeout(safetyTimer);
    showAuth();
  }

  sb.auth.onAuthStateChange(async(_,s)=>{
    if(s?.user){user=s.user;await showApp();}
    else{user=null;showAuth();}
  });
}

async function signInGoogle(){
  const btn=document.getElementById('authBtn');
  btn.textContent='Conectando...';btn.disabled=true;
  const{error}=await sb.auth.signInWithOAuth({
    provider:'google',
    options:{redirectTo:'https://kami-kohl.vercel.app/'}
  });
  if(error){alert('Error: '+error.message);btn.innerHTML='<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg> Continuar con Google';btn.disabled=false;}
}

function showAuth(){
  document.getElementById('loadingScreen').style.display='none';
  document.getElementById('authScreen').style.display='flex';
  document.getElementById('sentScreen').style.display='none';
  document.getElementById('appShell').classList.remove('visible');
}

function showSent(email){
  const el=document.getElementById('sentEmail');
  if(el)el.textContent=email;
  document.getElementById('authScreen').style.display='none';
  document.getElementById('sentScreen').style.display='flex';
}

function backToAuth(){
  document.getElementById('sentScreen').style.display='none';
  document.getElementById('authScreen').style.display='flex';
}

async function showApp(){
  document.getElementById('loadingScreen').style.display='none';
  document.getElementById('authScreen').style.display='none';
  document.getElementById('sentScreen').style.display='none';
  document.getElementById('appShell').classList.add('visible');
  const d=new Date();
  const days=['dom','lun','mar','mié','jue','vie','sáb'];
  const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  document.getElementById('dateChip').textContent=`${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  const name=user.user_metadata?.full_name||user.email||'';
  const photo=user.user_metadata?.avatar_url;
  document.getElementById('menuEmail').textContent=name;
  const av=document.getElementById('userAvatar');
  if(photo){av.innerHTML='<img src="'+photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';}
  else{av.textContent=name.charAt(0).toUpperCase();}
  await loadItems();renderNavTabs();render();
}

async function sendMagicLink(){}

async function signOut(){await sb.auth.signOut();toggleUserMenu();}

async function loadItems(){
  if(!user)return;
  const{data,error}=await sb.from('items').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error){console.error(error);return;}
  const cats=['compras','eventos','peliculas','libros','citas','salud','cumples','ejercicio','recordatorios','ideas','cultura','bts'];
  items={};cats.forEach(c=>items[c]=[]);
  (data||[]).forEach(item=>{if(items[item.category])items[item.category].push(item);});
}

async function addItem(category,text,date,location){
  const{data,error}=await sb.from('items').insert([{user_id:user.id,category,text,date:date||null,location:location||null,done:false}]).select().single();
  if(error){console.error('addItem error:',error);throw error;}
  if(!items[category])items[category]=[];
  items[category].unshift(data);
  return data;
}

async function toggleItemDB(id,category,done){
  await sb.from('items').update({done:!done}).eq('id',id).eq('user_id',user.id);
  const item=(items[category]||[]).find(i=>i.id===id);
  if(item)item.done=!done;
}
async function toggleItem(id,c,done){await toggleItemDB(id,c,done);render();}
async function deleteItem(id,c){await deleteItemDB(id,c);render();}

async function deleteItemDB(id,category){
  await sb.from('items').delete().eq('id',id).eq('user_id',user.id);
  if(items[category])items[category]=items[category].filter(i=>i.id!==id);
}

function render(){
  document.getElementById('mainContent').innerHTML=view==='hoy'?renderHoy():renderList(view);
}

let calExpanded=true;
let selectedCalDate=null;
let calMonth=null; // {y,m} — null = mes actual

function calNav(dir){
  const now=new Date();
  const base=calMonth||{y:now.getFullYear(),m:now.getMonth()};
  let nm=base.m+dir,ny=base.y;
  if(nm>11){nm=0;ny++;}
  if(nm<0){nm=11;ny--;}
  calMonth={y:ny,m:nm};
  selectedCalDate=null;
  render();
}

function renderMiniCal(today){
  const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const days=['L','M','M','J','V','S','D'];
  const y=calMonth?calMonth.y:today.getFullYear();
  const m=calMonth?calMonth.m:today.getMonth();
  const isCurrentMonth=today.getFullYear()===y&&today.getMonth()===m;
  const first=new Date(y,m,1);
  const last=new Date(y,m+1,0);
  const startDay=(first.getDay()+6)%7;
  const todayD=isCurrentMonth?today.getDate():-1;

  // Collect event dates with colors
  const eventDates=new Map();
  Object.entries(items).forEach(([c,arr])=>{
    const color=COLORS[c]||'#888';
    arr.forEach(item=>{
      if(!item.date||item.done)return;
      let dd=null;
      if(c==='cumples'){
        const[mm,d]=item.date.slice(5).split('-');
        if(parseInt(mm)-1===m)dd=parseInt(d);
      } else {
        const d=parseLocalDate(item.date);
        if(d.getFullYear()===y&&d.getMonth()===m)dd=d.getDate();
      }
      if(dd){
        if(!eventDates.has(dd))eventDates.set(dd,[]);
        if(!eventDates.get(dd).includes(color))eventDates.get(dd).push(color);
      }
    });
  });

  const navBtn=`style="font-size:15px;padding:0 6px;background:none;border:none;color:var(--text2);cursor:pointer;font-family:'DM Sans',sans-serif"`;
  if(!calExpanded){
    return `<div class="mini-cal"><div class="mini-cal-header">
      <button ${navBtn} onclick="calNav(-1)">◀</button>
      <span class="mini-cal-title" style="flex:1;text-align:center">📅 ${months[m]} ${y}</span>
      <button ${navBtn} onclick="calNav(1)">▶</button>
      <button class="mini-cal-toggle" onclick="calExpanded=true;render()" style="margin-left:6px">Ver ▾</button>
    </div></div>`;
  }

  let grid=`<div class="mini-cal-grid">${days.map(d=>`<div class="mini-cal-day-label">${d}</div>`).join('')}`;
  for(let i=0;i<startDay;i++) grid+=`<div></div>`;
  for(let d=1;d<=last.getDate();d++){
    const isToday=d===todayD;
    const colors=eventDates.get(d)||[];
    const dStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isSelected=selectedCalDate===dStr;
    const dots=colors.length?`<div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);display:flex;gap:1px">${colors.slice(0,3).map(col=>`<div style="width:4px;height:4px;border-radius:50%;background:${isToday?'white':col}"></div>`).join('')}</div>`:'';
    grid+=`<div class="mini-cal-day${isToday?' today':''}${isSelected&&!isToday?' selected':''}" onclick="jumpToDate(${y},${m+1},${d})" style="position:relative;${isSelected&&!isToday?'background:var(--bg2);font-weight:600':''}">${d}${dots}</div>`;
  }
  grid+=`</div>`;

  // Selected date items
  let selectedHtml='';
  if(selectedCalDate){
    const mmdd=selectedCalDate.slice(5);
    const selItems=[];
    Object.entries(items).forEach(([c,arr])=>{
      arr.forEach(item=>{
        if(!item.date||item.done)return;
        const match=c==='cumples'?item.date.slice(5)===mmdd:item.date.startsWith(selectedCalDate);
        if(match)selItems.push({...item,cat:c});
      });
    });
    if(selItems.length){
      const months2=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
      const[sy,sm,sd]=selectedCalDate.split('-');
      const label=`${parseInt(sd)} ${months2[parseInt(sm)-1]} ${sy}`;
      selectedHtml=`<div style="margin-top:10px;border-top:0.5px solid var(--border);padding-top:10px">
        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:8px">📋 ${label} — ${selItems.length} evento${selItems.length!==1?'s':''}</div>
        ${selItems.map(item=>{
          const c=item.cat;
          const color=COLORS[c]||'#888';
          const label2=LABELS[c]||c;
          const t=item.date&&item.date.includes('T')?fmtTime(item.date):'';
          const rawLoc=item.location?item.location.split('@@')[0].split('||')[0]:'';
          const{locName}=parseLocationFull(rawLoc||null);
          return `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:0.5px solid var(--border);cursor:pointer" onclick="switchViewTo('${c}')">
            <div style="width:3px;border-radius:3px;background:${color};flex-shrink:0;align-self:stretch"></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:500;color:var(--text)">${item.text}</div>
              <div style="display:flex;gap:8px;margin-top:3px;flex-wrap:wrap">
                ${t?`<span style="font-size:11px;color:var(--text3)">🕐 ${t}</span>`:''}
                ${locName?`<span style="font-size:11px;color:var(--text3)">📍 ${locName}</span>`:''}
                <span style="font-size:10px;background:${color}22;color:${color};padding:1px 6px;border-radius:20px">${label2}</span>
              </div>
            </div>
            <div style="font-size:10px;color:var(--text3);align-self:center">›</div>
          </div>`;
        }).join('')}
      </div>`;
    } else {
      selectedHtml=`<div style="margin-top:8px;font-size:11px;color:var(--text3);text-align:center;padding-top:6px;border-top:0.5px solid var(--border)">Sin eventos ese día</div>`;
    }
  }

  return `<div class="mini-cal">
    <div class="mini-cal-header">
      <button ${navBtn} onclick="calNav(-1)">◀</button>
      <span class="mini-cal-title" style="flex:1;text-align:center">📅 ${months[m]} ${y}${isCurrentMonth?' · hoy':''}</span>
      <button ${navBtn} onclick="calNav(1)">▶</button>
      <button class="mini-cal-toggle" onclick="calExpanded=false;render()" style="margin-left:6px">Ocultar ▴</button>
    </div>
    ${grid}
    ${selectedHtml}
  </div>`;}
function jumpToDate(y,m,d){
  // m is already 1-indexed (passed as m+1 from renderMiniCal onclick)
  const dateStr=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  selectedCalDate=dateStr;
  render();
}

function renderHoy(){
  const today=new Date();
  const ts=today.toISOString().split('T')[0];
  const tom=new Date(today);tom.setDate(tom.getDate()+1);
  const toms=tom.toISOString().split('T')[0];
  // For birthdays compare only MM-DD (recurring every year)
  const tomsMMDD=toms.slice(5); // "MM-DD"
  const tsMMDD=ts.slice(5);
  let todayItems=[];
  Object.entries(items).forEach(([c,arr])=>{
    arr.forEach(item=>{
      if(!item.date||item.done)return;
      // Birthdays match by MM-DD only
      if(c==='cumples'){
        if(item.date.slice(5)===tsMMDD)todayItems.push({...item,cat:c});
      } else {
        if(item.date.startsWith(ts))todayItems.push({...item,cat:c});
      }
    });
  });
  const cumplesTom=(items.cumples||[]).filter(c=>c.date&&c.date.slice(5)===tomsMMDD);
  let h=`<div><div class="today-banner"><div><h2>Hola 👋</h2><p>${todayItems.length} evento${todayItems.length!==1?'s':''} para hoy</p></div><div class="today-num">${todayItems.length||'0'}</div></div>
  <button class="daily-btn" onclick="sendDailySummary()">📋 Enviarme mi día por WhatsApp</button>
  </div>`;
  h+=renderMiniCal(today);
  if(todayItems.length){
    h+=`<div><div class="slabel">para hoy</div>`;
    todayItems.forEach(item=>{
      const c=item.cat;
      const isRelease=c==='bts'||c==='cultura';
      const color=COLORS[c]||'#888';
      const badge=BADGES[c]||'bgr';
      const t=item.date&&item.date.includes('T')?fmtTime(item.date):'';
      if(isRelease){
        const{subtype,link,note}=parseRelease(item.location);
        const typeLabel=getSubtypeLabel(c,subtype);
        const noteStr=note?` · 💬 ${note}`:'';
        const isBts=c==='bts';
        h+=`<div class="reminder-item" style="${isBts?'border-color:rgba(155,142,196,0.3);background:rgba(155,142,196,0.05)':''}">
          <div class="r-accent" style="background:${color}"></div>
          <div class="r-info">
            <div class="r-title">${item.text}</div>
            <div class="r-meta">${t?t+' · ':''}${typeLabel}${noteStr}</div>
          </div>
          ${link?`<a href="${link}" target="_blank" style="font-size:10px;color:${isBts?'#9B8EC4':'var(--pink)'};text-decoration:none;flex-shrink:0;margin-right:4px">🔗</a>`:''}
          <div class="r-badge ${badge}">${LABELS[c]}</div>
        </div>`;
      } else {
        const{locName,lat,lon}=parseLocationFull(item.location?item.location.split('||')[0]:null);
        const loc=locName?` · ${locName}`:'';
        const mapLink=mapsUrl(lat,lon,locName);
        const ml=mapLink?`<a href="${mapLink}" target="_blank" style="font-size:10px;color:var(--pink);text-decoration:none;flex-shrink:0;margin-right:4px">📍</a>`:'';
        h+=`<div class="reminder-item"><div class="r-accent" style="background:${color}"></div><div class="r-info"><div class="r-title">${item.text}</div><div class="r-meta">${t}${loc||(!t?LABELS[c]:'')}</div></div>${ml}<div class="r-badge ${badge}">${LABELS[c]}</div></div>`;
      }
    });
    h+=`</div>`;
  }
  const pc=(items.compras||[]).filter(i=>!i.done);
  const pcu=(items.cultura||[]).filter(i=>!i.done);
  h+=`<div><div class="slabel">resumen rápido</div><div class="quick-grid">
<div class="qcard" onclick="switchViewTo('compras')"><div class="qc-head"><span class="qc-label">Compras</span><span class="qc-count">${pc.length}</span></div>${pc.slice(0,3).map(i=>`<div class="qc-row"><div class="minicheck"></div>${i.text}</div>`).join('')||'<div style="font-size:11px;color:var(--text3)">Sin pendientes ✓</div>'}</div>
<div class="qcard" onclick="switchViewTo('cultura')"><div class="qc-head"><span class="qc-label">Cultura</span><span class="qc-count">${pcu.length}</span></div>${pcu.slice(0,3).map(i=>`<div class="qc-row"><div class="minicheck"></div>${i.text}</div>`).join('')||'<div style="font-size:11px;color:var(--text3)">Sin pendientes ✓</div>'}</div>
</div></div>`;
  if(cumplesTom.length){
    h+=`<div><div class="slabel">mañana — cumpleaños</div>`;
    cumplesTom.forEach(c=>{
      const firstName=c.text.split(' ')[0];
      const msg=`Hola ${firstName}!! Feliz cumpleaños, espero que la pases increíble hoy 🥳🎂✨`;
      // Find linked events for this person
      const linkedEvents=[];
      ['eventos','citas'].forEach(cat=>{
        (items[cat]||[]).forEach(ev=>{
          const{cumpleId}=parseItemText(ev.text);
          if(cumpleId===c.id)linkedEvents.push({...ev,cat});
        });
      });
      const linkedHtml=linkedEvents.length?`<div style="margin:8px 0 6px;padding:8px 10px;background:rgba(216,90,48,0.07);border-radius:8px;border-left:2px solid #d85a30">
        ${linkedEvents.map(ev=>{
          const{text}=parseItemText(ev.text);
          const t=ev.date&&ev.date.includes('T')?fmtTime(ev.date):'';
          const{locName}=parseLocationFull(ev.location?ev.location.split('||')[0]:null);
          return `<div style="font-size:11px;color:var(--text2);margin-bottom:3px">🎉 <b>${text}</b>${t?' — '+t:''}${locName?' · '+locName:''}</div>`;
        }).join('')}
      </div>`:'';
      h+=`<div class="wa-card"><div class="wa-head"><div class="wa-icon">🎂</div><div><div class="wa-name">Cumple de ${c.text}</div><div class="wa-sub">draft listo</div></div></div>${linkedHtml}<div class="wa-bubble">${msg}</div><div class="wa-actions"><button class="wa-btn send" onclick="sendWAEncoded('${encodeURIComponent(msg)}')">Enviar por WhatsApp</button></div></div>`;
    });
    h+=`</div>`;
  }
  return h;
}

function parseRelease(raw){
  if(!raw||!raw.startsWith('~~'))return{subtype:null,link:null,note:null};
  const parts=raw.split('~~');
  return{subtype:parts[1]||null,link:parts[2]||null,note:parts[3]||null};
}

function getSubtypeLabel(c,key){
  const types=c==='bts'?BTS_TYPES:CULTURA_TYPES;
  return(types.find(t=>t.key===key)||{label:key||'Release'}).label;
}

function renderReleaseCard(item,c){
  const{subtype,link,note}=parseRelease(item.location);
  const isBts=c==='bts';
  const typeLabel=getSubtypeLabel(c,subtype);
  const dateStr=item.date?fmtDate(item.date):'';
  const timeStr=item.date&&item.date.includes('T')?fmtTime(item.date):'';
  const fechaHora=[dateStr,timeStr].filter(Boolean).join(', ');
  const userName=user?.user_metadata?.full_name||user?.email||'';
  const inviteLink=buildInviteLink(item,c,userName);

  // Mensaje completo con fecha, hora, nota y link
  const partes=[
    `${isBts?'💜':'✨'} *${item.text}*`,
    fechaHora?`📅 ${fechaHora}`:'',
    note?`💬 ${note}`:'',
    link?`🔗 ${link}`:'',
    `\n¿Lo guardamos en Kami? 👉 ${inviteLink}`
  ].filter(Boolean).join('\n');
  const waMsg=partes.trim();
  if(isBts){
    const emoji=typeLabel.split(' ')[0];
    const typeName=typeLabel.split(' ').slice(1).join(' ');
    return `<div class="bts-card">
      <div class="bts-header">
        <div style="font-size:20px">${emoji}</div>
        <div class="bts-title">${item.text}</div>
        <div class="bts-type-badge">${typeName}</div>
        <button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')">✏️</button>
        <button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button>
      </div>
      ${fechaHora?`<div class="bts-meta">📅 ${fechaHora}</div>`:''}
      ${note?`<div class="bts-note">💜 ${note}</div>`:''}
      <div class="bts-actions">
        ${link?`<button class="bts-btn primary" onclick="window.open('${link}','_blank')">🎧 Abrir link</button>`:''}
        ${item.date?`<button class="bts-btn" onclick="addToCalendarById('${item.id}','${c}')">📅 Calendario</button>`:''}
        <button class="bts-btn" onclick="copyInvite('${encodeURIComponent(inviteLink)}')">🔗 Invitar</button>
        <button class="bts-btn" onclick="openInviteCard('${item.id}','${c}')">🎨 Tarjeta</button>
        <button class="bts-btn wa" onclick="sendWAEncoded('${encodeURIComponent(waMsg)}')">WhatsApp</button>
      </div>
    </div>`;
  }
  const icons={musica:'🎵',serie:'🎬',libro:'📚',juego:'🎮'};
  const icon=icons[subtype]||'✨';
  return `<div class="release-card">
    <div class="release-header">
      <div class="release-icon">${icon}</div>
      <div style="flex:1"><div class="release-title">${item.text}</div><div class="release-type">${typeLabel}</div></div>
      <button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')">✏️</button>
      <button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button>
    </div>
    ${fechaHora?`<div class="release-meta">📅 ${fechaHora}</div>`:''}
    ${note?`<div class="release-note">💬 ${note}</div>`:''}
    <div class="release-actions">
      ${link?`<button class="release-btn link" onclick="window.open('${link}','_blank')">🔗 Abrir</button>`:''}
      ${item.date?`<button class="release-btn" onclick="addToCalendarById('${item.id}','${c}')">📅 Cal</button>`:''}
      <button class="release-btn" onclick="copyInvite('${encodeURIComponent(inviteLink)}')">📤 Invitar</button>
      <button class="release-btn" onclick="openInviteCard('${item.id}','${c}')">🎨</button>
      <button class="release-btn wa" onclick="sendWAEncoded('${encodeURIComponent(waMsg)}')">WhatsApp 💚</button>
    </div>
  </div>`;
}

function nextBirthdayDate(dateStr){
  if(!dateStr)return null;
  const today=new Date();
  const mmdd=dateStr.slice(5); // MM-DD
  const thisYear=new Date(`${today.getFullYear()}-${mmdd}`);
  if(thisYear>=today)return thisYear;
  return new Date(`${today.getFullYear()+1}-${mmdd}`);
}

function daysUntil(d){
  const today=new Date();today.setHours(0,0,0,0);
  const diff=d-today;
  return Math.round(diff/(1000*60*60*24));
}

function renderList(c){
  let arr=items[c]||[];
  const isRelease=c==='cultura'||c==='bts';
  const showPlan=c==='peliculas'||c==='libros';
  let h=`<div>`;

  // Eventos: filter chips + view switcher
  if(c==='eventos'&&arr.length){
    const vBtn=(v,icon)=>`<button onclick="eventoView='${v}';render()" style="padding:4px 9px;border-radius:6px;border:0.5px solid var(--border2);background:${eventoView===v?'var(--text)':'var(--bg2)'};color:${eventoView===v?'var(--bg)':'var(--text2)'};cursor:pointer;font-size:12px;font-family:inherit">${icon}</button>`;
    h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div class="subtype-scroll" style="flex:1">
        <button class="subtype-chip${!eventoFilter?' sel':''}" onclick="eventoFilter=null;render()" style="color:#ba7517;border-color:rgba(186,117,23,0.3)">Todos</button>
        ${EVENTO_TYPES.map(t=>`<button class="subtype-chip${eventoFilter===t.key?' sel':''}" onclick="eventoFilter='${t.key}';render()" style="color:#ba7517;border-color:rgba(186,117,23,0.3)">${t.label}</button>`).join('')}
      </div>
      <div style="display:flex;gap:3px;flex-shrink:0">${vBtn('list','☰')}${vBtn('timeline','↕')}${vBtn('cards','⊟')}</div>
    </div>`;
    if(eventoFilter) arr=arr.filter(item=>{const{evtype}=parseEventoMeta(item.location||'');return evtype===eventoFilter;});
  }

  if(!arr.length)h+=`<div class="empty"><div style="font-size:28px">${c==='bts'?'💜':'✦'}</div><p>${eventoFilter?'Sin eventos de este tipo.':'Nada aquí todavía.'}<br>${eventoFilter?'':'Toca + para agregar.'}</p></div>`;
  else if(c==='cumples'){
    const sorted=[...arr].sort((a,b)=>{
      const da=nextBirthdayDate(a.date),db=nextBirthdayDate(b.date);
      if(!da&&!db)return 0;if(!da)return 1;if(!db)return -1;return da-db;
    });
    h+=sorted.map(item=>{
      const next=nextBirthdayDate(item.date);
      const days=next?daysUntil(next):null;
      const daysLabel=days===0?'🎂 Hoy!':days===1?'🎂 Mañana!':`en ${days} días`;
      const mmdd=item.date?item.date.slice(5):'';
      const[mm,dd]=mmdd.split('-');
      const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
      const dateLabel=mm&&dd?`${parseInt(dd)} ${months[parseInt(mm)-1]}`:'';
      const linkedEvents=(items.eventos||[]).filter(ev=>ev.location&&ev.location.includes('@@'+item.id));
      const linkedHtml=linkedEvents.length?`<div style="margin-top:6px">${linkedEvents.map(ev=>{
        const locRaw=ev.location?ev.location.split('@@')[0]:'';
        const{locName}=parseLocationFull(locRaw||null);
        const t=ev.date&&ev.date.includes('T')?fmtTime(ev.date):'';
        return `<div style="font-size:11px;color:#ba7517;padding:5px 8px;background:#faeeda;border-radius:6px;margin-bottom:4px">🎉 <b>${ev.text}</b>${t?' · '+t:''}${locName?' · '+locName:''}</div>`;
      }).join('')}</div>`:'';
      return `<div class="list-item" style="flex-direction:column;align-items:stretch;gap:4px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:#faece7;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🎂</div>
          <div style="flex:1;min-width:0">
            <div class="ltext">${item.text}</div>
            <div class="lmeta">${dateLabel}${days!==null?' · '+daysLabel:''}</div>
          </div>
          <button class="plan-btn" onclick="openCumpleEvent('${item.id}','${item.text}')" style="color:#d85a30;border-color:#d85a30;background:#faece7">+ Plan</button>
          <button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')">✏️</button>
          <button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button>
        </div>
        ${linkedHtml}
      </div>`;
    }).join('');
  } else if(c==='recordatorios'){
    // To-Do: split by type — checklist items vs notes
    const pending=arr.filter(i=>!i.done);
    const done=arr.filter(i=>i.done);
    const renderTodo=(item,active)=>{
      const isNote=item.location&&item.location.startsWith('note:');
      const noteText=isNote?item.location.slice(5):'';
      const ds=item.date?`<div class="lmeta" style="${!active&&item.date<new Date().toISOString().split('T')[0]?'color:#e24b4a':''}">${fmtDate(item.date)}</div>`:'';
      if(isNote){
        return `<div class="list-item" style="flex-direction:column;align-items:stretch;border-left:3px solid #534ab7">
          <div style="display:flex;align-items:center;gap:8px">
            <div class="lcheck ${item.done?'done':''}" onclick="toggleItem('${item.id}','${c}',${item.done})"></div>
            <div style="flex:1"><div class="ltext ${item.done?'done':''}">${item.text}</div>${ds}</div>
            <button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')">✏️</button>
            <button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button>
          </div>
          ${noteText?`<div style="margin:6px 0 2px 28px;font-size:12px;color:var(--text2);white-space:pre-wrap;background:var(--bg2);padding:8px;border-radius:8px">${noteText}</div>`:''}
        </div>`;
      }
      return `<div class="list-item">
        <div class="lcheck ${item.done?'done':''}" onclick="toggleItem('${item.id}','${c}',${item.done})"></div>
        <div style="flex:1;min-width:0"><div class="ltext ${item.done?'done':''}">${item.text}</div>${ds}</div>
        <button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')">✏️</button>
        <button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button>
      </div>`;
    };
    if(pending.length)h+=`<div>${pending.map(i=>renderTodo(i,true)).join('')}</div>`;
    if(done.length)h+=`<div><div class="slabel">completados ✓</div>${done.map(i=>renderTodo(i,false)).join('')}</div>`;
  } else if(isRelease){
    const pending=arr.filter(i=>!i.done);
    const done=arr.filter(i=>i.done);
    if(pending.length)h+=pending.map(i=>renderReleaseCard(i,c)).join('');
    if(done.length)h+=`<div><div class="slabel">visto / escuchado ✓</div>${done.map(i=>renderReleaseCard(i,c)).join('')}</div>`;
  } else if(c==='eventos'&&eventoView!=='list'){
    const sorted=[...arr].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    const pending=sorted.filter(i=>!i.done);
    const done=sorted.filter(i=>i.done);
    if(eventoView==='timeline'){
      h+=`<div style="border-left:2px solid var(--border2);margin-left:12px">`;
      h+=pending.map(item=>{
        const{evtype,guest}=parseEventoMeta(item.location||'');
        const evInfo=EVENTO_TYPES.find(t=>t.key===evtype);
        const rawLoc=item.location?item.location.split('@@')[0]:'';
        const{locName}=parseLocationFull(rawLoc||null);
        const ds=item.date?`${fmtDate(item.date)}${item.date.includes('T')?', '+fmtTime(item.date):''}` : '';
        const todos=getEventoTodos(item.id);
        const doneT=todos.filter(t=>t.done).length;
        return `<div style="display:flex;gap:12px;padding:0 0 20px 20px;position:relative">
          <div style="position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:#ba7517;border:2px solid var(--bg)"></div>
          <div style="flex:1;background:var(--card);border:0.5px solid var(--border);border-radius:var(--radius);padding:10px 14px">
            ${evInfo?`<span style="font-size:10px;background:rgba(186,117,23,0.12);color:#ba7517;padding:2px 7px;border-radius:20px;display:inline-block;margin-bottom:4px">${evInfo.label}</span>`:''}
            <div style="font-size:14px;font-weight:500;color:var(--text)">${item.text}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${[ds,locName,guest?'con '+guest:''].filter(Boolean).join(' · ')}</div>
            ${todos.length?`<div style="font-size:10px;color:var(--text3);margin-top:4px">✅ ${doneT}/${todos.length} tareas</div>`:''}
          </div>
        </div>`;
      }).join('');
      h+=`</div>`;
    } else if(eventoView==='cards'){
      h+=`<div style="display:flex;flex-direction:column;gap:10px">`;
      h+=pending.map(item=>{
        const{evtype,guest}=parseEventoMeta(item.location||'');
        const evInfo=EVENTO_TYPES.find(t=>t.key===evtype);
        const rawLoc=item.location?item.location.split('@@')[0]:'';
        const{locName,mapsLink,lat,lon}=parseLocationFull(rawLoc||null);
        const mapLink=mapsLink||mapsUrl(lat,lon,locName);
        const ds=item.date?`${fmtDate(item.date)}${item.date.includes('T')?', '+fmtTime(item.date):''}` : '';
        const todos=getEventoTodos(item.id);
        const doneT=todos.filter(t=>t.done).length;
        return `<div style="background:var(--card);border:0.5px solid var(--border);border-radius:var(--radius);padding:14px 16px;border-left:3px solid #ba7517">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
              ${evInfo?`<span style="font-size:10px;background:rgba(186,117,23,0.12);color:#ba7517;padding:2px 7px;border-radius:20px;display:inline-block;margin-bottom:6px">${evInfo.label}</span>`:''}
              <div style="font-size:15px;font-weight:500;color:var(--text)">${item.text}</div>
              ${ds?`<div style="font-size:12px;color:var(--text3);margin-top:3px">📅 ${ds}</div>`:''}
              ${locName?`<div style="font-size:12px;color:var(--text3);margin-top:2px">📍 ${mapLink?`<a href="${mapLink}" target="_blank" style="color:var(--pink)">${locName}</a>`:locName}</div>`:''}
              ${guest?`<div style="font-size:12px;color:var(--text3);margin-top:2px">👥 ${guest}</div>`:''}
            </div>
            <div style="display:flex;gap:4px;margin-left:8px">
              <button class="edit-btn" onclick="openEdit(event,'${item.id}','eventos')">✏️</button>
              <button class="del-btn" onclick="deleteItem('${item.id}','eventos')">×</button>
            </div>
          </div>
          ${todos.length?`<div style="margin-top:6px;font-size:11px;color:var(--text3)">✅ ${doneT}/${todos.length} tareas</div>`:''}
        </div>`;
      }).join('');
      h+=`</div>`;
    }
    if(done.length)h+=`<div style="margin-top:12px"><div class="slabel">completados</div>${done.map(i=>renderItem(i,c,false)).join('')}</div>`;
  } else {
    const pending=arr.filter(i=>!i.done);
    const done=arr.filter(i=>i.done);
    if(pending.length)h+=`<div><div class="slabel">pendientes</div>${pending.map(i=>renderItem(i,c,showPlan)).join('')}</div>`;
    if(done.length)h+=`<div><div class="slabel">completados</div>${done.map(i=>renderItem(i,c,false)).join('')}</div>`;
  }
  return h+`</div>`;
}

function parseLocation(raw){
  if(!raw)return{loc:null,guest:null};
  // Strip evtype suffix before splitting on ||
  const noEvtype=raw.replace(/~~evtype:[^|]*/,'');
  const parts=noEvtype.split('||');
  return{loc:parts[0]||null,guest:parts[1]||null};
}

function parseEventoMeta(raw){
  // Extract evtype and guest from location string
  if(!raw)return{evtype:null,guest:null};
  const evtypeMatch=raw.match(/~~evtype:([^|~]+)/);
  const evtype=evtypeMatch?evtypeMatch[1]:null;
  const noEvtype=raw.replace(/~~evtype:[^|]*/,'');
  const guestPart=noEvtype.split('||')[1]||null;
  return{evtype,guest:guestPart};
}

// Evento checklist — stored in localStorage
function getEventoTodos(eventId){try{return JSON.parse(localStorage.getItem('etodos_'+eventId)||'[]');}catch{return[];}}
function saveEventoTodos(eventId,todos){localStorage.setItem('etodos_'+eventId,JSON.stringify(todos));}
function addEventoTodo(eventId){
  const input=document.getElementById('etodo_'+eventId);
  if(!input)return;
  const text=input.value.trim();
  if(!text)return;
  const todos=getEventoTodos(eventId);
  todos.push({id:Date.now().toString(),text,done:false});
  saveEventoTodos(eventId,todos);
  input.value='';
  render();
}
function toggleEventoTodo(eventId,todoId){
  const todos=getEventoTodos(eventId);
  const t=todos.find(t=>t.id===todoId);
  if(t)t.done=!t.done;
  saveEventoTodos(eventId,todos);
  render();
}
function removeEventoTodo(eventId,todoId){
  saveEventoTodos(eventId,getEventoTodos(eventId).filter(t=>t.id!==todoId));
  render();
}

function renderItem(item,c,showPlan){
  // Salud → health tracking card
  if(c==='salud'){
    const{subtype,note}=parseRelease(item.location||'');
    const typeInfo=SALUD_TYPES.find(t=>t.key===subtype)||SALUD_TYPES[0];
    const ds=item.date?`<span style="color:var(--text3)">${fmtDate(item.date)}${item.date.includes('T')?', '+fmtTime(item.date):''}</span>`:'';
    const noteTxt=note?`<div style="font-size:11px;color:var(--text3);margin-top:2px">📝 ${note}</div>`:'';
    const waMsg=`${typeInfo.label} — ${item.text}${item.date?'\n📅 '+fmtDate(item.date)+(item.date.includes('T')?', '+fmtTime(item.date):''):''}${note?'\n📝 '+note:''}\n\n_vía kami 🌸_`;
    return `<div class="list-item" style="border-left:3px solid #e24b4a">
      <div class="lcheck ${item.done?'done':''}" onclick="toggleItem('${item.id}','${c}',${item.done})"></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:10px;background:rgba(226,75,74,0.12);color:#e24b4a;padding:2px 7px;border-radius:20px">${typeInfo.label}</span>
          ${ds}
        </div>
        <div class="ltext ${item.done?'done':''}" style="margin-top:3px">${item.text}</div>
        ${noteTxt}
      </div>
      <button class="wa-btn send" onclick="sendWAEncoded('${encodeURIComponent(waMsg)}')">WhatsApp 💚</button>
      <button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')">✏️</button>
      <button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button>
    </div>`;
  }
  // Ejercicio con invitado → card estilo WhatsApp
  if(c==='ejercicio'&&item.location&&item.location.includes('||')){
    const{loc,guest}=parseLocation(item.location);
    const{locName,lat,lon}=parseLocationFull(loc);
    const ds=item.date?fmtDate(item.date):'';
    const meta=[guest?`Con: ${guest}`:'',ds,locName].filter(Boolean).join(' · ');
    const mapsLink=mapsUrl(lat,lon,locName);
    const userName=user?.user_metadata?.full_name||user?.email||'';
    const inviteLink=buildInviteLink(item,c,userName);
    const timeStr=item.date&&item.date.includes('T')?`📅 ${fmtDate(item.date)}, ${fmtTime(item.date)}`:(item.date?`📅 ${fmtDate(item.date)}`:'');
    const locStr=locName?(mapsLink?`📍 ${locName} → ${mapsLink}`:`📍 ${locName}`):'';
    const msg=`${guest ? `Oye ${guest}!` : 'Oye!'} ¿${item.text}? 💪\n${timeStr}\n${locStr}\n\n¿Te apuntas? Guárdalo en tu Kami 👉 ${inviteLink}`.trim();
    return `<div class="wa-card">
      <div class="wa-head"><div class="wa-icon" style="background:#0f6e56">🏃</div><div><div class="wa-name">${item.text}</div><div class="wa-sub">${meta}</div></div><button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')" style="margin-left:auto">✏️</button><button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button></div>
      <div class="wa-bubble">${msg.replace(/\n/g,'<br>')}</div>
      <div class="wa-actions">
        ${item.date?`<button class="wa-btn" onclick="addToCalendarById('${item.id}','${c}')">📅</button>`:''}
        <button class="wa-btn" onclick="openInviteCard('${item.id}','${c}')">🎨</button>
        <button class="wa-btn kami" onclick="copyInvite('${encodeURIComponent(inviteLink)}')">🔗 Invitar</button>
        <button class="wa-btn send" onclick="sendWAEncoded('${encodeURIComponent(msg)}')">WhatsApp 💚</button>
      </div>
    </div>`;
  }
  // Strip @@cumpleId from location before parsing
  const rawLoc=item.location?item.location.split('@@')[0]:'';
  const cumpleId=item.location&&item.location.includes('@@')?item.location.split('@@')[1]:null;
  const{loc}=parseLocation(rawLoc);
  const{locName,lat,lon,website,phone,hours,mapsLink}=parseLocationFull(loc||rawLoc||null);
  const ds=item.date?`<div class="lmeta">${fmtDate(item.date)}${item.date.includes('T')?', '+fmtTime(item.date):''}</div>`:'';
  const finalMapsLink=mapsLink||mapsUrl(lat,lon,locName);
  // Show name as text, links as clickable buttons — no duplicate
  const ls=locName?`<div class="lmeta">📍 ${locName}${hours?' · 🕐 '+hours:''}</div>`:'';
  const placeLinks=[
    finalMapsLink?`<a href="${finalMapsLink}" target="_blank" style="color:var(--pink);text-decoration:none;font-size:10px">🗺️ Maps</a>`:'',
    website?`<a href="${website.startsWith('http')?website:'https://'+website}" target="_blank" style="color:var(--pink);text-decoration:none;font-size:10px">🌐 Web</a>`:'',
    phone?`<a href="tel:${phone.replace(/\s/g,'')}" style="color:var(--pink);text-decoration:none;font-size:10px">📞</a>`:'',
  ].filter(Boolean);
  const placeRow=placeLinks.length?`<div style="display:flex;gap:8px;margin-top:3px;flex-wrap:wrap">${placeLinks.join('')}</div>`:'';
  // Cumple badge
  const cumplePerson=cumpleId?(items.cumples||[]).find(i=>i.id===cumpleId):null;
  const cumpleBadge=cumplePerson?`<div style="font-size:10px;color:#d85a30;margin-top:3px">🎂 Cumple de ${cumplePerson.text.split(' ')[0]}</div>`:'';
  // Evento type badge and guest
  let eventoBadge='', eventoGuest='';
  if(c==='eventos'){
    const{evtype,guest}=parseEventoMeta(item.location||'');
    const evInfo=EVENTO_TYPES.find(t=>t.key===evtype);
    if(evInfo)eventoBadge=`<span style="font-size:10px;background:rgba(186,117,23,0.12);color:#ba7517;padding:2px 7px;border-radius:20px;margin-top:3px;display:inline-block">${evInfo.label}</span>`;
    if(guest)eventoGuest=`<div style="font-size:11px;color:var(--text3);margin-top:2px">👥 ${guest}</div>`;
  }
  const pb=showPlan&&!item.done?`<button class="plan-btn" onclick="makePlan(event,'${item.id}','${c}')">hacer plan</button>`:'';
  const calBtn=NEED_DATE.includes(c)&&item.date?`<button class="cal-btn" onclick="addToCalendarById('${item.id}','${c}')" title="Calendario">📅</button>`:'';
  const cardBtn=c==='eventos'&&!item.done?`<button class="cal-btn" onclick="openInviteCard('${item.id}','${c}')" title="Tarjeta">🎨</button>`:'';
  const isCancelled=item.location&&item.location.startsWith('cancelled:');
  let waBtns='';
  if(!item.done&&!isCancelled){
    if(c==='eventos'){
      waBtns=`<button class="wa-btn send" onclick="shareItem('${item.id}','${c}','invite')">Invitar 💚</button>`;
    } else if(c==='citas'){
      waBtns=`<button class="wa-btn send" style="background:#555" onclick="shareItem('${item.id}','${c}','notify')">Avisar 💬</button><button class="wa-btn send" onclick="shareItem('${item.id}','${c}','invite')">Invitar 💚</button><button class="wa-btn send" style="background:#c0392b" onclick="cancelCita('${item.id}')">Cancelar cita</button>`;
    }
  }
  const cancelledBadge=isCancelled?`<div style="font-size:10px;color:#c0392b;margin-top:2px;font-weight:500">❌ Cancelada</div>`:'';
  // Checklist for eventos
  let checklistHtml='';
  if(c==='eventos'){
    const todos=getEventoTodos(item.id);
    const doneCount=todos.filter(t=>t.done).length;
    let todoItems='';
    if(todos.length){
      todoItems=`<div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-weight:500">${doneCount}/${todos.length} tareas</div>`;
      todos.forEach(t=>{
        const chkStyle=`width:16px;height:16px;border-radius:4px;border:1.5px solid ${t.done?'#ba7517':'var(--border2)'};background:${t.done?'#ba7517':'transparent'};cursor:pointer;flex-shrink:0`;
        const txtStyle=`font-size:12px;color:var(--text${t.done?'3':'2'});${t.done?'text-decoration:line-through':''}`;
        todoItems+=`<div style="display:flex;align-items:center;gap:8px;padding:3px 0">
          <div onclick="toggleEventoTodo('${item.id}','${t.id}')" style="${chkStyle}"></div>
          <span style="${txtStyle};flex:1">${t.text}</span>
          <button onclick="removeEventoTodo('${item.id}','${t.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;padding:0">×</button>
        </div>`;
      });
    }
    checklistHtml=`<div style="width:100%;padding-left:28px;margin-top:6px">
      ${todoItems}
      <div style="display:flex;gap:6px;margin-top:4px">
        <input id="etodo_${item.id}" class="sheet-input" placeholder="+ vuelo, hotel, outfit..." style="font-size:12px;padding:5px 10px;flex:1" onkeydown="if(event.key==='Enter')addEventoTodo('${item.id}')">
        <button onclick="addEventoTodo('${item.id}')" style="padding:5px 10px;background:var(--bg2);border:0.5px solid var(--border2);border-radius:var(--radius-sm);font-size:13px;cursor:pointer;color:var(--text2)">+</button>
      </div>
    </div>`;
  }
  return `<div class="list-item" style="flex-wrap:wrap${isCancelled?';opacity:0.6':''}">
    <div class="lcheck ${item.done?'done':''}" onclick="toggleItem('${item.id}','${c}',${item.done})"></div>
    <div style="flex:1;min-width:0">
      <div class="ltext ${item.done||isCancelled?'done':''}">${item.text}</div>
      ${ds}${ls}${placeRow}${eventoBadge}${eventoGuest}${cumpleBadge}${cancelledBadge}
    </div>
    <div style="display:flex;align-items:center;gap:4px">
      ${pb}${calBtn}${cardBtn}
      <button class="edit-btn" onclick="openEdit(event,'${item.id}','${c}')" title="Editar">✏️</button>
      <button class="del-btn" onclick="deleteItem('${item.id}','${c}')">×</button>
    </div>
    ${waBtns?`<div style="width:100%;padding-left:28px;margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${waBtns}</div>`:''}
    ${checklistHtml}
  </div>`;
}

const SHARE_CATS=['eventos','citas','ejercicio'];

function shareItem(id,c,mode='invite'){
  const item=(items[c]||[]).find(i=>i.id===id);
  if(!item)return;
  const rawLoc=item.location?item.location.split('@@')[0].split('||')[0]:'';
  const{locName,lat,lon,mapsLink,website}=parseLocationFull(rawLoc||null);
  const finalMapLink=mapsLink||mapsUrl(lat,lon,locName);
  const timeStr=item.date&&item.date.includes('T')?`📅 ${fmtDate(item.date)}, ${fmtTime(item.date)}`:(item.date?`📅 ${fmtDate(item.date)}`:'');
  const inviteLink=buildInviteLink(item,c,user?.user_metadata?.full_name||'');
  const cumpleId=item.location&&item.location.includes('@@')?item.location.split('@@')[1]:null;
  const cumplePerson=cumpleId?(items.cumples||[]).find(i=>i.id===cumpleId):null;
  const calLink=`${inviteLink}&cal=1`;
  let msg='';
  if(mode==='invite'){
    const FRASES=['🎂 Spoiler: habrá pastel','💜 Tu presencia es el mejor regalo','✨ Ven a hacer memoria','🥳 El único plan que no puedes cancelar','💅 Dress code: felicidad y antojo','🎉 Buena vibra requerida, regalo opcional'];
    const emoji={eventos:'🎉',citas:'🤝',ejercicio:'🏃'}[c]||'✨';
    if(cumplePerson){
      msg+=`🎉 *Vamos a celebrar a ${cumplePerson.text.split(' ')[0]}*\n`;
      msg+=`${FRASES[Math.floor(Math.random()*FRASES.length)]}\n`;
    } else {
      msg+=`${emoji} *${item.text}*\n`;
    }
    if(timeStr)msg+=`${timeStr}\n`;
    if(locName&&finalMapLink)msg+=`📍 ${locName} → ${finalMapLink}\n`;
    else if(locName)msg+=`📍 ${locName}\n`;
    else if(finalMapLink)msg+=`📍 ${finalMapLink}\n`;
    if(website)msg+=`🌐 ${website.startsWith('http')?website:'https://'+website}\n`;
    msg+=`\n📲 Agregar a tu calendario → ${calLink}`;
    msg+=`\n💜 Guárdalo en Kami y nunca olvides nada → ${inviteLink}`;
    msg+='\n\n_vía kami 🌸_';
  } else {
    // Notify — simple, just informing someone
    const emoji={salud:'💊',tareas:'✅',ideas:'💡',compras:'🛒',cumples:'🎂',recordatorios:'🔔'}[c]||'📌';
    msg+=`${emoji} *${item.text}*`;
    if(timeStr)msg+=`\n${timeStr}`;
    if(locName&&finalMapLink)msg+=`\n📍 ${locName} → ${finalMapLink}`;
    else if(locName)msg+=`\n📍 ${locName}`;
    if(website)msg+=`\n🌐 ${website.startsWith('http')?website:'https://'+website}`;
    msg+='\n\n_vía kami 🌸_';
  }
  sendWA(msg);
}

function parseItemText(raw){
  if(!raw)return{text:raw||'',cumpleId:null};
  const parts=raw.split('|||');
  return{text:parts[0],cumpleId:parts[1]||null};
}

let cumpleEventForId=null;

function openCumpleEvent(cumpleId,cumpleName){
  cumpleEventForId=cumpleId;
  document.getElementById('cumpleEventTitle').textContent=`🎉 Plan para cumple de ${cumpleName.split(' ')[0]}`;
  document.getElementById('cumpleEventInput').value='';
  document.getElementById('cumpleEventDate').value='';
  document.getElementById('cumpleEventLocation').value='';
  placeData.cumple=null;
  document.getElementById('cumpleEventOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('cumpleEventInput').focus(),350);
}

function closeCumpleEvent(){
  document.getElementById('cumpleEventOverlay').classList.remove('open');
  cumpleEventForId=null;
  placeData.cumple=null;
}

function handleCumpleEventOverlay(e){if(e.target===document.getElementById('cumpleEventOverlay'))closeCumpleEvent();}

async function saveCumpleEvent(){
  const text=document.getElementById('cumpleEventInput').value.trim();
  if(!text){document.getElementById('cumpleEventInput').focus();return;}
  const date=document.getElementById('cumpleEventDate').value||null;
  const locName=document.getElementById('cumpleEventLocation').value.trim();
  const mapsLink=document.getElementById('cumpleMapsLink')?.value.trim()||'';
  const webLink=document.getElementById('cumpleWebLink')?.value.trim()||'';
  let locObj=placeData.cumple||null;
  if(!locObj&&(locName||mapsLink||webLink))locObj={name:locName||'',lat:null,lon:null};
  if(locObj&&mapsLink)locObj.mapsLink=mapsLink;
  if(locObj&&webLink)locObj.website=webLink;
  let location=(locObj&&(locObj.name||locObj.mapsLink||locObj.website))?JSON.stringify(locObj):null;
  if(cumpleEventForId)location=(location||'')+'@@'+cumpleEventForId;
  const btn=document.getElementById('cumpleEventBtn');
  btn.textContent='Guardando...';btn.disabled=true;
  const{data,error}=await sb.from('items').insert([{user_id:user.id,category:'eventos',text,date:date||null,location:location||null,done:false}]).select().single();
  btn.textContent='Guardar';btn.disabled=false;
  if(error){console.error('saveCumpleEvent:',error);alert('Error: '+(error.message||JSON.stringify(error)));return;}
  if(!items['eventos'])items['eventos']=[];
  items['eventos'].unshift(data);
  placeData.cumple=null;
  closeCumpleEvent();
  render();
}

function copyInvite(encodedLink){
  const link=decodeURIComponent(encodedLink);
  navigator.clipboard.writeText(link).then(()=>alert('¡Link copiado! Compártelo con quien quieras 🔗')).catch(()=>alert(link));
}

async function cancelCita(id){
  const item=(items['citas']||[]).find(i=>i.id===id);
  if(!item)return;
  // Build cancellation WhatsApp message
  const timeStr=item.date&&item.date.includes('T')?`📅 ${fmtDate(item.date)}, ${fmtTime(item.date)}`:(item.date?`📅 ${fmtDate(item.date)}`:'');
  const rawLoc=item.location?item.location.split('||')[0]:'';
  const{locName}=parseLocationFull(rawLoc||null);
  const locStr=locName?`📍 ${locName}`:'';
  const msg=`Hola, tuve que cancelar:\n❌ *${item.text}*\n${timeStr}${locStr?'\n'+locStr:''}\n\nDisculpa los inconvenientes 🙏\n\n_vía kami 🌸_`;
  // Save cancelled state
  const newLocation='cancelled:'+(item.location||'');
  const{error}=await sb.from('items').update({location:newLocation}).eq('id',id).eq('user_id',user.id);
  if(error){alert('Error al cancelar: '+error.message);return;}
  item.location=newLocation;
  render();
  // Open WhatsApp with cancellation message
  sendWA(msg);
}

let editingId=null,editingCat=null;

function openEdit(e,id,c){
  e.stopPropagation();
  const item=(items[c]||[]).find(i=>i.id===id);
  if(!item)return;
  editingId=id;editingCat=c;
  document.getElementById('editInput').value=item.text;
  const needDate=NEED_DATE.includes(c);
  const needLoc=NEED_LOC.includes(c);
  document.getElementById('editDateWrap').style.display=needDate?'block':'none';
  document.getElementById('editLocationWrap').style.display=needLoc?'block':'none';
  document.getElementById('editGuestWrap').style.display=(c==='ejercicio'||c==='eventos')?'block':'none';
  if(needDate){
    const isCumple=c==='cumples';
    document.getElementById('editDate').style.display=isCumple?'none':'block';
    document.getElementById('editDateSimple').style.display=isCumple?'block':'none';
    document.getElementById('editDateLabel').textContent=isCumple?'Fecha de cumpleaños':'Fecha y hora';
    if(item.date){
      if(isCumple)document.getElementById('editDateSimple').value=item.date.split('T')[0];
      else document.getElementById('editDate').value=item.date.length<=10?item.date+'T00:00':item.date.slice(0,16);
    }
  }
  if(needLoc){
    const locRaw=item.location||'';
    const locNoCancelled=locRaw.startsWith('cancelled:')?locRaw.slice(10):locRaw;
    const rawLoc=locNoCancelled.split('@@')[0];
    const{loc,guest}=parseLocation(rawLoc);
    const{locName,mapsLink,website}=parseLocationFull(loc||rawLoc||null);
    document.getElementById('editLocation').value=locName||'';
    document.getElementById('editMapsLink').value=mapsLink||'';
    document.getElementById('editWebLink').value=website||'';
    if(c==='ejercicio') document.getElementById('editGuest').value=guest||'';
    if(c==='eventos'){
      const{guest:evGuest}=parseEventoMeta(rawLoc);
      document.getElementById('editGuest').value=evGuest||'';
    }
  }
  document.getElementById('editOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('editInput').focus(),350);
}

function closeEdit(){
  document.getElementById('editOverlay').classList.remove('open');
  editingId=null;editingCat=null;
}

function handleEditOverlayClick(e){if(e.target===document.getElementById('editOverlay'))closeEdit();}

async function saveEdit(){
  const text=document.getElementById('editInput').value.trim();
  if(!text){document.getElementById('editInput').focus();return;}
  const c=editingCat;
  const isCumple=c==='cumples';
  const dateEl=(!isCumple&&document.getElementById('editDate').style.display!='none')?document.getElementById('editDate'):document.getElementById('editDateSimple');
  const date=NEED_DATE.includes(c)?(dateEl.value||null):null;
  const origItem=(items[c]||[]).find(i=>i.id===editingId);
  const wasCancelled=origItem?.location?.startsWith('cancelled:');
  let location=null;
  if(c==='salud'){
    // Keep existing subtype from original, just update text
    const origLoc=origItem?.location||'';
    location=origLoc||null;
  } else if(c==='recordatorios'){
    // Keep existing note if any
    const origLoc=origItem?.location||'';
    location=origLoc.startsWith('note:')?origLoc:null;
  } else if(NEED_LOC.includes(c)){
    location=getLocationStr('edit');
    // Preserve @@cumpleId
    if(origItem?.location&&origItem.location.includes('@@')){
      const cumpleIdPart=origItem.location.split('@@')[1];
      if(cumpleIdPart)location=(location||'')+'@@'+cumpleIdPart;
    }
    if(c==='ejercicio'){
      const guest=document.getElementById('editGuest').value.trim();
      if(guest)location=(location||'')+'||'+guest;
    }
    if(c==='eventos'){
      // Preserve evtype from original, add new guest
      const origLoc=origItem?.location||'';
      const evtypeMatch=origLoc.match(/~~evtype:([^|~]+)/);
      const origEvtype=evtypeMatch?evtypeMatch[1]:null;
      const guest=document.getElementById('editGuest').value.trim();
      if(guest)location=(location||'')+'||'+guest;
      if(origEvtype)location=(location||'')+'~~evtype:'+origEvtype;
    }
    // Re-apply cancelled: prefix if it was cancelled
    if(wasCancelled&&location!==null)location='cancelled:'+location;
  }
  const btn=document.getElementById('editBtn');
  btn.textContent='Guardando...';btn.disabled=true;
  const{error}=await sb.from('items').update({text,date,location}).eq('id',editingId).eq('user_id',user.id);
  btn.textContent='Guardar';btn.disabled=false;
  if(error){
    console.error('saveEdit error:',error);
    alert('Error: '+(error.message||error.details||JSON.stringify(error)));
    return;
  }
  if(origItem){origItem.text=text;origItem.date=date;origItem.location=location;}
  placeData.edit=null;
  closeEdit();
  render();
}
function sendWA(msg){window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank');}
function sendWAEncoded(encodedMsg){sendWA(decodeURIComponent(encodedMsg));}

function makePlan(e,id,c){
  e.stopPropagation();
  const item=(items[c]||[]).find(i=>i.id===id);
  if(!item)return;
  const msgTexto=c==='ejercicio'?'¿'+(item.text)+'? 💪 ¿Te apuntas?':'Plan: '+item.text+' 🎉 ¿Te apuntas?';
  const msg=encodeURIComponent(msgTexto);
  const choice=confirm('¿Qué quieres hacer con "'+item.text+'"?\n\nOK = Compartir por WhatsApp\nCancelar = Crear evento');
  if(choice){
    window.open('https://wa.me/?text='+msg,'_blank');
  } else {
    openSheet('eventos');
    setTimeout(()=>{
      document.getElementById('sheetInput').value=item.text;
      if(item.location)document.getElementById('sheetLocation').value=item.location;
    },400);
  }
}

function openSheet(c){
  const tc=c||(view!=='hoy'?view:'compras');
  selectCatByKey(tc);
  document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('sheetInput').focus(),350);
}

function closeSheet(){
  document.getElementById('overlay').classList.remove('open');
  ['sheetInput','sheetDate','sheetLocation','sheetGuest','sheetLink','sheetNote','sheetMapsLink','sheetWebLink'].forEach(id=>{const el=document.getElementById(id);if(el){el.value='';if(el.tagName==='TEXTAREA')el.value='';}});
  const pi=document.getElementById('sheetPlaceInfo');if(pi){pi.style.display='none';pi.innerHTML='';}
  placeData.sheet=null;selectedSubtype=null;
}

function handleOverlayClick(e){if(e.target===document.getElementById('overlay'))closeSheet();}

function selectCat(btn,c){
  document.querySelectorAll('.cat-chip').forEach(x=>x.classList.remove('sel'));
  btn.classList.add('sel');cat=c;
  const needDate=NEED_DATE.includes(c);
  document.getElementById('sheetDateWrap').style.display=needDate?'block':'none';
  document.getElementById('sheetLocationWrap').style.display=NEED_LOC.includes(c)?'block':'none';
  document.getElementById('sheetGuestWrap').style.display=c==='ejercicio'?'block':'none';
  const isRelease=c==='cultura'||c==='bts';
  const isSalud=c==='salud';
  const isEvento=c==='eventos';
  document.getElementById('sheetLinkWrap').style.display=isRelease?'block':'none';
  document.getElementById('sheetNoteWrap').style.display=isRelease?'block':'none';
  document.getElementById('sheetGuestWrap').style.display=(c==='ejercicio'||c==='eventos')?'block':'none';
  if(c==='ejercicio'){
    document.getElementById('sheetGuestLabel').textContent='Invitado (opcional)';
    document.getElementById('sheetGuest').placeholder='Nombre de quien invitas...';
  } else if(c==='eventos'){
    document.getElementById('sheetGuestLabel').textContent='Con quién (opcional)';
    document.getElementById('sheetGuest').placeholder='Ej: Mamá, Claudia, amigos...';
  }
  // Subtypes
  const stWrap=document.getElementById('sheetSubtypeWrap');
  const stScroll=document.getElementById('sheetSubtypeScroll');
  if(isRelease){
    const types=c==='bts'?BTS_TYPES:CULTURA_TYPES;
    selectedSubtype=types[0].key;
    stScroll.innerHTML=types.map((t,i)=>`<button class="subtype-chip${i===0?' sel':''}" onclick="selectSubtype(this,'${t.key}')" style="${c==='bts'?'color:#9B8EC4;border-color:rgba(155,142,196,0.3)':''}">${t.label}</button>`).join('');
    stWrap.style.display='block';
  } else if(isSalud){
    selectedSubtype=SALUD_TYPES[0].key;
    stScroll.innerHTML=SALUD_TYPES.map((t,i)=>`<button class="subtype-chip${i===0?' sel':''}" onclick="selectSubtype(this,'${t.key}')" style="color:#e24b4a;border-color:rgba(226,75,74,0.3)">${t.label}</button>`).join('');
    stWrap.style.display='block';
  } else if(isEvento){
    selectedSubtype=EVENTO_TYPES[0].key;
    stScroll.innerHTML=EVENTO_TYPES.map((t,i)=>`<button class="subtype-chip${i===0?' sel':''}" onclick="selectSubtype(this,'${t.key}')" style="color:#ba7517;border-color:rgba(186,117,23,0.3)">${t.label}</button>`).join('');
    stWrap.style.display='block';
  } else if(c==='recordatorios'){
    selectedSubtype='tarea';
    stScroll.innerHTML=`<button class="subtype-chip sel" onclick="selectSubtypeTodo(this,'tarea')" style="color:#534ab7;border-color:rgba(83,74,183,0.3)">✅ Tarea</button><button class="subtype-chip" onclick="selectSubtypeTodo(this,'nota')" style="color:#534ab7;border-color:rgba(83,74,183,0.3)">📝 Nota</button>`;
    stWrap.style.display='block';
    document.getElementById('sheetNoteWrap').style.display='none';
    document.getElementById('sheetNoteLabel').textContent='Contenido de la nota';
    document.getElementById('sheetNote').placeholder='Escribe tu nota aquí...';
  } else {
    stWrap.style.display='none';
    selectedSubtype=null;
  }
  document.getElementById('sheetInput').placeholder=HINTS[c]||'Escribe aquí...';
  if(needDate){
    const isCumple=c==='cumples';
    document.getElementById('sheetDate').style.display=isCumple?'none':'block';
    document.getElementById('sheetDateSimple').style.display=isCumple?'block':'none';
    document.getElementById('sheetDateLabel').textContent=isCumple?'Fecha de cumpleaños':'Fecha y hora';
  }
}

function selectSubtype(btn,key){
  document.querySelectorAll('#sheetSubtypeScroll .subtype-chip').forEach(x=>x.classList.remove('sel'));
  btn.classList.add('sel');
  selectedSubtype=key;
}

function selectSubtypeTodo(btn,key){
  document.querySelectorAll('#sheetSubtypeScroll .subtype-chip').forEach(x=>x.classList.remove('sel'));
  btn.classList.add('sel');
  selectedSubtype=key;
  // Show note textarea only for nota type
  const noteWrap=document.getElementById('sheetNoteWrap');
  noteWrap.style.display=key==='nota'?'block':'none';
}

function selectCatByKey(c){const chip=document.querySelector(`.cat-chip[data-cat="${c}"]`);if(chip)selectCat(chip,c);}

async function saveItem(){
  const text=document.getElementById('sheetInput').value.trim();
  if(!text){document.getElementById('sheetInput').focus();return;}
  const dateEl=document.getElementById('sheetDate').style.display!='none'?document.getElementById('sheetDate'):document.getElementById('sheetDateSimple');
  const date=dateEl.value||null;
  let location=null;
  const isRelease=cat==='cultura'||cat==='bts';
  const isSalud=cat==='salud';
  const isTodo=cat==='recordatorios';
  const isEvento=cat==='eventos';
  if(isRelease||isSalud){
    const link=isRelease?(document.getElementById('sheetLink').value.trim()||''):'';
    const note=isRelease?(document.getElementById('sheetNote').value.trim()||''):'';
    location=`~~${selectedSubtype||''}~~${link}~~${note}`;
  } else if(isTodo&&selectedSubtype==='nota'){
    const noteContent=document.getElementById('sheetNote').value.trim()||'';
    if(noteContent)location=`note:${noteContent}`;
  } else if(NEED_LOC.includes(cat)){
    location=getLocationStr('sheet');
    if(cat==='ejercicio'||isEvento){
      const guest=document.getElementById('sheetGuest').value.trim();
      if(guest)location=(location||'')+'||'+guest;
    }
    // Store evento subtype in location with evtype: prefix
    if(isEvento&&selectedSubtype){
      location=(location||'')+'~~evtype:'+selectedSubtype;
    }
  }
  const btn=document.getElementById('saveBtn');
  btn.textContent='Guardando...';btn.disabled=true;
  if(!user){alert('No hay sesión activa. Recarga la página.');btn.textContent='Guardar';btn.disabled=false;return;}
  let data,error;
  try{({data,error}=await sb.from('items').insert([{user_id:user.id,category:cat,text,date:date||null,location:location||null,done:false}]).select().single());}
  catch(e){error=e;}
  btn.textContent='Guardar';btn.disabled=false;
  if(error){
    console.error('saveItem error:',error);
    alert('Error al guardar:\n'+(error.message||error.details||error.code||JSON.stringify(error)));
    return;
  }
  if(!items[cat])items[cat]=[];
  items[cat].unshift(data);
  placeData.sheet=null;
  closeSheet();
  switchViewTo(cat);
}

function switchView(v,btn){
  if(v!=='eventos')eventoFilter=null;
  view=v;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  if(btn)btn.classList.add('active');
  render();
}

function switchViewTo(v){
  if(v!=='eventos')eventoFilter=null;
  view=v;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===v));
  render();
}

function toggleUserMenu(){document.getElementById('userOverlay').classList.toggle('open');}

function openStats(){
  toggleUserMenu();
  const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const now=new Date();
  const thisYear=now.getFullYear();
  const thisMonth=now.getMonth();

  // Count items per category
  const counts={};
  const yearCounts={};
  Object.entries(items).forEach(([c,arr])=>{
    counts[c]=arr.filter(i=>!i.done).length;
    if(c==='eventos'||c==='citas'||c==='bts'){
      yearCounts[c]={};
      arr.forEach(i=>{
        if(!i.date)return;
        const y=parseLocalDate(i.date).getFullYear();
        yearCounts[c][y]=(yearCounts[c][y]||0)+1;
      });
    }
  });

  // Upcoming events this month
  const upcomingThisMonth=(items.eventos||[]).filter(i=>{
    if(!i.date||i.done)return false;
    const d=parseLocalDate(i.date);
    return d.getFullYear()===thisYear&&d.getMonth()===thisMonth&&d>=now;
  }).length;

  // Concert count by year
  const concerts=(items.eventos||[]).filter(i=>{
    const{evtype}=parseEventoMeta(i.location||'');
    return evtype==='concierto';
  });
  const concertYears={};
  concerts.forEach(i=>{
    if(!i.date)return;
    const y=parseLocalDate(i.date).getFullYear();
    concertYears[y]=(concertYears[y]||0)+1;
  });
  const allYears=[...new Set(Object.keys(concertYears))].sort();
  const maxConcerts=Math.max(...Object.values(concertYears),1);

  // Próximos cumples
  const proxCumples=(items.cumples||[]).filter(i=>{
    const d=nextBirthdayDate(i.date);
    return d&&daysUntil(d)<=30;
  }).sort((a,b)=>daysUntil(nextBirthdayDate(a.date))-daysUntil(nextBirthdayDate(b.date)));

  const statsHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:500;display:flex;align-items:flex-end" onclick="if(event.target===this)this.remove()">
    <div style="background:var(--bg);border-radius:20px 20px 0 0;width:100%;max-height:85vh;overflow-y:auto;padding:20px 16px 40px">
      <div style="width:40px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 20px"></div>
      <div style="font-size:18px;font-weight:500;color:var(--text);margin-bottom:16px">Resumen</div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px">
        <div style="background:var(--bg2);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:500;color:var(--text)">${(items.eventos||[]).filter(i=>!i.done).length}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">eventos</div>
        </div>
        <div style="background:var(--bg2);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:500;color:var(--text)">${concerts.length}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">conciertos</div>
        </div>
        <div style="background:var(--bg2);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:500;color:var(--text)">${upcomingThisMonth}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">este mes</div>
        </div>
      </div>

      ${allYears.length?`<div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:10px">Conciertos por año</div>
      <div style="background:var(--card);border:0.5px solid var(--border);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px">
        ${allYears.map(y=>`<div style="display:flex;align-items:center;gap:10px;padding:5px 0">
          <span style="font-size:12px;color:var(--text3);min-width:36px">${y}</span>
          <div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">
            <div style="width:${Math.round((concertYears[y]/maxConcerts)*100)}%;height:100%;background:#ba7517;border-radius:3px"></div>
          </div>
          <span style="font-size:12px;color:var(--text2);min-width:16px;text-align:right">${concertYears[y]}</span>
        </div>`).join('')}
      </div>`:''}

      <div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:10px">Categorías</div>
      <div style="background:var(--card);border:0.5px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:20px">
        ${Object.entries(LABELS).filter(([k])=>k!=='peliculas'&&k!=='libros').map(([k,label],i,arr)=>`<div style="display:flex;align-items:center;gap:12px;padding:9px 14px;${i<arr.length-1?'border-bottom:0.5px solid var(--border)':''}">
          <div style="width:8px;height:8px;border-radius:50%;background:${COLORS[k]||'#888'};flex-shrink:0"></div>
          <span style="font-size:13px;color:var(--text);flex:1">${label}</span>
          <span style="font-size:13px;font-weight:500;color:var(--text2)">${counts[k]||0}</span>
        </div>`).join('')}
      </div>

      ${proxCumples.length?`<div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:10px">Proximos cumples</div>
      <div style="background:var(--card);border:0.5px solid var(--border);border-radius:var(--radius);overflow:hidden">
        ${proxCumples.map((c,i,arr)=>{
          const d=nextBirthdayDate(c.date);
          const dias=daysUntil(d);
          return `<div style="display:flex;align-items:center;gap:12px;padding:9px 14px;${i<arr.length-1?'border-bottom:0.5px solid var(--border)':''}">
            <div style="font-size:16px">🎂</div>
            <span style="font-size:13px;color:var(--text);flex:1">${c.text}</span>
            <span style="font-size:11px;color:var(--text3)">${dias===0?'Hoy':dias===1?'Mañana':'en '+dias+' días'}</span>
          </div>`;
        }).join('')}
      </div>`:''}
    </div>
  </div>`;

  const el=document.createElement('div');
  el.innerHTML=statsHTML;
  document.body.appendChild(el.firstElementChild);
}
function handleUserOverlay(e){if(e.target.classList.contains('user-bg'))toggleUserMenu();}
function parseLocalDate(s){
  if(!s)return null;
  // Treat stored datetime as local time, not UTC
  if(s.length<=10)return new Date(s+'T12:00:00');
  // "2026-03-21T22:00" — no Z, so JS parses as local already
  // but if it has Z or +00:00 it would shift; strip timezone offset
  return new Date(s.replace('Z','').replace(/[+-]\d{2}:\d{2}$/,''));
}
function fmtTime(s){try{return parseLocalDate(s).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});}catch{return '';}}
function fmtDate(s){try{return parseLocalDate(s).toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'});}catch{return s;}}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeSheet();closeEdit();document.getElementById('userOverlay').classList.remove('open');}
  if(e.key==='Enter'&&document.getElementById('overlay').classList.contains('open'))saveItem();
  if(e.key==='Enter'&&document.getElementById('editOverlay').classList.contains('open'))saveEdit();
});

init();
