window.Argo = window.Argo || {};

window.Argo.API = {
  endpoint: 'https://argo-digitalforms-api-c9h3ejhtdvdva2b2.australiaeast-01.azurewebsites.net/api/forms',
  berthAdditionalInfoEndpoint: 'https://argo-digitalforms-api-c9h3ejhtdvdva2b2.australiaeast-01.azurewebsites.net/api/berth-additional-info',

  async request(path, options = {}) {
    const response = await fetch(path, options);
    let body = null;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const error = new Error(body?.message || 'The request could not be completed.');
      error.status = response.status;
      error.details = body;
      throw error;
    }

    return body;
  },

  async submit(formData) {
    return this.request(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
  },

  async berthAdditionalInfo(payload) {
    return this.request(this.berthAdditionalInfoEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
};
