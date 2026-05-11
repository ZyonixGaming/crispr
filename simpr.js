// =====================================================================
//  CRISPR 2.0 Override – Custom fixed dropdown + nucleotide colours
//  Must be loaded AFTER mapping.js, crispr.js, headers.js
// =====================================================================

// ---------- Helper: all 10 unordered allele pairs for a gene ----------
function getCombosForEntry(entry) {
    const nucs = ['A', 'C', 'G', 'T'];
    const combos = [];
    for (let i = 0; i < 4; i++) {
        for (let j = i; j < 4; j++) {
            const a1 = nucs[i];
            const a2 = nucs[j];
            const dom = getDominantNuc(a1, a2, entry.priorityOrder);
            const rec = dom === a1 ? a2 : a1;
            const val = computeWeightedValue(entry, a1, a2);
            combos.push({
                pairStr: dom + rec,          // dominant first
                value: val,
                allele1: dom,
                allele2: rec
            });
        }
    }
    // Sort: value descending, then by priority order of dominant, then recessive
    const prio = entry.priorityOrder;
    combos.sort((c1, c2) => {
        if (c2.value !== c1.value) return c2.value - c1.value;
        const i1 = prio.indexOf(c1.allele1);
        const i2 = prio.indexOf(c2.allele1);
        if (i1 !== i2) return i1 - i2;
        return prio.indexOf(c1.allele2) - prio.indexOf(c2.allele2);
    });
    return combos;
}

// Current pair string for a gene (dominant + recessive based on current alleles)
function currentPairStr(gp) {
    const entry = window.completeMapping.get(`${gp.helix}:${gp.pair}`);
    if (!entry) return 'AA';
    const dom = getDominantNuc(gp.allele1, gp.allele2, entry.priorityOrder);
    const rec = dom === gp.allele1 ? gp.allele2 : gp.allele1;
    return dom + rec;
}

// ---------- Annotation string for a combo (includes value + special tags) ----------
function getComboAnnotation(combo, entry) {
    const val = combo.value;
    const desc = entry.desc;

    // OSTO_SIZE: if G present → “(rounded)”
    if (desc === 'OSTO_SIZE') {
        if (combo.pairStr.includes('G')) return `${val} (rounded)`;
        return `${val}`;
    }

    // CHEST_SMALL: if A present → “(sloped)”
    if (desc === 'CHEST_SMALL') {
        if (combo.pairStr.includes('A')) return `${val} (sloped)`;
        return `${val}`;
    }

    // *_JOINT_TYPE genes
    if (desc.endsWith('_JOINT_TYPE')) {
        const jointNames = ['normal', 'rotate', 'piston'];
        const name = jointNames[val] !== undefined ? jointNames[val] : val;
        return `${val} (${name})`;
    }

    // *_TAG genes
    if (desc.endsWith('_TAG')) {
        const tagNames = ['nothing', 'leg', 'arm', 'tail', 'head'];
        const name = tagNames[val] !== undefined ? tagNames[val] : val;
        return `${val} (${name})`;
    }

    return `${val}`;
}

// Wrap a base pair string in colour-coded spans
function coloredPairSpans(pairStr) {
    return pairStr.split('').map(ch => `<span class="nuc-${ch}">${ch}</span>`).join('');
}

