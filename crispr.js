// ---- DNA Shortener compression / decompression ----
const FIXED_LENGTHS = [10,13,13,15,11,8,11,8,11,11,13,15,13,11,11,13,15,11,11,16];
const TOTAL_BASES = FIXED_LENGTHS.reduce((sum, len) => sum + 2*len, 0);

const BASE_TO_BITS = { 'A': 0b00, 'C': 0b01, 'G': 0b10, 'T': 0b11 };
const BITS_TO_BASE = ['A', 'C', 'G', 'T'];

function bitsToBytes(bitsString) {
  const bytes = [];
  for (let i = 0; i < bitsString.length; i += 8) {
    let chunk = bitsString.substring(i, i + 8);
    while (chunk.length < 8) chunk += '0';
    bytes.push(parseInt(chunk, 2));
  }
  return new Uint8Array(bytes);
}
function uint8ToBase64url(buffer) {
  let binary = '';
  buffer.forEach(byte => binary += String.fromCharCode(byte));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlToUint8(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4 !== 0) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function bytesToBits(bytes) {
  let bits = '';
  for (let i = 0; i < bytes.length; i++) bits += bytes[i].toString(2).padStart(8, '0');
  return bits;
}

function encodeSequences(linesArray) {
  if (linesArray.length !== 40) throw new Error('Exactly 40 lines are required.');
  let bits = '';
  for (let i = 0; i < 40; i++) {
    const match = linesArray[i].match(/^(\d{2}):([ACGT]+)$/);
    if (!match) throw new Error(`Invalid format at line ${i+1}: "${linesArray[i]}"`);
    const num = parseInt(match[1], 10);
    const seq = match[2];
    if (num !== Math.floor(i/2)) throw new Error(`Line numbers must be 00,00,…,19,19. Problem at line ${i+1}`);
    const expectedLen = FIXED_LENGTHS[num];
    if (seq.length !== expectedLen) throw new Error(`Line ${String(num).padStart(2,'0')} must have length ${expectedLen}. Got ${seq.length}.`);
    for (const ch of seq) bits += BASE_TO_BITS[ch].toString(2).padStart(2, '0');
  }
  const pad = (8 - (bits.length % 8)) % 8;
  bits += '0'.repeat(pad);
  return uint8ToBase64url(bitsToBytes(bits));
}

function decodeToLines(encodedStr) {
  const bytes = base64urlToUint8(encodedStr);
  let bits = bytesToBits(bytes);
  if (bits.length < TOTAL_BASES * 2) throw new Error('Link too short for fixed schema.');
  const seqBits = bits.substring(0, TOTAL_BASES * 2);
  const sequences = [];
  for (let i = 0; i < seqBits.length; i += 2) sequences.push(BITS_TO_BASE[parseInt(seqBits.substring(i, i+2), 2)]);
  const lines = [];
  let cursor = 0;
  for (let i = 0; i < 20; i++) {
    const len = FIXED_LENGTHS[i];
    const num = String(i).padStart(2, '0');
    lines.push(num + ':' + sequences.slice(cursor, cursor + len).join(''));
    cursor += len;
    lines.push(num + ':' + sequences.slice(cursor, cursor + len).join(''));
    cursor += len;
  }
  return lines;
}

// ---- DNA Library (categories, entries, local storage) ----
const STORAGE_KEY_LIBRARY = 'dna_shortener_categories';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

const syncChannel = new BroadcastChannel('dna-shortener-sync');

syncChannel.onmessage = (event) => {
  if (event.data && event.data.type === 'update') {
    categories = loadCategories();
    if (selectedCategoryId && !categories.find(c => c.id === selectedCategoryId)) {
      selectedCategoryId = null;
    }
    renderLibrary();
    updateSaveButton();
  }
};

function reloadCategoriesFromStorage() {
  categories = loadCategories();
  if (selectedCategoryId && !categories.find(c => c.id === selectedCategoryId)) {
    selectedCategoryId = null;
  }
}

function broadcastUpdate() {
  saveCategories();
  syncChannel.postMessage({ type: 'update' });
}

function loadCategories() {
  const raw = localStorage.getItem(STORAGE_KEY_LIBRARY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  const defaultCat = { id: generateId(), name: 'Default', entries: [] };
  const oldDna = localStorage.getItem('horsey_saved_dna');
  if (oldDna) {
    try {
      const oldList = JSON.parse(oldDna);
      if (Array.isArray(oldList)) {
        oldList.forEach(item => {
          defaultCat.entries.push({ id: generateId(), name: item.name || 'Unnamed', dnaText: item.rawText || '' });
        });
      }
      broadcastUpdate();
      localStorage.removeItem('horsey_saved_dna');
    } catch (e) {}
  }
  return [defaultCat];
}

function saveCategories() {
  localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(categories));
}

let categories = loadCategories();
let selectedCategoryId = null;

const categoryList = document.getElementById('categoryList');
const saveBtnText = document.getElementById('saveBtnText');
const dnaShortenerLink = document.getElementById('dnaShortenerLink');

function renderLibrary() {
  categoryList.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.className = 'category-item';
    if (cat.id === selectedCategoryId) li.classList.add('selected');
    li.draggable = true;
    li.dataset.categoryId = cat.id;

    li.addEventListener('dragstart', handleCategoryDragStart);
    li.addEventListener('dragover', handleCategoryDragOver);
    li.addEventListener('drop', handleCategoryDrop);
    li.addEventListener('dragend', handleDragEnd);

    const header = document.createElement('div');
    header.className = 'category-header';

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'category-name';
    nameSpan.textContent = cat.name;
    nameSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      selectCategory(cat.id);
    });

    const actions = document.createElement('div');
    actions.className = 'category-actions';

    const renameBtn = document.createElement('button');
    renameBtn.innerHTML = '✏️';
    renameBtn.title = 'Rename category';
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newName = prompt('New category name:', cat.name);
      if (newName && newName.trim()) {
        reloadCategoriesFromStorage();
        const targetCat = categories.find(c => c.id === cat.id);
        if (targetCat) {
          targetCat.name = newName.trim();
          broadcastUpdate();
          renderLibrary();
          showToast(`Category renamed to "${cat.name}"`);
        }
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete category';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete category "${cat.name}" and all its DNA?`)) {
        reloadCategoriesFromStorage();
        categories = categories.filter(c => c.id !== cat.id);
        if (selectedCategoryId === cat.id) selectedCategoryId = null;
        broadcastUpdate();
        renderLibrary();
        updateSaveButton();
        showToast(`Category "${cat.name}" deleted`, 'error');
      }
    });

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(dragHandle);
    header.appendChild(nameSpan);
    header.appendChild(actions);
    li.appendChild(header);

    if (cat.id === selectedCategoryId) {
      const entryList = document.createElement('ul');
      entryList.className = 'entry-list';
      cat.entries.forEach(entry => {
        const entryLi = document.createElement('li');
        entryLi.className = 'entry-item';
        entryLi.draggable = true;
        entryLi.dataset.entryId = entry.id;
        entryLi.dataset.categoryId = cat.id;

        entryLi.addEventListener('dragstart', handleEntryDragStart);
        entryLi.addEventListener('dragover', handleEntryDragOver);
        entryLi.addEventListener('drop', handleEntryDrop);
        entryLi.addEventListener('dragend', handleDragEnd);

        const entryDragHandle = document.createElement('span');
        entryDragHandle.className = 'drag-handle';
        entryDragHandle.innerHTML = '⋮';
        const entryName = document.createElement('span');
        entryName.className = 'entry-name';
        entryName.textContent = entry.name;
        entryLi.addEventListener('click', () => loadEntry(entry));

        const entryActions = document.createElement('div');
        entryActions.className = 'entry-actions';

        const entryRename = document.createElement('button');
        entryRename.innerHTML = '✏️';
        entryRename.title = 'Rename DNA';
        entryRename.addEventListener('click', (e) => {
          e.stopPropagation();
          const newName = prompt('New name:', entry.name);
          if (newName && newName.trim()) {
            reloadCategoriesFromStorage();
            const targetCat = categories.find(c => c.id === cat.id);
            if (targetCat) {
              const targetEntry = targetCat.entries.find(e => e.id === entry.id);
              if (targetEntry) {
                targetEntry.name = newName.trim();
                broadcastUpdate();
                renderLibrary();
                showToast(`DNA renamed to "${entry.name}"`);
              }
            }
          }
        });

        const entryCompare = document.createElement('button');
        entryCompare.innerHTML = '⚖️';
        entryCompare.title = 'Load into compare';
        entryCompare.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!compareModeActive) toggleCompareMode();
          document.getElementById('compareGeneInput').value = entry.dnaText;
          updateReferenceMapFromText();
          renderTable();
          showToast(`"${entry.name}" loaded for comparison`);
        });

        const entryDelete = document.createElement('button');
        entryDelete.innerHTML = '🗑️';
        entryDelete.title = 'Delete DNA';
        entryDelete.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete DNA "${entry.name}"?`)) {
            reloadCategoriesFromStorage();
            const targetCat = categories.find(c => c.id === cat.id);
            if (targetCat) {
              targetCat.entries = targetCat.entries.filter(e => e.id !== entry.id);
              broadcastUpdate();
              renderLibrary();
              showToast(`DNA "${entry.name}" deleted`, 'error');
            }
          }
        });

        entryActions.appendChild(entryCompare);
        entryActions.appendChild(entryRename);
        entryActions.appendChild(entryDelete);
        entryLi.appendChild(entryDragHandle);
        entryLi.appendChild(entryName);
        entryLi.appendChild(entryActions);
        entryList.appendChild(entryLi);
      });
      li.appendChild(entryList);
    }
    categoryList.appendChild(li);
  });
}

function selectCategory(id) {
  selectedCategoryId = id;
  renderLibrary();
  updateSaveButton();
}

function updateSaveButton() {
  const cat = categories.find(c => c.id === selectedCategoryId);
  saveBtnText.textContent = cat ? `Save to ${cat.name}` : 'Save DNA';
}

function loadEntry(entry) {
  document.getElementById('rawGeneInput').value = entry.dnaText;
  parseAndLoadFromTextarea();
  showToast(`Loaded DNA "${entry.name}"`);
}

// Drag & Drop
let draggedCategoryId = null, draggedEntryId = null, draggedFromCategoryId = null;
function handleCategoryDragStart(e) {
  draggedCategoryId = this.dataset.categoryId;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function handleCategoryDragOver(e) {
  e.preventDefault();
  const target = e.currentTarget;
  if (target && target.dataset.categoryId !== draggedCategoryId)
    target.style.borderTop = '2px solid #3b82f6';
}
function handleCategoryDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  target.style.borderTop = '';
  const targetId = target.dataset.categoryId;
  if (!draggedCategoryId || targetId === draggedCategoryId) return;
  reloadCategoriesFromStorage();
  const draggedIndex = categories.findIndex(c => c.id === draggedCategoryId);
  const targetIndex = categories.findIndex(c => c.id === targetId);
  if (draggedIndex !== -1 && targetIndex !== -1) {
    const [moved] = categories.splice(draggedIndex, 1);
    categories.splice(targetIndex, 0, moved);
    broadcastUpdate();
    renderLibrary();
  }
}
function handleEntryDragStart(e) {
  draggedEntryId = this.dataset.entryId;
  draggedFromCategoryId = this.dataset.categoryId;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
}
function handleEntryDragOver(e) {
  e.preventDefault();
  const target = e.currentTarget;
  if (target && target.dataset.entryId !== draggedEntryId && target.dataset.categoryId === draggedFromCategoryId)
    target.style.borderTop = '2px solid #3b82f6';
}
function handleEntryDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  target.style.borderTop = '';
  if (!draggedEntryId || !draggedFromCategoryId) return;
  reloadCategoriesFromStorage();
  const cat = categories.find(c => c.id === draggedFromCategoryId);
  if (!cat || target.dataset.categoryId !== draggedFromCategoryId) return;
  const draggedIndex = cat.entries.findIndex(ent => ent.id === draggedEntryId);
  const targetIndex = cat.entries.findIndex(ent => ent.id === target.dataset.entryId);
  if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
    const [moved] = cat.entries.splice(draggedIndex, 1);
    cat.entries.splice(targetIndex, 0, moved);
    broadcastUpdate();
    renderLibrary();
  }
}
function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.category-item, .entry-item').forEach(el => el.style.borderTop = '');
  draggedCategoryId = null;
  draggedEntryId = null;
  draggedFromCategoryId = null;
}

// Add category
function addCategory() {
  const name = prompt('Category name:');
  if (!name || !name.trim()) return;
  reloadCategoriesFromStorage();
  const newCat = { id: generateId(), name: name.trim(), entries: [] };
  categories.push(newCat);
  broadcastUpdate();
  renderLibrary();
  selectCategory(newCat.id);
  showToast(`Category "${newCat.name}" created`);
}

// Save current DNA
function saveCurrentDna() {
  if (!selectedCategoryId) { alert('Please select a category first.'); return; }
  reloadCategoriesFromStorage();
  const cat = categories.find(c => c.id === selectedCategoryId);
  if (!cat) return;
  syncTextareaFromTable();
  const dnaText = document.getElementById('rawGeneInput').value;
  if (!dnaText.trim()) { alert('DNA editor is empty.'); return; }
  const name = prompt('Name for this DNA snapshot:', `DNA ${new Date().toLocaleTimeString()}`);
  if (!name || !name.trim()) return;
  cat.entries.push({ id: generateId(), name: name.trim(), dnaText });
  broadcastUpdate();
  renderLibrary();
  showToast(`DNA "${name.trim()}" saved`);
}

// Export / Import library
function exportLibrary() {
  const jsonStr = JSON.stringify(categories, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dna_library.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('DNA Library exported!');
}
function importLibrary() { document.getElementById('importFileInput').click(); }
document.getElementById('importFileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      reloadCategoriesFromStorage();
      imported.forEach(cat => {
        if (!cat.name || typeof cat.name !== 'string') throw new Error('Invalid category');
        const newCatId = generateId();
        const entries = Array.isArray(cat.entries) ? cat.entries : [];
        const newEntries = entries.map(entry => ({
          id: generateId(), name: entry.name || 'Unnamed DNA', dnaText: entry.dnaText || ''
        }));
        categories.push({ id: newCatId, name: cat.name, entries: newEntries });
      });
      broadcastUpdate();
      renderLibrary();
      showToast(`Imported ${imported.length} categories`);
    } catch (err) { showToast('Invalid import file', 'error'); }
  };
  reader.readAsText(file);
  this.value = '';
});

// ========== Original CRISPR functions ==========
let currentGenePairs = [];
let compareModeActive = false;
let referenceMap = new Map();
let currentFilter = "";
let bookmarks = new Set();
let toastTimeout = null;

function getRandomNuc() { return ["A","C","G","T"][Math.floor(Math.random()*4)]; }
function getDominantNuc(a1,a2,priorityOrder) {
  if (a1===a2) return a1;
  const idx1=priorityOrder.indexOf(a1), idx2=priorityOrder.indexOf(a2);
  if (idx1===-1) return a2; if (idx2===-1) return a1;
  return idx1 < idx2 ? a1 : a2;
}
function computeWeightedValue(entry, allele1, allele2) {
  const domNuc = getDominantNuc(allele1,allele2,entry.priorityOrder);
  const recNuc = domNuc===allele1?allele2:allele1;
  const domVal=entry.values[domNuc], recVal=entry.values[recNuc];
  const m=entry.m;
  if (m>=100) return domVal;
  if (m<=0) return recVal;
  return Math.floor((domVal*m + recVal*(100-m))/100);
}
function parseUserGenes(rawText) {
  const lines=rawText.split(/\r?\n/).filter(l=>l.trim());
  const helixSeqMap=new Map();
  function sanitizeNuc(c){let u=c.toUpperCase();if("ACGT".includes(u))return u;return getRandomNuc();}
  for(const line of lines){
    const match=line.match(/^(\d+):(.*)$/);if(!match)continue;
    const helix=parseInt(match[1]);const seq=match[2].trim();
    if(!helixSeqMap.has(helix))helixSeqMap.set(helix,[]);
    const arr=helixSeqMap.get(helix);if(arr.length<2)arr.push(seq);
  }
  const result=new Map();
  for(const [helix,seqs] of helixSeqMap){
    if(seqs.length!==2)continue;
    const left=seqs[0],right=seqs[1];
    const maxLen=Math.max(left.length,right.length);
    for(let i=0;i<maxLen;i++){
      const pair=i;const key=`${helix}:${pair}`;
      if(window.completeMapping && window.completeMapping.has(key)){
        const a1=i<left.length?sanitizeNuc(left[i]):getRandomNuc();
        const a2=i<right.length?sanitizeNuc(right[i]):getRandomNuc();
        result.set(key,{allele1:a1,allele2:a2});
      }
    }
  }
  return result;
}
function buildFullGenePairs(userMap){
  return window.allEntries.map(entry=>{
    const key=`${entry.helix}:${entry.pair}`;
    const user=userMap.get(key);
    return {...entry,
      allele1:user?user.allele1:getRandomNuc(),
      allele2:user?user.allele2:getRandomNuc()
    };
  });
}
function updateReferenceMapFromText(){
  const raw=document.getElementById("compareGeneInput").value;
  const userMap=parseUserGenes(raw);
  const newMap=new Map();
  for(const entry of window.allEntries){
    const key=`${entry.helix}:${entry.pair}`;
    const user=userMap.get(key);
    if(user){
      const weightedVal=computeWeightedValue(entry,user.allele1,user.allele2);
      newMap.set(key,{weightedValue:weightedVal});
    }else{newMap.set(key,null);}
  }
  referenceMap=newMap;
}
function syncTextareaFromTable(){
  const helixMap=new Map();
  for(const gp of currentGenePairs){
    if(!helixMap.has(gp.helix))helixMap.set(gp.helix,{left:[],right:[]});
    const entry=helixMap.get(gp.helix);
    entry.left.push(gp.allele1);entry.right.push(gp.allele2);
  }
  const lines=[];
  for(const [helix,seqs] of [...helixMap.entries()].sort((a,b)=>a[0]-b[0])){
    const formatted=helix.toString().padStart(2,'0');
    lines.push(`${formatted}:${seqs.left.join("")}`);
    lines.push(`${formatted}:${seqs.right.join("")}`);
  }
  document.getElementById("rawGeneInput").value=lines.join("\n");
  updateDnaUrl();
}

// ---------- UPDATED URL + link ----------
function updateDnaUrl() {
  const rawText = document.getElementById('rawGeneInput').value.trim();
  if (!rawText) {
    history.replaceState(null, '', window.location.pathname);
    dnaShortenerLink.classList.remove('visible');
    dnaShortenerLink.href = '#';
    return;
  }
  const lines = rawText.split(/\r?\n/).filter(l => l.trim() !== '');
  try {
    const encoded = encodeSequences(lines);
    const newUrl = `${window.location.pathname}?dna=${encoded}`;
    history.replaceState(null, '', newUrl);
    dnaShortenerLink.href = `https://zyonixgaming.github.io/dna/?dna=${encoded}`;
    dnaShortenerLink.classList.add('visible');
  } catch (e) {
    history.replaceState(null, '', window.location.pathname);
    dnaShortenerLink.classList.remove('visible');
    dnaShortenerLink.href = '#';
  }
}

