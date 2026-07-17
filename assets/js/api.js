window.Argo = window.Argo || {};

window.Argo.API = {

    endpoint: "https://argo-digitalforms-api-c9h3ejhtdvdva2b2.australiaeast-01.azurewebsites.net/api/forms",

    async submit(formData) {

        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error("Unable to submit form.");
        }

        return await response.json();
    }

};