// ---------- Override renderTable (no annotation column, custom dropdown) ----------
window.renderTable = function () {
    let filtered = currentGenePairs.filter(p =>
        p.desc.toLowerCase().includes(currentFilter.toLowerCase())
    );

    const thead = document.getElementById('dynamicThead');
    thead.innerHTML =
        `<th style="width:45px;">⭐</th>
         <th>Helix</th>
         <th>Pair</th>
         <th>Description</th>
         <th>Value</th>`;

    let html = '';
    for (let idx = 0; idx < filtered.length; idx++) {
        const gp = filtered[idx];
        const origIdx = currentGenePairs.findIndex(g =>
            g.helix === gp.helix && g.pair === gp.pair
        );
        const rowClass = gp.helix % 2 === 0 ? 'helix-even' : 'helix-odd';
        const isBookmarked = bookmarks.has(`${gp.helix}:${gp.pair}`);

        const combos = getCombosForEntry(gp);
        const curPair = currentPairStr(gp);
        const entry = window.completeMapping.get(`${gp.helix}:${gp.pair}`);
        const curCombo = combos.find(c => c.pairStr === curPair);

        // Build custom dropdown
        const pairKey = `${gp.helix}-${gp.pair}`;
        let dropdownHtml = `<div class="custom-dropdown" id="dropdown-${pairKey}">
            <div class="selected-option" onclick="toggleDropdown('${pairKey}')">
                <span class="value-part">${curCombo ? getComboAnnotation(curCombo, entry) : curCombo.value}</span>
                <span class="bases-part">${coloredPairSpans(curPair)}</span>
                <span class="arrow">▼</span>
            </div>
            <div class="dropdown-options" style="display:none;">`;

        for (const combo of combos) {
            const selectedClass = combo.pairStr === curPair ? ' selected' : '';
            dropdownHtml +=
                `<div class="option-item${selectedClass}"
                      data-value="${combo.value}"
                      data-pair="${combo.pairStr}"
                      onclick="selectOption('${pairKey}', '${combo.pairStr}', this)">
                      <span class="value-part">${getComboAnnotation(combo, entry)}</span>
                      <span class="bases-part">${coloredPairSpans(combo.pairStr)}</span>
                  </div>`;
        }
        dropdownHtml += `</div></div>`;

        html += `<tr class="${rowClass}" data-helix="${gp.helix}" data-pair="${gp.pair}">
            <td class="bookmark-col">
                <span class="bookmark-star${isBookmarked ? ' bookmarked' : ''}"
                      onclick="toggleBookmarkFromTable(${gp.helix},${gp.pair})">★</span>
            </td>
            <td class="helix-col">${gp.helix}</td>
            <td class="pair-col">${gp.pair}</td>
            <td class="desc-td" title="${gp.title}">${gp.desc}</td>
            <td>${dropdownHtml}</td>
        </tr>`;
    }

    document.getElementById('tableBody').innerHTML = html;
};

// ---------- Override bookmarks list ----------
window.renderBookmarksList = function () {
    const container = document.getElementById('bookmarksList');
    if (bookmarks.size === 0) {
        container.innerHTML =
            '<div class="empty-bookmarks">No bookmarks yet.<br>Click ★ a row to add.</div>';
        return;
    }

    let html = '';
    for (const key of [...bookmarks].sort()) {
        const [h, p] = key.split(':').map(Number);
        const entry = window.completeMapping.get(key);
        if (!entry) continue;

        const gp = currentGenePairs.find(g => g.helix === h && g.pair === p);
        if (!gp) continue;

        const combos = getCombosForEntry(gp);
        const curPair = currentPairStr(gp);
        const curCombo = combos.find(c => c.pairStr === curPair);

        const pairKey = `bkm-${h}-${p}`;
        let dropdownHtml = `<div class="custom-dropdown" id="dropdown-${pairKey}">
            <div class="selected-option" onclick="toggleDropdown('${pairKey}')">
                <span class="value-part">${curCombo ? getComboAnnotation(curCombo, entry) : curCombo.value}</span>
                <span class="bases-part">${coloredPairSpans(curPair)}</span>
                <span class="arrow">▼</span>
            </div>
            <div class="dropdown-options" style="display:none;">`;

        for (const combo of combos) {
            const selectedClass = combo.pairStr === curPair ? ' selected' : '';
            dropdownHtml +=
                `<div class="option-item${selectedClass}"
                      data-value="${combo.value}"
                      data-pair="${combo.pairStr}"
                      onclick="selectOption('${pairKey}', '${combo.pairStr}', this)">
                      <span class="value-part">${getComboAnnotation(combo, entry)}</span>
                      <span class="bases-part">${coloredPairSpans(combo.pairStr)}</span>
                  </div>`;
        }
        dropdownHtml += `</div></div>`;

        html += `<div class="bookmark-item">
            <div class="bookmark-info" title="${entry.title}"
                 onclick="scrollToPair(${h},${p})" style="cursor:pointer; flex:1;">
                <strong>H${h}P${p}:</strong> ${entry.desc}
            </div>
            ${dropdownHtml}
            <button class="remove-bookmark"
                    onclick="event.stopPropagation(); removeBookmark('${key}')">✖</button>
        </div>`;
    }
    container.innerHTML = html;
};

