(() => {
  'use strict';

  const sections = [
    { number:'1', title:'PERSONNEL FIT FOR DUTY', page:1, items:[['1.1','Crew present and accounted for and fit for Duty'],['1.2','Required PPE available and serviceable'],['1.3','Lifejackets inspected and worn'],['1.4','Crew aware of assigned duties'],['1.5','Emergency response procedures reviewed'],['1.6','Crew aware of current work scope']] },
    { number:'2', title:'RESCUE BOAT READINESS', page:1, items:[['2.1','Hull Check & Serviceable'],['2.2','Bilge Checked'],['2.3','Fuel Sufficient for shift'],['2.4','Engine started and tested'],['2.5','Steering operational'],['2.6','Throttle Controls operating Correctly'],['2.7','Battery Condition Satisfactory'],['2.8','Emergency Lights functional and working']] },
    { number:'2', title:'RESCUE BOAT READINESS (continued)', page:2, continuation:true, items:[['2.9','Nav lights working'],['2.10','Cabin Lights working']] },
    { number:'3', title:'RESCUE EQUIPMENT CHECK', page:2, items:[['3.1','Life Ring with Light Available'],['3.2','Throw Line Available and ready for Deployment'],['3.3','Rescue Sling Available'],['3.4','Boat Hook Available'],['3.5','First Aid Kit complete'],['3.6','Emergency Knife Available'],['3.7','Stretcher Available (If required)'],['3.8','Additional Rescue equipment serviceable']] },
    { number:'4', title:'WORK AREA REVIEW', page:2, items:[['4.1','Assigned loading bay identified'],['4.2','Shift work scope reviewed'],['4.3','Number of personnel working over water confirmed'],['4.5','Emergency recovery points identified'],['4.6','Safe access routes confirmed'],['4.7','Emergency evacuation arrangements reviewed']] },
    { number:'5', title:'BARGE MOVEMENTS & OPS AWARENESS', page:2, items:[['5.1','Barge movement schedule reviewed'],['5.2','Current loading activities reviewed'],['5.3','Loading Supervisor briefing completed'],['5.4','Exclusion zones identified'],['5.5','Marine hazards communicated to crew'],['5.6','Rescue boat position agreed and maintained clear of operations']] },
    { number:'6', title:'RADIO COMMUNICATION VERIFICATION', page:2, items:[['6.1','VHF Radio operational'],['6.2','Handheld radio operational – charged']] },
    { number:'6', title:'RADIO COMMUNICATION VERIFICATION (continued)', page:3, continuation:true, items:[['6.3','Communication check completed with Loading Supervisor'],['6.4','Communication check completed with Control Room'],['6.5','Working channel confirmed'],['6.6','Emergency channel confirmed'],['6.7','Spare radio battery available'],['6.8','Crew understand call sign and reporting requirements']] },
    { number:'7', title:'MAN OVERBOARD (MOB) READINESS', page:3, items:[['7.1','Rescue sling available'],['7.2','Roles and responsibilities understood'],['7.3','Life ring available'],['7.4','Boat hook available'],['7.5','Casualty recovery method reviewed'],['7.6','Recovery points identified'],['7.7','First aid kit complete'],['7.8','Stretcher available'],['7.9','Nearest evacuation point identified'],['7.10','Crew have discussed MOB response procedure']] },
    { number:'8', title:'STANDBY POSITION VERIFICATION', page:3, items:[['8.1','Rescue boat positioned at designated standby point'],['8.2','Clear operating area maintained'],['8.3','Rescue route to worksite clear'],['8.4','Anchor/mooring arrangement suitable'],['8.5','Crew maintaining continuous watch']] },
    { number:'9', title:'NIGHT SHIFT ADDITIONAL CHECKS', page:3, items:[['9.1','Navigation lights operational']] },
    { number:'9', title:'NIGHT SHIFT ADDITIONAL CHECKS (continued)', page:4, continuation:true, items:[['9.2','Searchlight tested'],['9.3','Handheld torches available'],['9.4','Spare batteries available'],['9.5','Loading bay lighting operational'],['9.6','Visibility limitations discussed'],['9.7','Night recovery points confirmed']] }
  ];

  const form = document.querySelector('#rescue-boat-form');
  const confirmation = document.querySelector('#confirmation');
  const formError = document.querySelector('#form-error');
  const submitButton = form.querySelector('button[type="submit"]');
  const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const PDF_WIDTH = 794;
  const PDF_HEIGHT = 1123;
  const LONG_COMMENT_THRESHOLD = 220;
  let preserveConfirmationOnReset = false;

  function renderPage(page) {
    return sections.filter((section) => section.page === page).map((section) => `
      <tr class="rescue-section-row"><th>${section.continuation ? '' : section.number}</th><th colspan="4">${section.title}</th></tr>
      ${section.items.map(([number, text]) => {
        const id = slug(number);
        return `<tr class="rescue-item-row" data-section="${section.title.replace(' (continued)', '')}" data-number="${number}" data-item="${text}">
          <td class="rescue-item-number">${number}</td>
          <td class="rescue-item-text">${text}</td>
          <td class="rescue-choice"><input type="radio" id="${id}-yes" name="result-${id}" value="Yes" aria-label="Yes: ${text}"></td>
          <td class="rescue-choice"><input type="radio" id="${id}-no" name="result-${id}" value="No" aria-label="No: ${text}"></td>
          <td class="rescue-comment"><textarea name="comment-${id}" aria-label="Comments or corrective actions: ${text}" maxlength="1000"></textarea></td>
        </tr>`;
      }).join('')}`).join('');
  }

  [1, 2, 3, 4].forEach((page) => {
    document.querySelector(`#rescue-page-${page}`).innerHTML = renderPage(page);
  });

  function autoExpandTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(72, textarea.scrollHeight)}px`;
  }

  const commentTextareas = [...form.querySelectorAll('.rescue-comment textarea')];
  commentTextareas.forEach((textarea) => {
    autoExpandTextarea(textarea);
    textarea.addEventListener('input', () => autoExpandTextarea(textarea));
    textarea.addEventListener('change', () => autoExpandTextarea(textarea));
  });

  const dateInput = form.elements.inspectionDate;
  if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

  function collectChecklist() {
    return [...form.querySelectorAll('.rescue-item-row')].map((row) => {
      const id = slug(row.dataset.number);
      return {
        section: row.dataset.section,
        number: row.dataset.number,
        item: row.dataset.item,
        result: form.querySelector(`input[name="result-${id}"]:checked`)?.value || '',
        comments: form.elements[`comment-${id}`]?.value?.trim() || ''
      };
    });
  }

  function collectPayload() {
    const data = new FormData(form);
    return {
      formType: 'RESCUE_BOAT_PRESTART',
      department: 'Marine',
      documentTitle: 'Rescue Boat Shift Pre-Start Checklist',
      inspectionDate: data.get('inspectionDate') || '',
      location: data.get('location') || '',
      vesselId: data.get('vesselId') || '',
      workingChannel: data.get('workingChannel') || '',
      shift: data.get('shift') || '',
      skipper: data.get('skipper') || '',
      deckhand: data.get('deckhand') || '',
      weather: data.get('weather') || '',
      startShift: data.get('startShift') || '',
      tide: data.get('tide') || '',
      endShift: data.get('endShift') || '',
      seaState: data.get('seaState') || '',
      totalHours: data.get('totalHours') || '',
      checklist: collectChecklist(),
      declaration: 'The Rescue Boat Team confirms that all pre-start checks have been completed, communications have been verified, emergency response arrangements reviewed, and the rescue craft is immediately available to respond to a Man Overboard or waterfront emergency.',
      signoffSkipper: data.get('signoffSkipper') || '',
      signature: data.get('signature') || '',
      signoffTime: data.get('signoffTime') || '',
      crew: data.get('crew') || ''
    };
  }

  function mergeLogicalSections() {
    const merged = [];
    sections.forEach((section) => {
      const title = section.title.replace(/\s*\(continued\)$/i, '');
      const previous = merged[merged.length - 1];
      if (previous && previous.number === section.number && previous.title === title) {
        previous.items.push(...section.items);
      } else {
        merged.push({ number:section.number, title, items:[...section.items] });
      }
    });
    return merged;
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function createPdfHeader(payload, compact) {
    const header = createElement('header', compact ? 'rescue-pdf-header is-compact' : 'rescue-pdf-header');
    const image = document.querySelector('.rescue-title-header img')?.cloneNode(true) || createElement('span');
    image.removeAttribute?.('id');
    header.appendChild(image);

    const text = createElement('div', 'rescue-pdf-header-copy');
    text.appendChild(createElement('h1', '', 'RESCUE BOAT SHIFT PRE-START CHECKLIST'));
    text.appendChild(createElement('p', '', compact
      ? `Vessel ${payload.vesselId || '—'} · ${payload.inspectionDate || 'Date not supplied'} · continued`
      : 'This Inspection Checklist is to be completed each day, once before start of Operations by shift'));
    header.appendChild(text);
    return header;
  }

  function createDetailField(label, value) {
    const field = createElement('div', 'rescue-pdf-detail-field');
    field.appendChild(createElement('div', 'rescue-pdf-detail-label', label));
    field.appendChild(createElement('div', 'rescue-pdf-detail-value', value || ''));
    return field;
  }

  function createShiftDetails(payload) {
    const fields = createElement('section', 'rescue-pdf-details');
    [
      ['Date', payload.inspectionDate],
      ['Location', payload.location],
      ['Vessel ID', payload.vesselId],
      ['Working Channel', payload.workingChannel],
      ['Shift AM / PM', payload.shift],
      ['Skipper', payload.skipper],
      ['Deckhand (AB)', payload.deckhand],
      ['Weather', payload.weather],
      ['Start Shift', payload.startShift],
      ['Tide', payload.tide],
      ['End Shift', payload.endShift],
      ['Sea State', payload.seaState],
      ['Total Hrs', payload.totalHours]
    ].forEach(([label, value]) => fields.appendChild(createDetailField(label, value)));
    return fields;
  }

  function createPdfPage(exportHost, payload, isFirstPage) {
    const page = createElement('article', 'rescue-pdf-page');
    page.appendChild(createPdfHeader(payload, !isFirstPage));
    if (isFirstPage) page.appendChild(createShiftDetails(payload));

    const body = createElement('div', 'rescue-pdf-page-body');
    page.appendChild(body);
    const footer = createElement('div', 'rescue-pdf-footer');
    page.appendChild(footer);
    exportHost.appendChild(page);

    return { element:page, body, footer, table:null, tbody:null };
  }

  function createChecklistTable(page) {
    const table = createElement('table', 'rescue-pdf-checklist');
    const colgroup = document.createElement('colgroup');
    ['number', 'item', 'yes', 'no', 'comment'].forEach((name) => {
      const col = document.createElement('col');
      col.className = `col-${name}`;
      colgroup.appendChild(col);
    });
    table.appendChild(colgroup);

    const thead = document.createElement('thead');
    const first = document.createElement('tr');
    first.appendChild(createElement('th', '', '#'));
    first.appendChild(createElement('th', 'is-left', 'ITEM'));
    const satisfactory = createElement('th', '', 'Satisfactory');
    satisfactory.colSpan = 2;
    first.appendChild(satisfactory);
    const comments = createElement('th', '', 'Comments or Corrective Actions');
    comments.rowSpan = 2;
    first.appendChild(comments);
    thead.appendChild(first);

    const second = document.createElement('tr');
    second.appendChild(createElement('th'));
    second.appendChild(createElement('th'));
    second.appendChild(createElement('th', '', 'YES'));
    second.appendChild(createElement('th', '', 'NO'));
    thead.appendChild(second);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    page.body.appendChild(table);
    page.table = table;
    page.tbody = tbody;
    return table;
  }

  function ensureChecklistTable(page) {
    if (!page.table) createChecklistTable(page);
  }

  function createSectionRow(section, continued) {
    const row = createElement('tr', 'rescue-pdf-section-row');
    row.appendChild(createElement('th', 'rescue-pdf-section-number', continued ? '' : section.number));
    const title = createElement('th', '', `${section.title}${continued ? ' — continued' : ''}`);
    title.colSpan = 4;
    row.appendChild(title);
    return row;
  }

  function createRadioMarker(selected) {
    return createElement('span', selected ? 'rescue-pdf-radio is-selected' : 'rescue-pdf-radio');
  }

  function createItemRow(item, commentText) {
    const row = createElement('tr', 'rescue-pdf-item-row');
    row.appendChild(createElement('td', 'rescue-pdf-item-number', item.number));
    row.appendChild(createElement('td', 'rescue-pdf-item-text', item.item));

    const yes = createElement('td', 'rescue-pdf-choice');
    yes.appendChild(createRadioMarker(item.result === 'Yes'));
    row.appendChild(yes);

    const no = createElement('td', 'rescue-pdf-choice');
    no.appendChild(createRadioMarker(item.result === 'No'));
    row.appendChild(no);

    row.appendChild(createElement('td', 'rescue-pdf-comment', commentText || ''));
    return row;
  }

  function splitTextIntoChunks(text, maximumLength = 700) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const chunks = [];
    let current = '';
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maximumLength && current) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  }

  function createCorrectiveDetailRow(detail, continued) {
    const row = createElement('tr', 'rescue-pdf-corrective-row');
    const cell = createElement('td');
    cell.colSpan = 5;

    const heading = createElement('div', 'rescue-pdf-corrective-heading',
      `Corrective Action Detail ${detail.reference}${continued ? ' — continued' : ''}`);
    cell.appendChild(heading);
    cell.appendChild(createElement('div', 'rescue-pdf-corrective-meta',
      `${detail.number} · ${detail.item}`));
    cell.appendChild(createElement('div', 'rescue-pdf-corrective-text', detail.text));
    row.appendChild(cell);
    return row;
  }

  function pageFits(page) {
    void page.element.offsetHeight;
    return page.body.scrollHeight <= page.body.clientHeight + 1;
  }

  function pageHasRows(page) {
    return Boolean(page.tbody && page.tbody.children.length);
  }

  function removeRows(rows) {
    rows.forEach((row) => row.remove());
  }

  function prepareSection(section, checklistByNumber, detailCounter) {
    const details = [];
    const items = section.items.map(([number, fallbackText]) => {
      const response = checklistByNumber.get(number) || {};
      const item = {
        number,
        item: response.item || fallbackText,
        result: response.result || '',
        comments: response.comments || ''
      };

      const isLong = item.comments.length > LONG_COMMENT_THRESHOLD || item.comments.split(/\r?\n/).length > 4;
      if (isLong) {
        detailCounter.value += 1;
        const reference = `CA-${String(detailCounter.value).padStart(2, '0')}`;
        details.push({ reference, number:item.number, item:item.item, text:item.comments });
        item.displayComment = `See Corrective Action Detail ${reference}`;
      } else {
        item.displayComment = item.comments;
      }
      return item;
    });
    return { section, items, details };
  }

  function appendWholeSection(page, prepared, continued = false) {
    ensureChecklistTable(page);
    const rows = [createSectionRow(prepared.section, continued)];
    prepared.items.forEach((item) => rows.push(createItemRow(item, item.displayComment)));
    prepared.details.forEach((detail) => {
      splitTextIntoChunks(detail.text).forEach((chunk, index) => {
        rows.push(createCorrectiveDetailRow({ ...detail, text:chunk }, index > 0));
      });
    });
    rows.forEach((row) => page.tbody.appendChild(row));
    return rows;
  }

  function appendSectionWithPagination(currentPage, prepared, createNextPage) {
    const wholeRows = appendWholeSection(currentPage, prepared, false);
    if (pageFits(currentPage)) return currentPage;
    removeRows(wholeRows);

    if (pageHasRows(currentPage)) {
      currentPage = createNextPage();
      const retryRows = appendWholeSection(currentPage, prepared, false);
      if (pageFits(currentPage)) return currentPage;
      removeRows(retryRows);
    }

    ensureChecklistTable(currentPage);
    let heading = createSectionRow(prepared.section, false);
    currentPage.tbody.appendChild(heading);
    let itemCountOnPage = 0;

    prepared.items.forEach((item) => {
      let row = createItemRow(item, item.displayComment);
      currentPage.tbody.appendChild(row);
      if (!pageFits(currentPage)) {
        row.remove();
        if (itemCountOnPage === 0) heading.remove();
        currentPage = createNextPage();
        ensureChecklistTable(currentPage);
        heading = createSectionRow(prepared.section, true);
        currentPage.tbody.appendChild(heading);
        row = createItemRow(item, item.displayComment);
        currentPage.tbody.appendChild(row);
      }
      itemCountOnPage += 1;
    });

    prepared.details.forEach((detail) => {
      const chunks = splitTextIntoChunks(detail.text);
      chunks.forEach((chunk, chunkIndex) => {
        let detailRow = createCorrectiveDetailRow({ ...detail, text:chunk }, chunkIndex > 0);
        currentPage.tbody.appendChild(detailRow);
        if (!pageFits(currentPage)) {
          detailRow.remove();
          currentPage = createNextPage();
          ensureChecklistTable(currentPage);
          currentPage.tbody.appendChild(createSectionRow(prepared.section, true));
          detailRow = createCorrectiveDetailRow({ ...detail, text:chunk }, chunkIndex > 0);
          currentPage.tbody.appendChild(detailRow);
        }
      });
    });

    return currentPage;
  }

  function createSignoff(payload) {
    const signoff = createElement('section', 'rescue-pdf-signoff');
    signoff.appendChild(createElement('h2', '', 'SIGN OFF'));
    signoff.appendChild(createElement('h3', '', 'RESCUE BOAT READINESS DECLARATION'));
    signoff.appendChild(createElement('p', '', payload.declaration));

    const grid = createElement('div', 'rescue-pdf-signoff-grid');
    [
      ['Skipper', payload.signoffSkipper],
      ['Signature / acknowledgement', payload.signature],
      ['Time', payload.signoffTime],
      ['Crew', payload.crew]
    ].forEach(([label, value]) => grid.appendChild(createDetailField(label, value)));
    signoff.appendChild(grid);
    return signoff;
  }

  async function waitForAssets(root) {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = [...root.querySelectorAll('img')];
    await Promise.all(images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once:true });
        image.addEventListener('error', resolve, { once:true });
      });
    }));
  }

  async function createPdfBase64(payload) {
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
      throw new Error('PDF libraries did not load. Refresh the page and try again.');
    }

    const exportHost = createElement('div', 'rescue-pdf-export-host');
    document.body.appendChild(exportHost);

    try {
      await waitForAssets(document);
      const pages = [];
      const createPage = (isFirst = false) => {
        const page = createPdfPage(exportHost, payload, isFirst);
        pages.push(page);
        return page;
      };

      let currentPage = createPage(true);
      const logicalSections = mergeLogicalSections();
      const checklistByNumber = new Map(payload.checklist.map((item) => [item.number, item]));
      const detailCounter = { value:0 };

      logicalSections.forEach((section) => {
        const prepared = prepareSection(section, checklistByNumber, detailCounter);
        currentPage = appendSectionWithPagination(currentPage, prepared, () => createPage(false));
      });

      const signoff = createSignoff(payload);
      currentPage.body.appendChild(signoff);
      if (!pageFits(currentPage)) {
        signoff.remove();
        currentPage = createPage(false);
        currentPage.body.appendChild(signoff);
      }

      pages.forEach((page, index) => {
        page.footer.textContent = `Page ${index + 1} of ${pages.length}`;
      });

      await waitForAssets(exportHost);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4', compress:true });

      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await window.html2canvas(pages[index].element, {
          scale:2,
          useCORS:true,
          backgroundColor:'#ffffff',
          logging:false,
          width:PDF_WIDTH,
          height:PDF_HEIGHT,
          windowWidth:PDF_WIDTH,
          windowHeight:PDF_HEIGHT,
          scrollX:0,
          scrollY:0
        });
        const image = canvas.toDataURL('image/jpeg', 0.93);
        if (index > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(image, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      return pdf.output('datauristring').split(',')[1];
    } finally {
      exportHost.remove();
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    confirmation.hidden = true;
    confirmation.classList.remove('alert-danger');
    formError.hidden = true;
    form.classList.add('was-validated');

    const answered = form.querySelector('input[name^="result-"]:checked');
    if (!form.checkValidity() || !answered) {
      formError.hidden = false;
      (form.querySelector(':invalid') || formError).scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparing PDF and submitting...';

    try {
      const payload = collectPayload();
      payload.pdfBase64 = await createPdfBase64(payload);
      const result = await window.Argo.API.submit(payload);

      confirmation.innerHTML = `<strong><i class="bi bi-check-circle-fill me-2"></i>Checklist submitted successfully.</strong><div class="mt-2">Submission ID: <code>${result.submissionId || 'Created'}</code>${result.sharePointItemId ? `<br>SharePoint item: <code>${result.sharePointItemId}</code>` : ''}</div>`;
      confirmation.hidden = false;

      preserveConfirmationOnReset = true;
      form.reset();
      preserveConfirmationOnReset = false;
      confirmation.scrollIntoView({ behavior:'smooth', block:'center' });
    } catch (error) {
      confirmation.classList.add('alert-danger');
      confirmation.innerHTML = `<strong><i class="bi bi-exclamation-triangle-fill me-2"></i>Submission failed.</strong><div class="mt-2">${error.message}</div>`;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior:'smooth', block:'center' });
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="bi bi-send me-1"></i>Submit checklist';
    }
  });

  form.addEventListener('reset', () => setTimeout(() => {
    form.classList.remove('was-validated');
    formError.hidden = true;
    if (!preserveConfirmationOnReset) confirmation.hidden = true;
    dateInput.value = new Date().toISOString().slice(0, 10);
    commentTextareas.forEach((textarea) => autoExpandTextarea(textarea));
  }, 0));
})();
