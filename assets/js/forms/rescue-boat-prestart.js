(() => {
  'use strict';
  const sections = [{"number": "1", "title": "PERSONNEL FIT FOR DUTY", "page": 1, "items": [["1.1", "Crew present and accounted for and fit for Duty"], ["1.2", "Required PPE available and serviceable"], ["1.3", "Lifejackets inspected and worn"], ["1.4", "Crew aware of assigned duties"], ["1.5", "Emergency response procedures reviewed"], ["1.6", "Crew aware of current work scope"]]}, {"number": "2", "title": "RESCUE BOAT READINESS", "page": 1, "items": [["2.1", "Hull Check & Serviceable"], ["2.2", "Bilge Checked"], ["2.3", "Fuel Sufficient for shift"], ["2.4", "Engine started and tested"], ["2.5", "Steering operational"], ["2.6", "Throttle Controls operating Correctly"], ["2.7", "Battery Condition Satisfactory"], ["2.8", "Emergency Lights functional and working"]]}, {"number": "2", "title": "RESCUE BOAT READINESS (continued)", "page": 2, "continuation": true, "items": [["2.9", "Nav lights working"], ["2.10", "Cabin Lights working"]]}, {"number": "3", "title": "RESCUE EQUIPMENT CHECK", "page": 2, "items": [["3.1", "Life Ring with Light Available"], ["3.2", "Throw Line Available and ready for Deployment"], ["3.3", "Rescue Sling Available"], ["3.4", "Boat Hook Available"], ["3.5", "First Aid Kit complete"], ["3.6", "Emergency Knife Available"], ["3.7", "Stretcher Available (If required)"], ["3.8", "Additional Rescue equipment serviceable"]]}, {"number": "4", "title": "WORK AREA REVIEW", "page": 2, "items": [["4.1", "Assigned loading bay identified"], ["4.2", "Shift work scope reviewed"], ["4.3", "Number of personnel working over water confirmed"], ["4.5", "Emergency recovery points identified"], ["4.6", "Safe access routes confirmed"], ["4.7", "Emergency evacuation arrangements reviewed"]]}, {"number": "5", "title": "BARGE MOVEMENTS & OPS AWARENESS", "page": 2, "items": [["5.1", "Barge movement schedule reviewed"], ["5.2", "Current loading activities reviewed"], ["5.3", "Loading Supervisor briefing completed"], ["5.4", "Exclusion zones identified"], ["5.5", "Marine hazards communicated to crew"], ["5.6", "Rescue boat position agreed and maintained clear of operations"]]}, {"number": "6", "title": "RADIO COMMUNICATION VERIFICATION", "page": 2, "items": [["6.1", "VHF Radio operational"], ["6.2", "Handheld radio operational – charged"]]}, {"number": "6", "title": "RADIO COMMUNICATION VERIFICATION (continued)", "page": 3, "continuation": true, "items": [["6.3", "Communication check completed with Loading Supervisor"], ["6.4", "Communication check completed with Control Room"], ["6.5", "Working channel confirmed"], ["6.6", "Emergency channel confirmed"], ["6.7", "Spare radio battery available"], ["6.8", "Crew understand call sign and reporting requirements"]]}, {"number": "7", "title": "MAN OVERBOARD (MOB) READINESS", "page": 3, "items": [["7.1", "Rescue sling available"], ["7.2", "Roles and responsibilities understood"], ["7.3", "Life ring available"], ["7.4", "Boat hook available"], ["7.5", "Casualty recovery method reviewed"], ["7.6", "Recovery points identified"], ["7.7", "First aid kit complete"], ["7.8", "Stretcher available"], ["7.9", "Nearest evacuation point identified"], ["7.10", "Crew have discussed MOB response procedure"]]}, {"number": "8", "title": "STANDBY POSITION VERIFICATION", "page": 3, "items": [["8.1", "Rescue boat positioned at designated standby point"], ["8.2", "Clear operating area maintained"], ["8.3", "Rescue route to worksite clear"], ["8.4", "Anchor/mooring arrangement suitable"], ["8.5", "Crew maintaining continuous watch"]]}, {"number": "9", "title": "NIGHT SHIFT ADDITIONAL CHECKS", "page": 3, "items": [["9.1", "Navigation lights operational"]]}, {"number": "9", "title": "NIGHT SHIFT ADDITIONAL CHECKS (continued)", "page": 4, "continuation": true, "items": [["9.2", "Searchlight tested"], ["9.3", "Handheld torches available"], ["9.4", "Spare batteries available"], ["9.5", "Loading bay lighting operational"], ["9.6", "Visibility limitations discussed"], ["9.7", "Night recovery points confirmed"]]}];
  const form = document.querySelector('#rescue-boat-form');
  const confirmation = document.querySelector('#confirmation');
  const formError = document.querySelector('#form-error');
  const submitButton = form.querySelector('button[type="submit"]');
  const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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

  [1,2,3,4].forEach((page) => { document.querySelector(`#rescue-page-${page}`).innerHTML = renderPage(page); });

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
  if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0,10);

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

  function copyLiveControlState(sourcePage, clonedPage) {
    const sourceControls = [...sourcePage.querySelectorAll('input, select, textarea')];
    const clonedControls = [...clonedPage.querySelectorAll('input, select, textarea')];

    sourceControls.forEach((sourceControl, index) => {
      const clonedControl = clonedControls[index];
      if (!clonedControl) return;

      if (sourceControl instanceof HTMLInputElement) {
        clonedControl.value = sourceControl.value;
        clonedControl.checked = sourceControl.checked;
        if (sourceControl.checked) clonedControl.setAttribute('checked', 'checked');
        else clonedControl.removeAttribute('checked');
      } else if (sourceControl instanceof HTMLSelectElement) {
        clonedControl.value = sourceControl.value;
        [...clonedControl.options].forEach((option) => {
          option.selected = option.value === sourceControl.value;
        });
      } else if (sourceControl instanceof HTMLTextAreaElement) {
        clonedControl.value = sourceControl.value;
        clonedControl.textContent = sourceControl.value;
        clonedControl.style.height = `${Math.max(72, sourceControl.scrollHeight)}px`;
      }
    });
  }

  function createFixedPdfPages() {
    const renderRoot = document.createElement('div');
    renderRoot.className = 'rescue-pdf-render-root';
    renderRoot.setAttribute('aria-hidden', 'true');

    const sourcePages = [...document.querySelectorAll('.rescue-print-page')];
    const clonedPages = sourcePages.map((sourcePage) => {
      const clonedPage = sourcePage.cloneNode(true);
      clonedPage.classList.add('rescue-pdf-render-page');
      copyLiveControlState(sourcePage, clonedPage);
      renderRoot.appendChild(clonedPage);
      return clonedPage;
    });

    document.body.appendChild(renderRoot);
    return { renderRoot, clonedPages };
  }

  async function createPdfBase64() {
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
      throw new Error('PDF libraries did not load. Refresh the page and try again.');
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4', compress:true });
    const { renderRoot, clonedPages } = createFixedPdfPages();

    try {
      if (document.fonts?.ready) await document.fonts.ready;

      for (let index = 0; index < clonedPages.length; index += 1) {
        const page = clonedPages[index];
        const canvas = await window.html2canvas(page, {
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1200,
          width: page.scrollWidth,
          height: page.scrollHeight
        });

        const image = canvas.toDataURL('image/jpeg', 0.9);
        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const canvasRatio = canvas.width / canvas.height;
        const pageRatio = pageWidthMm / pageHeightMm;

        let imageWidthMm;
        let imageHeightMm;
        if (canvasRatio > pageRatio) {
          imageWidthMm = pageWidthMm;
          imageHeightMm = pageWidthMm / canvasRatio;
        } else {
          imageHeightMm = pageHeightMm;
          imageWidthMm = pageHeightMm * canvasRatio;
        }

        const offsetX = (pageWidthMm - imageWidthMm) / 2;
        const offsetY = (pageHeightMm - imageHeightMm) / 2;

        if (index > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(image, 'JPEG', offsetX, offsetY, imageWidthMm, imageHeightMm, undefined, 'FAST');
      }

      return pdf.output('datauristring').split(',')[1];
    } finally {
      renderRoot.remove();
    }
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    confirmation.hidden = true;
    confirmation.classList.remove('alert-danger');
    formError.hidden = true;
    form.classList.add('was-validated');
    const answered = form.querySelector('input[name^="result-"]:checked');
    if (!form.checkValidity() || !answered) {
      formError.hidden = false;
      (form.querySelector(':invalid') || formError).scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparing PDF and submitting...';
    try {
      const payload = collectPayload();
      payload.pdfBase64 = await createPdfBase64();
      const result = await window.Argo.API.submit(payload);
      confirmation.innerHTML = `<strong><i class="bi bi-check-circle-fill me-2"></i>Checklist submitted successfully.</strong><div class="mt-2">Submission ID: <code>${result.submissionId || 'Created'}</code>${result.sharePointItemId ? `<br>SharePoint item: <code>${result.sharePointItemId}</code>` : ''}</div>`;
      confirmation.hidden = false;

      // Clear the completed form after a confirmed successful submission so the
      // same data cannot be accidentally submitted again. Keep the success
      // confirmation visible and reset the default inspection date to today.
      preserveConfirmationOnReset = true;
      form.reset();
      preserveConfirmationOnReset = false;

      confirmation.scrollIntoView({behavior:'smooth', block:'center'});
    } catch (error) {
      confirmation.classList.add('alert-danger');
      confirmation.innerHTML = `<strong><i class="bi bi-exclamation-triangle-fill me-2"></i>Submission failed.</strong><div class="mt-2">${error.message}</div>`;
      confirmation.hidden = false;
      confirmation.scrollIntoView({behavior:'smooth', block:'center'});
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="bi bi-send me-1"></i>Submit checklist';
    }
  });

  form.addEventListener('reset', () => setTimeout(() => {
    form.classList.remove('was-validated');
    formError.hidden = true;
    if (!preserveConfirmationOnReset) {
      confirmation.hidden = true;
    }
    dateInput.value = new Date().toISOString().slice(0,10);
    commentTextareas.forEach((textarea) => autoExpandTextarea(textarea));
  },0));
})();