// ---------- Fixed‑position dropdown handling ----------
function toggleDropdown(pairKey) {
    const dropdown = document.getElementById(`dropdown-${pairKey}`);
    if (!dropdown) return;
    const options = dropdown.querySelector('.dropdown-options');
    const isOpen = options.style.display === 'block';
    closeAllDropdowns();
    if (!isOpen) {
        // Calculate position
        const selected = dropdown.querySelector('.selected-option');
        const rect = selected.getBoundingClientRect();
        options.style.top = rect.bottom + 4 + 'px';
        options.style.left = rect.left + 'px';
        options.style.minWidth = rect.width + 'px';   // match width
        options.style.display = 'block';
    }
}

function selectOption(pairKey, pairStr, element) {
    const dropdown = document.getElementById(`dropdown-${pairKey}`);
    if (!dropdown) return;

    // Extract helix/pair
    let helix, pair;
    const tr = dropdown.closest('tr');
    if (tr) {
        helix = parseInt(tr.dataset.helix);
        pair = parseInt(tr.dataset.pair);
    } else {
        // Bookmark: id like "bkm-5-3"
        const parts = pairKey.replace('bkm-', '').split('-');
        if (parts.length === 2) {
            helix = parseInt(parts[0]);
            pair = parseInt(parts[1]);
        }
    }

    if (helix !== undefined && pair !== undefined) {
        applyCombinationChange(helix, pair, pairStr);
    }
    closeAllDropdowns();
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-options').forEach(opt => opt.style.display = 'none');
}

// Close when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-dropdown')) {
        closeAllDropdowns();
    }
});

// Close on scroll/resize (recalculate position is lost)
window.addEventListener('scroll', closeAllDropdowns, true);
window.addEventListener('resize', closeAllDropdowns);

// ---------- Core update: change a gene’s allele pair ----------
function applyCombinationChange(helix, pair, newPairStr) {
    const gp = currentGenePairs.find(g => g.helix === helix && g.pair === pair);
    if (!gp) return;
    const combos = getCombosForEntry(gp);
    const chosen = combos.find(c => c.pairStr === newPairStr);
    if (!chosen) return;

    gp.allele1 = chosen.allele1;
    gp.allele2 = chosen.allele2;

    syncTextareaFromTable();          // update raw text + URL
    renderTable();                    // redraw table
    renderBookmarksList();            // update bookmark dropdowns
}

// ---------- Disable removed features ----------
window.toggleCompareMode = function () {};
window.onCompareInput = function () {};
window.removeDiversity = function () {};
window.randomDiversity = function () {};

// Neutralise removed button event listeners (they exist but are hidden)
document.getElementById('compareGeneInput').addEventListener('input', function(){});
document.getElementById('toggleCompareBtn').addEventListener('click', function(){});
document.getElementById('removeDiversityBtn').addEventListener('click', function(){});
document.getElementById('randomDiversityBtn').addEventListener('click', function(){});

// ---------- Ensure scrolling still works ----------
window.scrollToPair = function (h, p) {
    const row = document.querySelector(`tr[data-helix="${h}"][data-pair="${p}"]`);
    if (row) {
        row.scrollIntoView({ behavior: 'instant', block: 'start' });
        row.classList.add('helix-highlight');
        setTimeout(() => row.classList.remove('helix-highlight'), 1000);
    }
};

const _originalLoadBookmarks = loadBookmarks;
loadBookmarks = function () {
    _originalLoadBookmarks();
    if (bookmarks.size === 0) {
        // Bookmark keys: "helix:pair" with zero‑based pair index
        const defaults = [
            '1:9',   // LITTER_SIZE
            '1:10',  // OLD_AGE
            '1:11',  // OMNIVORE
            '12:0',  // TEETH_SHAPE
            '12:1'   // HAS_MOUTH
        ];
        defaults.forEach(key => bookmarks.add(key));
        saveBookmarks();          // saves to localStorage & refreshes the bookmark list
    }
};