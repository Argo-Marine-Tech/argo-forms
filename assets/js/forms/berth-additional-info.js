(() => {
  'use strict';

  const MAX_FILES = 8;
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']);

  const requestSection = document.getElementById('request-access-section');
  const loadingSection = document.getElementById('loading-section');
  const responseSection = document.getElementById('response-section');
  const completeSection = document.getElementById('complete-section');
  const message = document.getElementById('message');
  const requestButton = document.getElementById('request-access-button');
  const form = document.getElementById('additional-info-form');
  const responseText = document.getElementById('response-text');
  const filesInput = document.getElementById('additional-files');
  const fileList = document.getElementById('file-list');
  const formError = document.getElementById('form-error');
  const submitButton = document.getElementById('submit-button');

  const query = new URLSearchParams(window.location.search);
  const submissionId = String(query.get('submission') || '').trim();
  const itemId = String(query.get('item') || '').trim();
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const requestId = String(fragment.get('request') || '').trim();
  const token = String(fragment.get('token') || '').trim();

  function showOnly(section) {
    [requestSection, loadingSection, responseSection, completeSection].forEach((item) => {
      item.hidden = item !== section;
    });
  }

  function showMessage(text, type = 'info') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.hidden = false;
  }

  function clearMessage() {
    message.hidden = true;
    message.textContent = '';
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileExtension(name) {
    const parts = String(name || '').toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() : '';
  }

  function validateFiles(files) {
    if (files.length > MAX_FILES) return `Select no more than ${MAX_FILES} files.`;
    let total = 0;
    for (const file of files) {
      if (!ALLOWED_EXTENSIONS.has(fileExtension(file.name))) return `${file.name} is not an accepted file type.`;
      if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 8 MB.`;
      total += file.size;
    }
    if (total > MAX_TOTAL_BYTES) return 'The selected files are larger than 20 MB in total.';
    return '';
  }

  function renderFiles() {
    const files = Array.from(filesInput.files || []);
    fileList.replaceChildren();
    files.forEach((file) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      const size = document.createElement('small');
      name.textContent = file.name;
      size.textContent = formatBytes(file.size);
      item.append(name, size);
      fileList.appendChild(item);
    });
    const error = validateFiles(files);
    formError.textContent = error;
    formError.hidden = !error;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  async function collectAttachments() {
    const files = Array.from(filesInput.files || []);
    const error = validateFiles(files);
    if (error) throw new Error(error);
    return Promise.all(files.map(async (file) => ({
      name: file.name,
      contentType: file.type || 'application/octet-stream',
      dataBase64: await fileToBase64(file)
    })));
  }

  async function requestAccess() {
    if (!submissionId || !itemId) {
      showMessage('This request link is incomplete. Contact Wharf Operations and quote your Submission ID.', 'error');
      return;
    }
    requestButton.disabled = true;
    clearMessage();
    try {
      const result = await window.Argo.API.berthAdditionalInfo({
        action: 'request-access',
        submissionId,
        itemId
      });
      showMessage(`${result.message} (${result.maskedEmail})`, 'success');
      requestButton.textContent = 'Secure access link sent';
    } catch (error) {
      showMessage(error.message || 'The secure access link could not be sent.', 'error');
      requestButton.disabled = false;
    }
  }

  async function loadSecureContext() {
    showOnly(loadingSection);
    try {
      const result = await window.Argo.API.berthAdditionalInfo({
        action: 'context',
        requestId,
        token
      });
      document.getElementById('submission-id').textContent = result.submissionId || '';
      document.getElementById('company-name').textContent = result.companyName || '';
      document.getElementById('vessel-name').textContent = result.vesselName || '';
      document.getElementById('request-notes').textContent = result.requestNotes || 'Please provide the information requested by Wharf Operations.';
      showOnly(responseSection);
    } catch (error) {
      showOnly(requestSection);
      document.getElementById('request-submission-id').textContent = submissionId || 'Unknown';
      showMessage(error.message || 'The secure access link could not be validated.', 'error');
    }
  }

  async function submitResponse(event) {
    event.preventDefault();
    clearMessage();
    formError.hidden = true;
    const text = responseText.value.trim();
    const files = Array.from(filesInput.files || []);
    const fileError = validateFiles(files);
    if (fileError) {
      formError.textContent = fileError;
      formError.hidden = false;
      return;
    }
    if (!text && files.length === 0) {
      formError.textContent = 'Enter a response or attach at least one requested document.';
      formError.hidden = false;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting…';
    try {
      const attachments = await collectAttachments();
      const result = await window.Argo.API.berthAdditionalInfo({
        action: 'submit',
        requestId,
        token,
        responseText: text,
        attachments
      });
      document.getElementById('complete-submission-id').textContent = result.submissionId || '';
      window.history.replaceState({}, document.title, window.location.pathname);
      showOnly(completeSection);
      showMessage(result.message, 'success');
    } catch (error) {
      showMessage(error.message || 'The additional information could not be submitted.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Additional Information';
    }
  }

  filesInput.addEventListener('change', renderFiles);
  requestButton.addEventListener('click', requestAccess);
  form.addEventListener('submit', submitResponse);

  if (requestId && token) {
    loadSecureContext();
  } else {
    document.getElementById('request-submission-id').textContent = submissionId || 'Unknown';
    showOnly(requestSection);
    if (!submissionId || !itemId) {
      requestButton.disabled = true;
      showMessage('This request link is incomplete. Contact Wharf Operations and quote your Submission ID.', 'error');
    }
  }
})();
