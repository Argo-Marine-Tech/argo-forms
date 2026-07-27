(() => {
  'use strict';

  const checklist = [
    {
      page: 1,
      group: '1. PPE Usage',
      items: ['1.1 Head', '1.2 Eyes/Face', '1.3 Hearing', '1.4 Respiration', '1.5 Hands', '1.6 Feet', '1.7 Clothing', '1.8 Fall Protection', '1.9 Personal Flotation']
    },
    {
      page: 1,
      group: '2. Situational Awareness',
      items: ['2.1 Location of person', '2.2 Watching where going', '2.3 Watching while doing', '2.4 Awareness of pinch-points', '2.5 Awareness of slips/trips/falls', '2.6 Awareness of Deck Openings', '2.7 Competence of Crew', '2.8 Standing in line of Fire']
    },
    {
      page: 1,
      group: '3. Activity',
      items: ['3.1 Lifting / Lowering', '3.10 Bunkering/Liquid Transfer', '3.11 Cargo Work', '3.12 Using Portable Tools / Machinery', '3.13 Using Heavy Machinery', '3.2 Pushing / Pulling', '3.3 Climbing up/down', '3.4 Cutting/Burning', '3.5 Rigging / Connecting / Lashing', '3.6 Galley work', '3.7 Working at Height / Over side', '3.8 Working under Loads', '3.9 Working in Confined Space']
    },
    {
      page: 1,
      group: '4. Procedures',
      items: ['4.1 JSA/Toolbox/Job Preplanning', '4.2 Following Procedures', '4.3 Lock out/Tag out/Isolation', '4.4 Hot Work', '4.5 Confined Space', '4.6 Communications/Teamwork', '4.7 Pollution Prevention', '4.8 Waste Management']
    },
    {
      page: 2,
      group: '5. Conditions / Environment',
      items: ['5.1 Lighting/Illumination', '5.10 Falling / Lowering Objects', '5.11 Sharp Edges', '5.12 Slippery Surfaces', '5.13 Hot/Cold Surfaces', '5.14 Loading / Back loading Cargo', '5.15 Cargo Stowage', '5.16 Chemicals / Hazardous Materials', '5.17 Weather / Sea Conditions', '5.18 Safe Escape', '5.2 Temperature', '5.3 Noise', '5.4 Housekeeping', '5.5 Flammable/Explosive', '5.6 Live Energy', '5.7 Dust', '5.8 Oxygen Content', '5.9 Pinch-Points']
    },
    {
      page: 2,
      group: '6. Location',
      items: ['6.1 Alongside Dock', '6.2 On Sea Passage', '6.3 At Rig / Platform', '6.4 Alongside other vessel', '6.5 At Anchor', '6.6 Towing', '6.7 Anchor Operations', '6.8 Shipyard', "6.9 Other (client's facility)"]
    },
    {
      page: 2,
      group: '7. Location on Vessel / Installation',
      items: ['7.1 Back Deck', '7.2 Bridge', '7.3 Accommodation', '7.4 Engine Room', '7.5 Galley', '7.6 Passageway / Stairwell', '7.7 Machinery Space', '7.8 Equipment Storage Space', '7.9 At Height / Over side']
    },
    {
      page: 2,
      group: '8. Tools / Equipment',
      items: ['8.1 Tools / Machinery used to do job', '8.2 Condition of Tools / Machinery', '8.3 Inspection of Tools / Machinery', '8.4 Stowage of Tools / Machinery', '8.5 Guards or Barriers on Tools / Machinery', '8.6 Barricading Placed around Areas', '8.7 Adequate Signage']
    }
  ];

  const form = document.querySelector('#bbs-form');
  const confirmation = document.querySelector('#confirmation');
  const formError = document.querySelector('#form-error');
  const submitButton = form.querySelector('button[type="submit"]');
  const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const renderChecklist = (page) => checklist
    .filter((section) => section.page === page)
    .map((section) => `
      <tr class="group-row"><th colspan="4" scope="colgroup">${section.group}</th></tr>
      ${section.items.map((item) => {
        const id = slug(item);
        return `
          <tr class="checklist-row" data-group="${section.group}" data-item="${item}">
            <td class="item-label">${item}</td>
            <td>
              <label class="visually-hidden" for="${id}-stop">Stop Work for ${item}</label>
              <select id="${id}-stop" name="stop-${id}">
                <option value=""></option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </td>
            <td class="check-cell">
              <input type="radio" id="${id}-safe" name="assessment-${id}" value="Safe" aria-label="Safe: ${item}">
            </td>
            <td class="check-cell">
              <input type="radio" id="${id}-at-risk" name="assessment-${id}" value="At-Risk" aria-label="At-Risk: ${item}">
            </td>
          </tr>`;
      }).join('')}
    `).join('');

  document.querySelector('#checklist-page-1').innerHTML = renderChecklist(1);
  document.querySelector('#checklist-page-2').innerHTML = renderChecklist(2);

  const dateInput = document.querySelector('#observation-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  const collectChecklist = () => [...form.querySelectorAll('.checklist-row')]
    .map((row) => ({
      group: row.dataset.group,
      item: row.dataset.item,
      stopWork: row.querySelector('select[name^="stop-"]').value || null,
      assessment: row.querySelector('input[name^="assessment-"]:checked')?.value || null
    }))
    .filter((entry) => entry.stopWork || entry.assessment);

  const checked = (name) => form.querySelector(`input[name="${name}"]`)?.checked ? 'Yes' : 'No';
  const fieldValue = (selector) => form.querySelector(selector)?.value?.trim() || '';


  const replaceControlForPdf = (source, clone) => {
    const tagName = source.tagName.toLowerCase();
    const type = String(source.type || '').toLowerCase();
    let replacement;

    if (tagName === 'textarea') {
      replacement = document.createElement('div');
      replacement.className = 'pdf-textarea-value';
      replacement.textContent = source.value || '';
    } else if (tagName === 'select') {
      replacement = document.createElement('span');
      replacement.className = 'pdf-select-value';
      replacement.textContent = source.value || '';
    } else if (type === 'checkbox' || type === 'radio') {
      replacement = document.createElement('span');
      replacement.className = 'pdf-check-mark';
      replacement.textContent = source.checked ? 'X' : '';
      replacement.setAttribute('aria-label', source.checked ? 'Selected' : 'Not selected');
    } else {
      replacement = document.createElement('span');
      replacement.className = 'pdf-field-value';
      replacement.textContent = source.value || '';
    }

    clone.replaceWith(replacement);
  };

  const makePrintablePage = (children) => {
    const page = document.createElement('section');
    page.className = 'paper-form pdf-render-page';

    for (const child of children) {
      page.appendChild(child.cloneNode(true));
    }

    page.querySelectorAll('.form-actions, #form-error, .page-break-label').forEach((element) => element.remove());
    return page;
  };

  const synchronisePrintableControls = (sourcePage, printablePage) => {
    const sourceControls = [...sourcePage.querySelectorAll('input, select, textarea')];
    const printableControls = [...printablePage.querySelectorAll('input, select, textarea')];

    sourceControls.forEach((source, index) => {
      const clone = printableControls[index];
      if (clone) replaceControlForPdf(source, clone);
    });
  };

  const canvasToPdfPage = (pdf, canvas, addPage) => {
    if (addPage) pdf.addPage('a4', 'portrait');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 7;
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - (margin * 2);
    const imageRatio = canvas.width / canvas.height;

    let width = availableWidth;
    let height = width / imageRatio;
    if (height > availableHeight) {
      height = availableHeight;
      width = height * imageRatio;
    }

    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', x, y, width, height, undefined, 'FAST');
  };

  const createWebFormPdfBase64 = async () => {
    if (typeof window.html2canvas !== 'function' || !window.jspdf?.jsPDF) {
      throw new Error('The PDF generator could not be loaded. Please refresh the page and try again.');
    }

    const pageBreak = form.querySelector('.page-break-label');
    const allChildren = [...form.children];
    const breakIndex = allChildren.indexOf(pageBreak);
    const page1Source = document.createElement('div');
    const page2Source = document.createElement('div');

    allChildren.slice(0, breakIndex).forEach((child) => page1Source.appendChild(child.cloneNode(true)));
    allChildren.slice(breakIndex + 1).forEach((child) => page2Source.appendChild(child.cloneNode(true)));

    const sourceControls = [...form.querySelectorAll('input, select, textarea')];
    const page1ControlCount = allChildren.slice(0, breakIndex)
      .reduce((count, child) => count + child.querySelectorAll('input, select, textarea').length, 0);

    const page1 = makePrintablePage([...page1Source.children]);
    const page2 = makePrintablePage([...page2Source.children]);

    const page1Controls = [...page1.querySelectorAll('input, select, textarea')];
    sourceControls.slice(0, page1ControlCount).forEach((source, index) => {
      if (page1Controls[index]) replaceControlForPdf(source, page1Controls[index]);
    });

    const page2Controls = [...page2.querySelectorAll('input, select, textarea')];
    sourceControls.slice(page1ControlCount).forEach((source, index) => {
      if (page2Controls[index]) replaceControlForPdf(source, page2Controls[index]);
    });

    const host = document.createElement('div');
    host.className = 'pdf-render-host';
    host.append(page1, page2);
    document.body.appendChild(host);

    try {
      await Promise.all([...host.querySelectorAll('img')].map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }));

      if (document.fonts?.ready) await document.fonts.ready;

      const options = {
        backgroundColor: '#ffffff',
        scale: 1.5,
        useCORS: true,
        logging: false,
        windowWidth: 980
      };

      const [canvas1, canvas2] = await Promise.all([
        window.html2canvas(page1, options),
        window.html2canvas(page2, options)
      ]);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      canvasToPdfPage(pdf, canvas1, false);
      canvasToPdfPage(pdf, canvas2, true);
      return pdf.output('datauristring').split(',')[1];
    } finally {
      host.remove();
    }
  };

  const collectPayload = () => {
    const data = new FormData(form);
    return {
      formType: 'BBS',
      department: 'HSSEQ',
      vesselProject: fieldValue('#vessel-project'),
      client: fieldValue('#client'),
      observationDate: fieldValue('#observation-date'),
      reportedBy: fieldValue('#reported-by'),
      stopWork: checked('stopWork'),
      potential: checked('potential'),
      nearMiss: checked('nearMiss'),
      uaUc: checked('uaUc'),
      checklist: collectChecklist(),
      stopWorkPerformed: data.get('stopWorkPerformed') || '',
      stopWorkReason: data.get('stopWorkReason') || '',
      correctiveAction: data.get('correctiveAction') || '',
      hazardDescription: data.get('hazardDescription') || '',
      preventiveAction: data.get('preventiveAction') || '',
      managementComments: data.get('managementComments') || '',
      status: data.get('status') || ''
    };
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    confirmation.hidden = true;
    confirmation.classList.remove('alert-danger');
    formError.hidden = true;
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
      formError.hidden = false;
      form.querySelector(':invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Submitting...';

    try {
      const payload = collectPayload();
      payload.pdfBase64 = await createWebFormPdfBase64();
      const result = await window.Argo.API.submit(payload);
      confirmation.innerHTML = `<strong><i class="bi bi-check-circle-fill me-2"></i>Observation submitted successfully.</strong><div class="mt-2">Submission ID: <code>${result.submissionId || 'Created'}</code>${result.sharePointItemId ? `<br>SharePoint item: <code>${result.sharePointItemId}</code>` : ''}</div>`;
      confirmation.hidden = false;
      form.reset();
      dateInput.value = new Date().toISOString().slice(0, 10);
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      confirmation.classList.add('alert-danger');
      confirmation.innerHTML = `<strong><i class="bi bi-exclamation-triangle-fill me-2"></i>Submission failed.</strong><div class="mt-2">${error.message}</div>`;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="bi bi-send me-1"></i>Submit observation';
    }
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      form.classList.remove('was-validated');
      formError.hidden = true;
      dateInput.value = new Date().toISOString().slice(0, 10);
    }, 0);
  });
})();
