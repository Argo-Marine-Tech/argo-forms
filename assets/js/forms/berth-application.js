(() => {
  'use strict';

  const form = document.getElementById('berth-application-form');
  if (!form) return;

  const confirmation = document.getElementById('confirmation');
  const formError = document.getElementById('form-error');
  const reasonError = document.getElementById('reason-error');
  const cargoError = document.getElementById('cargo-error');
  const attachmentList = document.getElementById('attachment-list');
  const attachmentError = document.getElementById('attachment-error');
  const submitButton = form.querySelector('button[type="submit"]');

  const manifestInput = document.getElementById('manifestDocument');
  const catchReportInput = document.getElementById('catchReportDocument');
  const hotWorksPermitInput = document.getElementById('hotWorksPermitDocument');
  const crewListInput = document.getElementById('crewListDocument');
  const supportingDocumentsInput = document.getElementById('supportingDocuments');
  const signatureInput = document.getElementById('signatureDocument');
  const signaturePreview = document.getElementById('signature-preview');
  const signatureError = document.getElementById('signature-error');
  const companyStampInput = document.getElementById('companyStamp');
  const companyStampPreview = document.getElementById('company-stamp-preview');
  const companyStampError = document.getElementById('company-stamp-error');

  const MAX_SUPPORTING_FILES = 5;
  const MAX_SUPPORTING_FILE_BYTES = 8 * 1024 * 1024;
  const MAX_SUPPORTING_TOTAL_BYTES = 20 * 1024 * 1024;
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

  const FORM_METADATA = Object.freeze({
    documentNumber: 'OGWP01-FORM-001',
    version: '3A',
    releaseDate: '2025-06-01'
  });

  const DECLARATION = 'I hereby request berthing for the above-listed vessel and have provided the required information herein. I further agree, as the agent or authorized representative for the agent requesting berth, to accept responsibility for all charges assessed against the vessel and any additional charges resulting from request for the services from Argo Marine Ltd.';

  const CONDITIONS = Object.freeze([
    'Application for reservation of vessel berth and berthing of vessels is subject Argo Marine Ltd Standard Operating Procedures (SOP) and rules, and in requesting application for berth the vessel agent accepts responsibility for all charges assessable against the vessel and any additional charges resulting from services from the terminals where the vessel is either working or at lay-berth.',
    'Berth applications requesting discharge of hazardous/dangerous goods (DG), must accompany the berth reservation application, with ALL supporting documentation, and require a minimum of 48 hours’ notice.',
    'Argo reserves the right to refuse any application for the discharge of any DG or radioactive cargo, in its absolute discretion.',
    'Argo reserves the right to cancel or suspend any vessel who breaches our berth reservation policy, on terms as Argo management may deem in its absolute discretion.',
    'ALL berth applications must be supported with a manifest and agent’s details prior to being accepted.',
    'Any undeclared discharge of items per our additional services, or cargo left on quay face on your departure from the berth will be charged the standard wharf storage rates.',
    'ALL VISITORS to the vessel will require written prior approval from Argo Management.',
    'Crew list must be submitted to Argo Management if vessel will remain overnight.',
    'All visitors and crews of all vessels must comply with Argo Marine safety standards for Personal Protective Equipment (PPE) at all times whilst berthed. Any breach may result in berth reservation being cancelled or suspended at the discretion of Argo’s management.',
    'Failure to pay accounts on time may result in berth applications being rejected, at the absolute discretion of Argo management.',
    'Any vessel that is assessed as not seaworthy will immediately be asked to vacate the wharf.'
  ]);

  const imageState = {
    signature: '',
    stamp: ''
  };

  const supportingDocumentSpecs = Object.freeze([
    { input: manifestInput, documentType: 'Manifest', requiredDocument: true },
    { input: catchReportInput, documentType: 'Confirmed Catch Report', requiredDocument: false },
    { input: hotWorksPermitInput, documentType: 'Hot Works Permit', requiredDocument: false },
    { input: crewListInput, documentType: 'Crew List', requiredDocument: false },
    { input: supportingDocumentsInput, documentType: 'Other Supporting Document', requiredDocument: false, multiple: true }
  ]);

  const cargoRows = Object.freeze([
    {
      key: 'frozenSeafood1',
      category: 'Frozen Seafood',
      commodity: 'frozenSeafoodCommodity1',
      packages: 'frozenSeafoodPackages1',
      totalWeight: 'frozenSeafoodWeight1',
      totalCbm: 'frozenSeafoodCbm1'
    },
    {
      key: 'frozenSeafood2',
      category: 'Frozen Seafood',
      commodity: 'frozenSeafoodCommodity2',
      packages: 'frozenSeafoodPackages2',
      totalWeight: 'frozenSeafoodWeight2',
      totalCbm: 'frozenSeafoodCbm2'
    },
    {
      key: 'otherCargo',
      category: 'Other',
      commodity: 'otherCommodity',
      packages: 'otherCargoPackages',
      totalWeight: 'otherCargoWeight',
      totalCbm: 'otherCargoCbm'
    }
  ]);

  const frozenSeafoodRows = Object.freeze(
    cargoRows.filter((row) => row.category === 'Frozen Seafood')
  );

  function setDefaults() {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const time = now.toTimeString().slice(0, 5);
    if (!form.elements.submissionDate.value) form.elements.submissionDate.value = date;
    if (!form.elements.submissionTime.value) form.elements.submissionTime.value = time;
  }

  function selectedValue(name) {
    return form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  }

  function checked(name) {
    return Boolean(form.elements[name]?.checked);
  }

  function text(name) {
    return String(form.elements[name]?.value || '').trim();
  }

  function numberOrBlank(name) {
    const value = text(name);
    if (value === '') return '';
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }

  function normaliseEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  function fileFromInput(input) {
    return input?.files?.[0] || null;
  }

  function allSupportingFiles() {
    const result = [];
    supportingDocumentSpecs.forEach((spec) => {
      const files = Array.from(spec.input?.files || []);
      files.forEach((file) => result.push({ ...spec, file }));
    });
    return result;
  }

  function renderSupportingDocuments() {
    attachmentList.replaceChildren();
    allSupportingFiles().forEach(({ file, documentType }) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.innerHTML = `<i class="bi bi-file-earmark me-1" aria-hidden="true"></i><strong>${escapeHtml(documentType)}:</strong> ${escapeHtml(file.name)}`;
      const size = document.createElement('small');
      size.textContent = formatBytes(file.size);
      item.append(name, size);
      attachmentList.appendChild(item);
    });
    validateSupportingDocuments();
  }

  function setRequiredLabel(name, required) {
    const label = document.querySelector(`[data-required-label="${name}"]`);
    if (label) label.textContent = required ? '*' : '';
  }

  function isOvernightStay() {
    const eta = text('vesselEta');
    const etd = text('vesselEtd');
    if (!eta || !etd) return false;
    return eta.slice(0, 10) !== etd.slice(0, 10);
  }

  function validateSupportingDocuments(showMessage = true) {
    const files = allSupportingFiles();
    let message = '';

    if (!fileFromInput(manifestInput)) message = 'A manifest is required for every berth application.';
    if (!message && hasFrozenSeafoodCargo() && !fileFromInput(catchReportInput)) {
      message = 'A confirmed catch report is required when frozen seafood cargo is entered.';
    }
    if (!message && selectedValue('hotWorksRequired') === 'Yes' && !fileFromInput(hotWorksPermitInput)) {
      message = 'A hot works permit is required when hot works are requested.';
    }
    if (!message && isOvernightStay() && !fileFromInput(crewListInput)) {
      message = 'A crew list is required when the vessel remains overnight.';
    }
    if (!message && files.length > MAX_SUPPORTING_FILES) {
      message = `Select no more than ${MAX_SUPPORTING_FILES} supporting documents in total.`;
    }
    const oversized = files.find(({ file }) => file.size > MAX_SUPPORTING_FILE_BYTES);
    if (!message && oversized) message = `${oversized.file.name} is larger than 8 MB.`;
    const total = files.reduce((sum, entry) => sum + entry.file.size, 0);
    if (!message && total > MAX_SUPPORTING_TOTAL_BYTES) message = 'The supporting documents are larger than 20 MB in total.';

    manifestInput.setCustomValidity(!fileFromInput(manifestInput) ? 'Manifest required.' : '');
    catchReportInput.setCustomValidity(hasFrozenSeafoodCargo() && !fileFromInput(catchReportInput) ? 'Catch report required for frozen seafood cargo.' : '');
    hotWorksPermitInput.setCustomValidity(selectedValue('hotWorksRequired') === 'Yes' && !fileFromInput(hotWorksPermitInput) ? 'Hot works permit required.' : '');
    crewListInput.setCustomValidity(isOvernightStay() && !fileFromInput(crewListInput) ? 'Crew list required for overnight stay.' : '');

    if (showMessage) {
      attachmentError.textContent = message;
      attachmentError.hidden = !message;
      document.getElementById('manifest-block')?.classList.toggle('is-invalid-group', !fileFromInput(manifestInput));
      document.getElementById('catch-report-block')?.classList.toggle('is-invalid-group', hasFrozenSeafoodCargo() && !fileFromInput(catchReportInput));
      document.getElementById('hot-works-permit-block')?.classList.toggle('is-invalid-group', selectedValue('hotWorksRequired') === 'Yes' && !fileFromInput(hotWorksPermitInput));
      document.getElementById('crew-list-block')?.classList.toggle('is-invalid-group', isOvernightStay() && !fileFromInput(crewListInput));
    }

    return !message;
  }

  function validateImageDocument(input, errorElement, blockId, label, showMessage = true) {
    const file = fileFromInput(input);
    let message = '';
    if (!file) message = `${label} is required.`;
    if (!message && !IMAGE_TYPES.has(file.type)) message = `${label} must be a PNG, JPG or WebP image.`;
    if (!message && file.size > MAX_IMAGE_BYTES) message = `${file.name} is larger than 5 MB.`;
    input.setCustomValidity(message);
    if (showMessage) {
      errorElement.textContent = message;
      errorElement.hidden = !message;
      document.getElementById(blockId)?.classList.toggle('is-invalid-group', Boolean(message));
    }
    return !message;
  }

  async function renderImageDocument(input, preview, errorElement, blockId, stateKey, label) {
    imageState[stateKey] = '';
    preview.replaceChildren();
    preview.hidden = true;
    if (!validateImageDocument(input, errorElement, blockId, label)) return;

    const file = fileFromInput(input);
    const dataUrl = await fileToDataUrl(file);
    imageState[stateKey] = dataUrl;
    const image = document.createElement('img');
    image.src = dataUrl;
    image.alt = `${label} preview: ${file.name}`;
    const caption = document.createElement('small');
    caption.textContent = `${file.name} (${formatBytes(file.size)})`;
    preview.append(image, caption);
    preview.hidden = false;
  }

  function validateReasons() {
    const selected = [
      'reasonCargo', 'reasonFreshwater', 'reasonStores', 'reasonCrewChange',
      'reasonBunker', 'reasonLayBerth', 'reasonOther'
    ].some(checked);
    reasonError.hidden = selected;
    document.getElementById('reason-options').classList.toggle('is-invalid-group', !selected);
    return selected;
  }

  function rowValues(row) {
    return [text(row.commodity), text(row.packages), text(row.totalWeight), text(row.totalCbm)];
  }

  function rowHasAnyValue(row) {
    return rowValues(row).some(Boolean);
  }

  function hasFrozenSeafoodCargo() {
    return frozenSeafoodRows.some(rowHasAnyValue);
  }

  function rowIsComplete(row) {
    return rowValues(row).every(Boolean);
  }

  function validateCargo(showMessage = true) {
    const cargoSelected = checked('reasonCargo');
    const partialRows = cargoRows.filter((row) => rowHasAnyValue(row) && !rowIsComplete(row));
    const completeRows = cargoRows.filter(rowIsComplete);
    let message = '';
    if (partialRows.length) message = 'Complete all four fields for each cargo line that is started.';
    if (!message && cargoSelected && completeRows.length === 0) message = 'Enter at least one complete cargo line when cargo discharge/load is selected.';

    cargoRows.forEach((row) => {
      const invalid = partialRows.includes(row) || (cargoSelected && completeRows.length === 0 && row === cargoRows[0]);
      form.elements[row.commodity].setCustomValidity(invalid ? message : '');
      document.querySelector(`[data-cargo-row="${row.key}"]`)?.classList.toggle('is-invalid-row', partialRows.includes(row));
    });
    if (showMessage) {
      cargoError.textContent = message || 'Enter at least one complete cargo line when cargo discharge/load is selected.';
      cargoError.hidden = !message;
    }
    return !message;
  }

  function applyConditionalRequirements() {
    const rules = [
      ['reasonFreshwater', 'freshwaterQuantityLitres'],
      ['reasonBunker', 'bunkerQuantityLitres'],
      ['reasonOther', 'otherReason']
    ];
    rules.forEach(([trigger, field]) => {
      form.elements[field].required = checked(trigger);
      document.querySelector(`[data-conditional="${trigger}"]`)?.classList.toggle('is-required', checked(trigger));
    });

    const services = [
      ['emptyOilDrumsDisposal', 'emptyOilDrumsUnits'],
      ['wasteOilDrumsDisposal', 'wasteOilDrumsUnits'],
      ['gasBottleDisposal', 'gasBottleUnits'],
      ['garbageDisposal', 'garbageCbm']
    ];
    services.forEach(([trigger, field]) => {
      form.elements[field].required = checked(trigger);
    });

    catchReportInput.required = hasFrozenSeafoodCargo();
    hotWorksPermitInput.required = selectedValue('hotWorksRequired') === 'Yes';
    crewListInput.required = isOvernightStay();
    setRequiredLabel('catchReportDocument', catchReportInput.required);
    setRequiredLabel('hotWorksPermitDocument', hotWorksPermitInput.required);
    setRequiredLabel('crewListDocument', crewListInput.required);
    validateCargo(false);
    validateSupportingDocuments(false);
  }

  function collectReasons() {
    const entries = [
      ['reasonCargo', 'Cargo discharge/load'],
      ['reasonFreshwater', 'Freshwater top-up'],
      ['reasonStores', 'Stores supply'],
      ['reasonCrewChange', 'Crew change'],
      ['reasonBunker', 'Vessel bunker via road tanker'],
      ['reasonLayBerth', 'Lay berth'],
      ['reasonOther', text('otherReason') ? `Other: ${text('otherReason')}` : 'Other']
    ];
    return entries.filter(([name]) => checked(name)).map(([, label]) => label);
  }

  function collectServices() {
    return [
      { service: 'Empty Oil Drums Disposal', selected: checked('emptyOilDrumsDisposal'), quantity: numberOrBlank('emptyOilDrumsUnits'), unit: 'drums' },
      { service: 'Waste Oil Drums Disposal', selected: checked('wasteOilDrumsDisposal'), quantity: numberOrBlank('wasteOilDrumsUnits'), unit: 'drums' },
      { service: 'Gas Bottle Disposal', selected: checked('gasBottleDisposal'), quantity: numberOrBlank('gasBottleUnits'), unit: 'bottles' },
      { service: 'Garbage Disposal', selected: checked('garbageDisposal'), quantity: numberOrBlank('garbageCbm'), unit: 'CBM' }
    ];
  }

  function collectCargo() {
    return cargoRows.map((row, index) => ({
      line: index + 1,
      operation: 'Discharge',
      category: row.category,
      commodity: text(row.commodity),
      packages: numberOrBlank(row.packages),
      totalWeight: text(row.totalWeight),
      totalCbm: numberOrBlank(row.totalCbm)
    }));
  }

  async function fileToAttachment(file, documentType, requiredDocument) {
    const dataUrl = await fileToDataUrl(file);
    return {
      name: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      documentType,
      requiredDocument: Boolean(requiredDocument),
      dataBase64: dataUrl.split(',')[1] || ''
    };
  }

  async function collectAttachments() {
    const entries = allSupportingFiles();
    return Promise.all(entries.map(({ file, documentType, requiredDocument }) => {
      const isRequired = documentType === 'Confirmed Catch Report'
        ? hasFrozenSeafoodCargo()
        : requiredDocument;
      return fileToAttachment(file, documentType, isRequired);
    }));
  }

  async function collectImageDocument(input, stateKey, label) {
    const file = fileFromInput(input);
    if (!file) throw new Error(`${label} is required.`);
    if (!imageState[stateKey]) imageState[stateKey] = await fileToDataUrl(file);
    return {
      name: file.name,
      contentType: file.type,
      size: file.size,
      dataBase64: imageState[stateKey].split(',')[1] || ''
    };
  }

  async function buildPayload() {
    return {
      formType: 'BERTH_APPLICATION',
      department: 'Wharf Operations',
      documentTitle: 'Berth Application',
      formDocumentNumber: FORM_METADATA.documentNumber,
      formVersion: FORM_METADATA.version,
      formReleaseDate: FORM_METADATA.releaseDate,
      companyName: text('companyName'),
      location: text('location'),
      billingAddress: text('billingAddress'),
      contactPerson: text('contactPerson'),
      designation: text('designation'),
      telephone: text('telephone'),
      mobile: text('mobile'),
      email: normaliseEmail(text('email')),
      emailVerified: false,
      emailVerificationStatus: 'Pending',
      emailVerificationMethod: 'Post-submission secure email link',
      applicationStatus: 'Pending Email Verification',
      manualReviewStatus: 'Not Started',
      vesselName: text('vesselName'),
      vesselType: text('vesselType'),
      voyageNumber: text('voyageNumber'),
      grt: numberOrBlank('grt'),
      registeredOwner: text('registeredOwner'),
      vesselCharterer: text('vesselCharterer'),
      loaMetres: numberOrBlank('loaMetres'),
      beamMetres: numberOrBlank('beamMetres'),
      arrivalDraftMetres: numberOrBlank('arrivalDraftMetres'),
      departureDraftMetres: numberOrBlank('departureDraftMetres'),
      flag: text('flag'),
      vesselClass: text('vesselClass'),
      imoNumber: text('imoNumber'),
      callSign: text('callSign'),
      crewCount: numberOrBlank('crewCount'),
      vesselEta: text('vesselEta'),
      vesselEtd: text('vesselEtd'),
      berthingPreference: selectedValue('berthingPreference'),
      reasons: collectReasons(),
      freshwaterQuantityLitres: numberOrBlank('freshwaterQuantityLitres'),
      bunkerQuantityLitres: numberOrBlank('bunkerQuantityLitres'),
      otherReason: text('otherReason'),
      cargo: collectCargo(),
      shoreCraneRequired: selectedValue('shoreCraneRequired'),
      hotWorksRequired: selectedValue('hotWorksRequired'),
      insurancePolicyNumber: text('insurancePolicyNumber'),
      insuranceRenewalDate: text('insuranceRenewalDate'),
      insurer: text('insurer'),
      additionalServices: collectServices(),
      agreementAccepted: checked('agreementAccepted'),
      authorityConfirmed: checked('authorityConfirmed'),
      declaration: DECLARATION,
      submittedBy: text('submittedBy'),
      vesselAgent: text('vesselAgent'),
      submissionDate: text('submissionDate'),
      submissionTime: text('submissionTime'),
      signatureMethod: 'Uploaded signature image',
      signature: await collectImageDocument(signatureInput, 'signature', 'Authorised signature copy'),
      companyStamp: await collectImageDocument(companyStampInput, 'stamp', 'Company stamp copy'),
      conditions: [...CONDITIONS],
      attachments: await collectAttachments()
    };
  }

  function formatDateTime(value) {
    if (!value) return '';
    const [datePart, timePart] = String(value).split('T');
    if (!timePart) return value;
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year} ${timePart}`;
  }

  function mark(selected) {
    return `<span class="paper-tickbox">${selected ? 'X' : ''}</span>`;
  }

  function valueOrBlank(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function cargoByLine(payload, line) {
    return payload.cargo.find((item) => Number(item.line) === line) || {};
  }

  function serviceByName(payload, name) {
    return payload.additionalServices.find((item) => item.service === name) || {};
  }

  function paperHeader(logoSrc) {
    return `<header class="paper-header"><h1>BERTH APPLICATION</h1><img src="${escapeHtml(logoSrc)}" alt="ARGO Marine"></header>`;
  }

  function paperFooter(pageNumber) {
    return `<footer class="paper-footer"><div><strong>BERTH APPLICATION</strong></div><div><strong>Document No.:</strong> ${FORM_METADATA.documentNumber}</div><div><strong>Version No.:</strong> ${FORM_METADATA.version}</div><div><strong>Release Date:</strong> 01-JUN-2025</div><div><em>Uncontrolled if Printed</em></div><div><strong>Page ${pageNumber} of 2</strong></div></footer>`;
  }

  function buildPdfPages(payload) {
    const logoSrc = document.querySelector('.berth-heading img')?.src || '';
    const cargo1 = cargoByLine(payload, 1);
    const cargo2 = cargoByLine(payload, 2);
    const cargo3 = cargoByLine(payload, 3);
    const emptyOil = serviceByName(payload, 'Empty Oil Drums Disposal');
    const wasteOil = serviceByName(payload, 'Waste Oil Drums Disposal');
    const gas = serviceByName(payload, 'Gas Bottle Disposal');
    const garbage = serviceByName(payload, 'Garbage Disposal');
    const reason = (label) => payload.reasons.some((item) => item === label || item.startsWith(`${label}:`));

    const host = document.createElement('div');
    host.className = 'berth-pdf-export-host';
    host.innerHTML = `
      <article class="paper-page">
        ${paperHeader(logoSrc)}
        <div class="paper-notice">(Berth Application must be completed and sent to: <u>wharfops@argo.com.pg</u> at least <u>24 Hours</u> prior to vessel arrival)</div>

        <h2 class="paper-section-title">CUSTOMER DETAILS</h2>
        <table class="paper-form-table paper-two-pair"><tbody>
          <tr><th>COMPANY NAME:</th><td>${escapeHtml(payload.companyName)}</td><th>LOCATION:</th><td>${escapeHtml(payload.location)}</td></tr>
          <tr><th>BILLING ADDRESS:</th><td colspan="3">${escapeHtml(payload.billingAddress)}</td></tr>
          <tr><th>CONTACT PERSON:</th><td>${escapeHtml(payload.contactPerson)}</td><th>DESIGNATION:</th><td>${escapeHtml(payload.designation)}</td></tr>
          <tr><th>TELEPHONE:</th><td>${escapeHtml(payload.telephone)}</td><th>MOBILE:</th><td>${escapeHtml(payload.mobile)}</td></tr>
          <tr><th>EMAIL:</th><td colspan="3">${escapeHtml(payload.email)}</td></tr>
        </tbody></table>

        <h2 class="paper-section-title">VESSEL DETAILS</h2>
        <table class="paper-form-table paper-vessel-table"><tbody>
          <tr><th>VESSEL NAME:</th><td colspan="2">${escapeHtml(payload.vesselName)}</td><th>VESSEL TYPE:</th><td colspan="2">${escapeHtml(payload.vesselType)}</td></tr>
          <tr><th>VOYAGE NUMBER:</th><td>${escapeHtml(payload.voyageNumber)}</td><th>GRT:</th><td>${escapeHtml(payload.grt)}</td><th>REGISTERED OWNER:</th><td>${escapeHtml(payload.registeredOwner)}</td></tr>
          <tr><th>LOA:</th><td>${escapeHtml(payload.loaMetres)}</td><th>BEAM:</th><td>${escapeHtml(payload.beamMetres)}</td><th>VESSEL CHARTER:</th><td>${escapeHtml(payload.vesselCharterer)}</td></tr>
          <tr><th>ARRIVAL DRAFT:</th><td>${escapeHtml(payload.arrivalDraftMetres)}</td><th>FLAG:</th><td>${escapeHtml(payload.flag)}</td><th rowspan="2">BERTHING PREFERENCE</th><td rowspan="2" class="paper-centered">PORT ${mark(payload.berthingPreference === 'Port')} &nbsp;&nbsp; STARBOARD ${mark(payload.berthingPreference === 'Starboard')}</td></tr>
          <tr><th>DEP. DRAFT:</th><td>${escapeHtml(payload.departureDraftMetres)}</td><th>CLASS:</th><td>${escapeHtml(payload.vesselClass)}</td></tr>
          <tr><th>VESSEL ETA:</th><td>${escapeHtml(formatDateTime(payload.vesselEta))}</td><th>IMO NO:</th><td>${escapeHtml(payload.imoNumber)}</td><th rowspan="2">NO. OF CREW:</th><td rowspan="2">${escapeHtml(payload.crewCount)}</td></tr>
          <tr><th>VESSEL ETD:</th><td>${escapeHtml(formatDateTime(payload.vesselEtd))}</td><th>CALL SIGN:</th><td>${escapeHtml(payload.callSign)}</td></tr>
        </tbody></table>

        <h2 class="paper-section-title">REASON FOR BERTH <small>(Please tick where required)</small></h2>
        <table class="paper-form-table paper-reason-table"><tbody>
          <tr><th>CARGO DISCHARGE/LOAD:</th><td>${mark(reason('Cargo discharge/load'))}</td></tr>
          <tr><th>FRESHWATER TOP-UP:</th><td>${mark(reason('Freshwater top-up'))}</td></tr>
          <tr><th>STORES SUPPLY:</th><td>${mark(reason('Stores supply'))}</td></tr>
          <tr><th>CREW CHANGE:</th><td>${mark(reason('Crew change'))}</td></tr>
          <tr><th>VESSEL BUNKER (VIA ROAD TANKER):</th><td>${mark(reason('Vessel bunker via road tanker'))}</td></tr>
          <tr><th>LAY BERTH:</th><td>${mark(reason('Lay berth'))}</td></tr>
          <tr><th>OTHER:</th><td>${mark(payload.reasons.some((item) => item.startsWith('Other')))} ${escapeHtml(payload.otherReason)}</td></tr>
        </tbody></table>
        <table class="paper-form-table paper-quantity-table"><tbody>
          <tr><th>STATE FRESHWATER QUANTITY:</th><td>${escapeHtml(payload.freshwaterQuantityLitres)}</td></tr>
          <tr><th>STATE VESSEL BUNKER QUANTITY:</th><td>${escapeHtml(payload.bunkerQuantityLitres)}</td></tr>
        </tbody></table>

        <h2 class="paper-section-title cargo-title">DETAILS FOR CARGO TO BE LOADED AND DISCHARGED <small>(Important: Please also attach confirmed catch report with Berth Application)</small></h2>
        <table class="paper-form-table paper-cargo-table"><thead><tr><th colspan="2">DISCHARGE</th><th>NO. OF PACKAGES</th><th>TOTAL WEIGHT</th><th>TOTAL CBM*</th></tr></thead><tbody>
          <tr><th rowspan="2">COMMODITY<br>FROZEN SEAFOOD</th><td>${escapeHtml(cargo1.commodity)}</td><td>${escapeHtml(cargo1.packages)}</td><td>${escapeHtml(cargo1.totalWeight)}</td><td>${escapeHtml(cargo1.totalCbm)}</td></tr>
          <tr><td>${escapeHtml(cargo2.commodity)}</td><td>${escapeHtml(cargo2.packages)}</td><td>${escapeHtml(cargo2.totalWeight)}</td><td>${escapeHtml(cargo2.totalCbm)}</td></tr>
          <tr><th>OTHER</th><td>${escapeHtml(cargo3.commodity)}</td><td>${escapeHtml(cargo3.packages)}</td><td>${escapeHtml(cargo3.totalWeight)}</td><td>${escapeHtml(cargo3.totalCbm)}</td></tr>
        </tbody></table>
        <div class="paper-footnote">*CBM - CUBIC MEASUREMENT</div>

        <h2 class="paper-section-title">OTHER REQUIREMENTS</h2>
        <table class="paper-form-table"><tbody>
          <tr><th>DO YOU REQUIRE SHORE CRANE?</th><td>YES ${mark(payload.shoreCraneRequired === 'Yes')} &nbsp;&nbsp; NO ${mark(payload.shoreCraneRequired === 'No')}</td></tr>
          <tr><th>DO YOU REQUIRE HOT WORKS ON VESSEL WHILE ALONGSIDE?</th><td>YES ${mark(payload.hotWorksRequired === 'Yes')} &nbsp;&nbsp; NO ${mark(payload.hotWorksRequired === 'No')}<div class="paper-small">(IF YES, PLEASE PROVIDE HOT WORKS PERMIT AND ATTACH WITH THIS BERTH APPLICATION)</div></td></tr>
        </tbody></table>

        <div class="paper-insurance-notice">ALL VESSELS MUST CARRY THIRD PARTY LIABIITY INSURANCE WITH A MINIMUM LIMIT OF PGK 1,000,000.00. BERTHS ARE CONDITIONAL UPON INSURNACE POLICIES REMAINING IN PLACE AT ALL TIMES. PLEASE ADVISE TH DETAILS OF YOUR CURRENT INSURANCE BELOW.</div>
        <table class="paper-form-table"><tbody>
          <tr><th>POLICY NO.:</th><td>${escapeHtml(payload.insurancePolicyNumber)}</td></tr>
          <tr><th>RENEWAL DATE:</th><td>${escapeHtml(payload.insuranceRenewalDate)}</td></tr>
        </tbody></table>
        ${paperFooter(1)}
      </article>

      <article class="paper-page">
        ${paperHeader(logoSrc)}
        <table class="paper-form-table paper-insurer-row"><tbody><tr><th>INSURER:</th><td>${escapeHtml(payload.insurer)}</td></tr></tbody></table>

        <h2 class="paper-section-title">ADDITIONAL SERVICE <small>(PLEASE TICK WHERE REQUIRED)</small></h2>
        <table class="paper-form-table paper-services-table"><thead><tr><th>EMPTY OIL DRUMS DISPOSAL</th><th>WASTE OIL DRUMS DISPOSAL</th><th>GAS BOTTLE DISPOSAL</th><th>GARBAGE DISPOSAL</th></tr></thead><tbody>
          <tr><td>${mark(emptyOil.selected)}</td><td>${mark(wasteOil.selected)}</td><td>${mark(gas.selected)}</td><td>${mark(garbage.selected)}</td></tr>
          <tr><td><strong>UNITS (NO. OF DRUMS):</strong> ${escapeHtml(valueOrBlank(emptyOil.quantity))}</td><td><strong>UNITS (NO. OF DRUMS):</strong> ${escapeHtml(valueOrBlank(wasteOil.quantity))}</td><td><strong>UNITS (BOTTLES):</strong> ${escapeHtml(valueOrBlank(gas.quantity))}</td><td><strong>CUBIC (CBM):</strong> ${escapeHtml(valueOrBlank(garbage.quantity))}</td></tr>
        </tbody></table>

        <h2 class="paper-section-title paper-terms-heading">TERMS AND CONDITIONS</h2>
        <ul class="paper-terms">${payload.conditions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>

        <div class="paper-declaration">${escapeHtml(payload.declaration)}</div>
        <table class="paper-form-table paper-signoff-table"><tbody>
          <tr><th>SUBMITTED AND AGREED BY:</th><td><div class="paper-signatory"><span>${escapeHtml(payload.submittedBy)}</span><img src="data:${escapeHtml(payload.signature.contentType)};base64,${payload.signature.dataBase64}" alt="Authorised signature"></div></td></tr>
          <tr><th>VESSEL AGENT:</th><td>${escapeHtml(payload.vesselAgent)}</td></tr>
          <tr><th>DATE:</th><td>${escapeHtml(payload.submissionDate)}</td><th>TIME:</th><td>${escapeHtml(payload.submissionTime)}</td></tr>
          <tr class="paper-stamp-row"><th>AFFIX COMPANY STAMP HERE:</th><td colspan="3"><img class="paper-stamp-image" src="data:${escapeHtml(payload.companyStamp.contentType)};base64,${payload.companyStamp.dataBase64}" alt="Company stamp"></td></tr>
        </tbody></table>


        <section class="paper-office-use">
          <h2>ARGO OFFICE USE ONLY</h2>
          <table class="paper-form-table"><tbody>
            <tr><th>DATE RECEIVED:</th><td></td><th>TIME RECEIVED:</th><td></td></tr>
            <tr><th>RECEIVED BY:</th><td></td><th>BERTH ALLOCATION:</th><td></td></tr>
          </tbody></table>
        </section>
        ${paperFooter(2)}
      </article>`;

    document.body.appendChild(host);
    return { host, pages: Array.from(host.querySelectorAll('.paper-page')) };
  }

  function waitForImages(container) {
    return Promise.all(Array.from(container.querySelectorAll('img')).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  async function createPdfBase64(payload) {
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
      throw new Error('PDF generation libraries did not load. Refresh the page and try again.');
    }

    const { host, pages } = buildPdfPages(payload);
    try {
      await document.fonts?.ready;
      await waitForImages(host);
      const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await window.html2canvas(pages[index], {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          width: 794,
          height: 1123
        });
        if (index > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
      return pdf.output('datauristring').split(',')[1];
    } finally {
      host.remove();
    }
  }

  function showError(message, target) {
    formError.textContent = message;
    formError.hidden = false;
    (target || formError).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function onConditionalChange() {
    applyConditionalRequirements();
    validateReasons();
    validateCargo();
    validateSupportingDocuments();
  }

  form.addEventListener('change', (event) => {
    if (event.target.matches('input[type="checkbox"], input[type="radio"]')) onConditionalChange();
    if (event.target.closest('.cargo-table')) validateCargo();
    if ([manifestInput, catchReportInput, hotWorksPermitInput, crewListInput, supportingDocumentsInput].includes(event.target)) renderSupportingDocuments();
    if (['vesselEta', 'vesselEtd'].includes(event.target.name)) {
      applyConditionalRequirements();
      renderSupportingDocuments();
    }

    if (event.target === signatureInput) {
      renderImageDocument(signatureInput, signaturePreview, signatureError, 'signature-block', 'signature', 'Authorised signature copy').catch((error) => {
        signatureError.textContent = error.message;
        signatureError.hidden = false;
      });
    }
    if (event.target === companyStampInput) {
      renderImageDocument(companyStampInput, companyStampPreview, companyStampError, 'stamp-block', 'stamp', 'Company stamp copy').catch((error) => {
        companyStampError.textContent = error.message;
        companyStampError.hidden = false;
      });
    }
  });

  form.addEventListener('input', (event) => {
    if (event.target.closest('.cargo-table')) {
      applyConditionalRequirements();
      validateCargo();
    }
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      confirmation.hidden = true;
      formError.hidden = true;
      reasonError.hidden = true;
      cargoError.hidden = true;
      attachmentError.hidden = true;
      signatureError.hidden = true;
      companyStampError.hidden = true;
      attachmentList.replaceChildren();
      signaturePreview.replaceChildren();
      signaturePreview.hidden = true;
      companyStampPreview.replaceChildren();
      companyStampPreview.hidden = true;
      imageState.signature = '';
      imageState.stamp = '';
      document.querySelectorAll('.is-invalid-group, .is-invalid-row').forEach((element) => element.classList.remove('is-invalid-group', 'is-invalid-row'));
      setDefaults();
      applyConditionalRequirements();
    }, 0);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    confirmation.hidden = true;
    formError.hidden = true;
    applyConditionalRequirements();

    const validReasons = validateReasons();
    const validCargo = validateCargo();
    const validDocuments = validateSupportingDocuments();
    const validSignature = validateImageDocument(signatureInput, signatureError, 'signature-block', 'Authorised signature copy');
    const validStamp = validateImageDocument(companyStampInput, companyStampError, 'stamp-block', 'Company stamp copy');
    const validForm = form.checkValidity();
    form.classList.add('was-validated');

    if (!validForm || !validReasons || !validCargo || !validDocuments || !validSignature || !validStamp) {
      let target = form.querySelector(':invalid');
      if (!validSignature) target = document.getElementById('signature-block');
      else if (!validStamp) target = document.getElementById('stamp-block');
      else if (!validDocuments) target = document.getElementById('attachments-heading');
      else if (!validCargo) target = document.getElementById('cargo-heading');
      showError('Please complete all required fields and provide the required manifest, conditional documents, authorised signature copy and company stamp copy.', target);
      form.querySelector(':invalid')?.focus({ preventScroll: true });
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparing PDF and submitting...';

    try {
      const payload = await buildPayload();
      payload.pdfBase64 = await createPdfBase64(payload);
      const result = await window.Argo.API.submit(payload);
      confirmation.className = result.verificationEmailSent === false
        ? 'confirmation alert alert-warning mb-4'
        : 'confirmation alert alert-success mb-4';
      const recipient = result.maskedEmail || payload.email;
      const verificationMessage = result.verificationEmailSent === false
        ? 'The application and files were saved, but the verification email could not be sent. Contact Wharf Operations and quote the submission ID below.'
        : `A secure verification request has been sent to <code>${escapeHtml(recipient)}</code>. The application is saved as <strong>Pending Email Verification</strong>. Wharf Operations will be notified for manual review after the email link is confirmed.`;
      confirmation.innerHTML = `<strong><i class="bi bi-check-circle-fill me-2"></i>Berth application received.</strong><div class="mt-2">${verificationMessage}<br>Submission ID: <code>${escapeHtml(result.submissionId || 'Created')}</code>${result.sharePointItemId ? `<br>SharePoint item: <code>${escapeHtml(result.sharePointItemId)}</code>` : ''}</div>`;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'start' });
      form.reset();
      form.classList.remove('was-validated');
    } catch (error) {
      console.error(error);
      showError(error?.message || 'The berth application could not be submitted. Please try again.');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="bi bi-send me-1"></i>Submit berth application';
    }
  });

  setDefaults();
  applyConditionalRequirements();
})();
