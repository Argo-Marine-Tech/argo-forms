(() => {
  'use strict';

  const checklist = {
    '1. PPE Usage': ['1.1 Head', '1.2 Eyes/Face', '1.3 Hearing', '1.4 Respiration', '1.5 Hands', '1.6 Feet', '1.7 Clothing', '1.8 Fall Protection', '1.9 Personal Flotation'],
    '2. Situational Awareness': ['2.1 Location of person', '2.2 Watching where going', '2.3 Watching while doing', '2.4 Awareness of pinch-points', '2.5 Awareness of slips/trips/falls', '2.6 Awareness of Deck Openings', '2.7 Competence of Crew', '2.8 Standing in line of fire'],
    '3. Activity': ['3.1 Lifting / Lowering', '3.10 Bunkering / Liquid Transfer', '3.11 Cargo Work', '3.12 Using Portable Tools / Machinery', '3.13 Using Heavy Machinery', '3.2 Pushing / Pulling', '3.3 Climbing up/down', '3.4 Cutting/Burning', '3.5 Rigging / Connecting / Lashing', '3.6 Galley work', '3.7 Working at Height / Over side', '3.8 Working under Loads', '3.9 Working in Confined Space'],
    '4. Procedures': ['4.1 JSA/Toolbox/Job Preplanning', '4.2 Following Procedures', '4.3 Lock out/Tag out/Isolation', '4.4 Hot Work', '4.5 Confined Space', '4.6 Communications/Teamwork', '4.7 Pollution Prevention', '4.8 Waste Management'],
    '5. Conditions / Environment': ['5.1 Lighting/Illumination', '5.10 Falling / Lowering Objects', '5.11 Sharp Edges', '5.12 Slippery Surfaces', '5.13 Hot/Cold Surfaces', '5.14 Loading / Back loading Cargo', '5.15 Cargo Stowage', '5.16 Chemicals / Hazardous Materials', '5.17 Weather / Sea Conditions', '5.18 Safe Escape', '5.2 Temperature', '5.3 Noise', '5.4 Housekeeping', '5.5 Flammable/Explosive', '5.6 Live Energy', '5.7 Dust', '5.8 Oxygen Content', '5.9 Pinch-Points'],
    '6. Location': ['6.1 Alongside Dock', '6.2 On Sea Passage', '6.3 At Rig / Platform', '6.4 Alongside other vessel', '6.5 At Anchor', '6.6 Towing', '6.7 Anchor Operations', '6.8 Shipyard', '6.9 Other (client’s facility)'],
    '7. Location on Vessel / Installation': ['7.1 Back Deck', '7.2 Bridge', '7.3 Accommodation', '7.4 Engine Room', '7.5 Galley', '7.6 Passageway / Stairwell', '7.7 Machinery Space', '7.8 Equipment Storage Space', '7.9 At Height / Over side'],
    '8. Tools / Equipment': ['8.1 Tools / Machinery used to do job', '8.2 Condition of Tools / Machinery', '8.3 Inspection of Tools / Machinery', '8.4 Stowage of Tools', '8.5 Guards or Barriers on Tools / Machinery', '8.6 Barricading Placed around Areas', '8.7 Adequate Signage']
  };

  const form = document.querySelector('#bbs-form');
  const checklistTarget = document.querySelector('#bbs-checklist');
  const checklistError = document.querySelector('#checklist-error');
  const confirmation = document.querySelector('#confirmation');
  const confirmationTitle = document.querySelector('#confirmation-title');
  const confirmationMessage = document.querySelector('#confirmation-message');
  const submitButton = form.querySelector('button[type="submit"]');
  const originalSubmitHtml = submitButton.innerHTML;
  const dateInput = document.querySelector('#observation-date');
  const timeInput = document.querySelector('#observation-time');

  const slug = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  checklistTarget.innerHTML = `<div class="accordion">${Object.entries(checklist).map(([group, items], section) => `<div class="accordion-item"><h3 class="accordion-header" id="bbs-heading-${section}"><button class="accordion-button ${section ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#bbs-section-${section}" aria-expanded="${section === 0}" aria-controls="bbs-section-${section}">${group}</button></h3><div id="bbs-section-${section}" class="accordion-collapse collapse ${section ? '' : 'show'}" aria-labelledby="bbs-heading-${section}"><div class="accordion-body">${items.map((item, index) => { const id = slug(`${section}-${index}-${item}`); return `<fieldset class="bbs-row" data-category="${group}" data-item="${item}"><legend class="visually-hidden">${item}</legend><div class="bbs-item">${item}</div><div><span class="bbs-choice-label">Observation</span><div class="bbs-options" role="radiogroup" aria-label="Observation for ${item}">${['Safe', 'At-Risk'].map((status) => `<input type="radio" id="${id}-${slug(status)}" name="assessment-${id}" value="${status}"><label for="${id}-${slug(status)}">${status}</label>`).join('')}</div></div><div><span class="bbs-choice-label">Stop Work</span><div class="bbs-options" role="radiogroup" aria-label="Stop Work for ${item}">${['Yes', 'No'].map((status) => `<input type="radio" id="${id}-stop-${slug(status)}" name="stop-${id}" value="${status}"><label for="${id}-stop-${slug(status)}">${status}</label>`).join('')}</div></div></fieldset>`; }).join('')}</div></div></div>`).join('')}</div>`;

  window.Argo.setCurrentDateTime(dateInput, timeInput);

  const checklistValid = () => {
    const valid = Boolean(form.querySelector('input[name^="assessment-"]:checked'));
    checklistError.hidden = valid;
    return valid;
  };

  const value = (name) => String(new FormData(form).get(name) || '').trim();

  const collectChecklist = () => [...form.querySelectorAll('.bbs-row')]
    .map((row) => {
      const assessment = row.querySelector('input[name^="assessment-"]:checked');
      if (!assessment) return null;

      const stopWork = row.querySelector('input[name^="stop-"]:checked');
      return {
        category: row.dataset.category,
        item: row.dataset.item,
        status: assessment.value,
        stopWork: stopWork?.value || 'No'
      };
    })
    .filter(Boolean);

  const buildPayload = () => {
    const formData = new FormData(form);

    return {
      formType: 'bbs',
      department: 'HSSEQ',
      vesselProject: value('vesselProject'),
      client: value('client'),
      observationDate: value('observationDate'),
      observationTime: value('observationTime'),
      reportedBy: value('reportedBy'),
      personObserved: value('personObserved'),
      checklist: collectChecklist(),
      potential: formData.getAll('potential'),
      stopWorkPerformed: value('stopWorkPerformed'),
      stopWorkReason: value('stopWorkReason'),
      hazardDescription: value('hazardDescription'),
      correctiveAction: value('correctiveAction'),
      preventiveAction: value('preventiveAction'),
      responsiblePerson: value('responsiblePerson'),
      targetDate: value('targetDate'),
      followUp: value('followUp'),
      managementComments: value('managementComments'),
      acknowledgement: value('acknowledgement'),
      source: 'github-pages',
      formVersion: '1.0.0'
    };
  };

  const showConfirmation = (html, isError = false) => {
    confirmationTitle.innerHTML = isError
      ? '<i class="bi bi-exclamation-triangle-fill me-2"></i>Submission Failed'
      : '<i class="bi bi-check-circle-fill me-2"></i>Submission Successful';
    confirmation.hidden = false;
    confirmation.classList.toggle('border-danger', isError);
    confirmationMessage.innerHTML = html;
    confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const valid = form.checkValidity() && checklistValid();
    form.classList.add('was-validated');

    if (!valid) {
      form.querySelector(':invalid, #checklist-error:not([hidden])')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Submitting…';
    confirmation.hidden = true;

    try {
      const result = await window.Argo.API.submit(buildPayload());
      const submissionId = result.submissionId || 'Not returned';
      const sharePointItemId = result.sharePointItemId || 'Not returned';

      showConfirmation(`
        <div>Your observation has been saved successfully.</div>
        <div class="mt-2"><strong>Submission ID:</strong> ${submissionId}</div>
        <div><strong>SharePoint item:</strong> ${sharePointItemId}</div>
        <div class="mt-2">Thank you for helping improve safety at ARGO Marine.</div>
      `);

      form.reset();
      form.classList.remove('was-validated');
    } catch (error) {
      showConfirmation(`
        <div><strong>Submission failed.</strong></div>
        <div class="mt-2">${error.message}</div>
        <div class="mt-2">Your entries remain on this page. Please try again.</div>
      `, true);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalSubmitHtml;
    }
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      form.classList.remove('was-validated');
      checklistError.hidden = true;
      window.Argo.setCurrentDateTime(dateInput, timeInput);
      document.querySelector('#photo-preview').replaceChildren();
    }, 0);
  });

  document.querySelector('#photos').addEventListener('change', (event) => {
    const preview = document.querySelector('#photo-preview');
    preview.replaceChildren();

    [...event.target.files].forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const image = document.createElement('img');
      image.alt = `Preview: ${file.name}`;
      image.src = URL.createObjectURL(file);
      image.onload = () => URL.revokeObjectURL(image.src);
      preview.append(image);
    });
  });

  form.addEventListener('change', checklistValid);
})();
