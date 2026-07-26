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
      const result = await window.Argo.API.submit(collectPayload());
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