function parseAndLoadFromTextarea(){
  const raw=document.getElementById("rawGeneInput").value;
  const userMap=parseUserGenes(raw);
  currentGenePairs=buildFullGenePairs(userMap);
  renderTable();renderBookmarksList();
  updateDnaUrl();
}
function renderTable(){
  let filtered=currentGenePairs.filter(p=>p.desc.toLowerCase().includes(currentFilter.toLowerCase()));
  const hasCompare=compareModeActive;
  const thead=document.getElementById("dynamicThead");
  thead.innerHTML=`<th style="width:45px;">⭐</th><th>Helix</th><th>Pair</th><th>m</th><th>Description <a href="https://horseygame.miraheze.org/wiki/Genome" target="_blank">(?)</a></th><th colspan="2">Pair 1</th><th colspan="2">Pair 2</th><th>Value <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=3704208519" target="_blank">(?)</a></th>${hasCompare?"<th>Compare</th>":""}`;
  let html="";
  for(let idx=0;idx<filtered.length;idx++){
    const p=filtered[idx];
    const origIdx=currentGenePairs.findIndex(gp=>gp.helix===p.helix&&gp.pair===p.pair);
    const weightedVal=computeWeightedValue(p,p.allele1,p.allele2);
    const domNuc=getDominantNuc(p.allele1,p.allele2,p.priorityOrder);
    const rowClass=p.helix%2===0?"helix-even":"helix-odd";
    const isBookmarked=bookmarks.has(`${p.helix}:${p.pair}`);
    const createOptions=currentNuc=>p.priorityOrder.map(nuc=>`<option value="${nuc}"${currentNuc===nuc?" selected":""}>${nuc} (${p.values[nuc]})</option>`).join("");
    let refCell="",diffClass="";
    if(hasCompare){
      const refData=referenceMap.get(`${p.helix}:${p.pair}`);
      let refVal=null;
      if(refData)refVal=refData.weightedValue;
      if(refVal!==null&&weightedVal!==refVal)diffClass="diff-highlight";
      refCell=`<td class="compare-cell ${diffClass}"><span class="final-value-badge final-${domNuc}">${refVal!==null?refVal:"—"}</span>`;
    }
    html+=`<tr class="${rowClass}" data-helix="${p.helix}" data-pair="${p.pair}">
      <td class="bookmark-col"><span class="bookmark-star${isBookmarked?" bookmarked":""}" onclick="toggleBookmarkFromTable(${p.helix},${p.pair})">★</span></td>
      <td class="helix-col">${p.helix}<td class="pair-col">${p.pair}<td class="desc-td">${p.m}
      <td class="desc-td" title="${p.desc}">${p.desc}
      <td colspan="2"><select class="nuc-select" data-idx="${origIdx}" data-side="1">${createOptions(p.allele1)}</select>
      <td colspan="2"><select class="nuc-select" data-idx="${origIdx}" data-side="2">${createOptions(p.allele2)}</select>
      <td class="value-cell ${diffClass}"><span class="final-value-badge final-${domNuc}">${weightedVal}</span>
      ${hasCompare?refCell:""}</tr>`;
  }
  document.getElementById("tableBody").innerHTML=html;attachSelectEvents();
}
function attachSelectEvents(){
  document.querySelectorAll(".nuc-select").forEach(sel=>{
    const updateClass=()=>{sel.classList.remove("A-selected","C-selected","G-selected","T-selected");if(sel.value==="A")sel.classList.add("A-selected");else if(sel.value==="C")sel.classList.add("C-selected");else if(sel.value==="G")sel.classList.add("G-selected");else if(sel.value==="T")sel.classList.add("T-selected");};
    updateClass();sel.addEventListener("change",e=>{
      const idx=parseInt(sel.dataset.idx),side=parseInt(sel.dataset.side);
      if(!isNaN(idx)&&idx<currentGenePairs.length){
        if(side===1)currentGenePairs[idx].allele1=sel.value;else currentGenePairs[idx].allele2=sel.value;
        syncTextareaFromTable();renderTable();renderBookmarksList();
      }
    });
  });
}
const filterInput=document.getElementById("filterInput");
filterInput.addEventListener("input",e=>{currentFilter=e.target.value;renderTable();});
document.getElementById("clearFilterBtn").addEventListener("click",()=>{filterInput.value="";currentFilter="";renderTable();});
function setupHelixNav(){
  const container=document.getElementById("helixNavButtons");
  const helixes=[...new Set(window.allEntries.map(e=>e.helix))].sort((a,b)=>a-b);
  helixes.forEach(h=>{const btn=document.createElement("button");btn.textContent=h;btn.classList.add("helix-btn");btn.addEventListener("click",()=>{const firstRow=document.querySelector(`tr[data-helix="${h}"]`);if(firstRow){firstRow.scrollIntoView({behavior:"instant",block:"start"});highlightHelixRows(h);}});container.appendChild(btn);});
}
function highlightHelixRows(helix){document.querySelectorAll(`tr[data-helix="${helix}"]`).forEach(row=>row.classList.add("helix-highlight"));setTimeout(()=>document.querySelectorAll(`tr[data-helix="${helix}"]`).forEach(row=>row.classList.remove("helix-highlight")),1000);}
function toggleCompareMode(){
  compareModeActive=!compareModeActive;const btn=document.getElementById("toggleCompareBtn"),area=document.getElementById("compareArea");
  if(compareModeActive){btn.textContent="⚖️ COMPARE MODE (ON)";btn.classList.add("active");area.style.display="block";updateReferenceMapFromText();}
  else{btn.textContent="⚖️ COMPARE MODE (OFF)";btn.classList.remove("active");area.style.display="none";referenceMap.clear();}
  renderTable();
}
function onCompareInput(){if(compareModeActive){updateReferenceMapFromText();renderTable();}}
function loadBookmarks(){const saved=localStorage.getItem("horsey_bookmarks");if(saved)bookmarks=new Set(JSON.parse(saved));renderBookmarksList();}
function saveBookmarks(){localStorage.setItem("horsey_bookmarks",JSON.stringify([...bookmarks]));renderBookmarksList();renderTable();}
window.toggleBookmarkFromTable=function(h,p){const key=`${h}:${p}`;if(bookmarks.has(key))bookmarks.delete(key);else bookmarks.add(key);saveBookmarks();};
function renderBookmarksList(){
  const container=document.getElementById("bookmarksList");
  if(bookmarks.size===0){container.innerHTML='<div class="empty-bookmarks">No bookmarks yet.<br>Click ★ a row to add.</div>';return;}
  let html="";
  for(const key of [...bookmarks].sort()){const [h,p]=key.split(":").map(Number);const entry=window.completeMapping.get(key);const desc=entry?entry.desc:"Unknown";const pairData=currentGenePairs.find(gp=>gp.helix===h&&gp.pair===p);let valBadge="";if(pairData&&entry){const w=computeWeightedValue(entry,pairData.allele1,pairData.allele2);const dom=getDominantNuc(pairData.allele1,pairData.allele2,entry.priorityOrder);valBadge=`<span class="bookmark-value-badge final-${dom}" style="margin-left:6px;">${w}</span>`;}html+=`<div class="bookmark-item"><div class="bookmark-info" onclick="scrollToPair(${h},${p})"><strong>H${h}P${p}:</strong>  ${desc.substring(0,25)}</div><div style="display:flex;gap:5px;">${valBadge}<button class="remove-bookmark" onclick="event.stopPropagation();removeBookmark('${key}')">✖</button></div></div>`;}
  container.innerHTML=html;
}
window.scrollToPair=function(h,p){const row=document.querySelector(`tr[data-helix="${h}"][data-pair="${p}"]`);if(row){row.scrollIntoView({behavior:"instant",block:"start"});row.classList.add("helix-highlight");setTimeout(()=>row.classList.remove("helix-highlight"),1000);}};
window.removeBookmark=function(key){bookmarks.delete(key);saveBookmarks();};
function showToast(message,duration=2000){const toast=document.getElementById("toast");toast.textContent=message;toast.classList.add("show");if(toastTimeout)clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>{toast.classList.remove("show");toastTimeout=null;},duration);}
function pasteClipboard(){navigator.clipboard.readText().then(text=>{document.getElementById("rawGeneInput").value=text;parseAndLoadFromTextarea();showToast("✅ Pasted from clipboard.");}).catch(()=>showToast("Clipboard read failed",1500));}
function exportData(){syncTextareaFromTable();const txt=document.getElementById("rawGeneInput").value;navigator.clipboard.writeText(txt).then(()=>showToast(`✅ Copied to clipboard`));}
function clearRaw(){document.getElementById("rawGeneInput").value="";parseAndLoadFromTextarea();showToast("Raw DNA cleared.");}
function clearCompare(){document.getElementById("compareGeneInput").value="";if(compareModeActive)updateReferenceMapFromText();renderTable();showToast("Compare DNA cleared.");}
function removeDiversity(){
	let modified=0;
	currentGenePairs.forEach(gp=>{
		if(gp.desc!=="CHEST_SMALL"&&gp.desc!=="OSTO_SIZE"){
			if(gp.m===100){
				const dom=getDominantNuc(gp.allele1,gp.allele2,gp.priorityOrder);
				if(gp.allele1!==dom||gp.allele2!==dom){
					gp.allele1=dom;gp.allele2=dom;modified++;
				}
			}else if(gp.allele1!==gp.allele2&&gp.values[gp.allele1]==gp.values[gp.allele2]){
				const dom=getDominantNuc(gp.allele1,gp.allele2,gp.priorityOrder);
				gp.allele1=dom;gp.allele2=dom;modified++;
			}
		}
	});
	if(modified){
		syncTextareaFromTable();
		renderTable();
		renderBookmarksList();
	}
}
function randomDiversity(){let modified=0;currentGenePairs.forEach(gp=>{if(gp.desc!=="CHEST_SMALL"&&gp.desc!=="OSTO_SIZE"&&gp.m===100){const dom=getDominantNuc(gp.allele1,gp.allele2,gp.priorityOrder);const domIdx=gp.priorityOrder.indexOf(dom);const allowed=gp.priorityOrder.slice(domIdx);const rand=allowed[Math.floor(Math.random()*allowed.length)];if(gp.allele1!==dom||gp.allele2!==rand){gp.allele1=dom;gp.allele2=rand;modified++;}}});if(modified){syncTextareaFromTable();renderTable();renderBookmarksList();}}

