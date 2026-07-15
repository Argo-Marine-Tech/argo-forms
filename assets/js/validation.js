window.Argo = window.Argo || {};
window.Argo.radioGroupSelected = (form, name) => Boolean(form.querySelector(`input[name="${name}"]:checked`));
