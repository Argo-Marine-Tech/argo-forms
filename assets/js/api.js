window.Argo = window.Argo || {};

window.Argo.API = {
  endpoint: 'https://argo-digitalforms-api-c9h3ejhtdvdva2b2.australiaeast-01.azurewebsites.net/api/forms',

  async submit(formData) {
    let response;

    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
    } catch (error) {
      throw new Error('The form could not reach the ARGO submission service. Check the internet connection and try again.');
    }

    let result = {};
    try {
      result = await response.json();
    } catch (error) {
      result = {};
    }

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'The observation could not be submitted. Please try again.');
    }

    return result;
  }
};