// Event listeners
document.getElementById("rawGeneInput").addEventListener("input",()=>parseAndLoadFromTextarea());
document.getElementById("pasteBtn").addEventListener("click",pasteClipboard);
document.getElementById("exportBtn").addEventListener("click",exportData);
document.getElementById("toggleCompareBtn").addEventListener("click",toggleCompareMode);
document.getElementById("compareGeneInput").addEventListener("input",onCompareInput);
document.getElementById("saveDnaBtn").addEventListener("click",saveCurrentDna);
document.getElementById("clearRawBtn").addEventListener("click",clearRaw);
document.getElementById("clearCompareBtn").addEventListener("click",clearCompare);
document.getElementById("removeDiversityBtn").addEventListener("click",removeDiversity);
document.getElementById("randomDiversityBtn").addEventListener("click",randomDiversity);
document.getElementById("addCategoryBtn").addEventListener("click",addCategory);
document.getElementById("exportLibBtn").addEventListener("click",exportLibrary);
document.getElementById("importLibBtn").addEventListener("click",importLibrary);

// Load ?dna= on start
function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const dna = params.get('dna');
  if (dna) {
    try {
      const lines = decodeToLines(dna);
      document.getElementById('rawGeneInput').value = lines.join('\n');
      parseAndLoadFromTextarea();
      showToast('DNA loaded from link');
    } catch (e) {
      showToast('Failed to decode link', 'error');
    }
  } else {
    updateDnaUrl();
  }
}

document.getElementById("rawGeneInput").value = "";
loadFromUrl();
// ========== Initialisation after XML is loaded ==========
window.addEventListener('load', async () => {
  try {
    await loadGeneDataFromXml();   // defined in mapping.js
  } catch (err) {
    showToast('Failed to load gene data from XML', 'error');
    console.error(err);
    //return;
  }

  // Default category handling
  if (!localStorage.getItem(STORAGE_KEY_LIBRARY)) {
    saveCategories();
  }
  categories = loadCategories();

  // Bookmarks, initial render, helix nav
  loadBookmarks();
  parseAndLoadFromTextarea();
  setupHelixNav();
  renderLibrary();
  if (!selectedCategoryId && categories.length > 0) {
    selectedCategoryId = categories[0].id;
    renderLibrary();
    updateSaveButton();
  }

  // Load DNA from URL parameter (if any)

});