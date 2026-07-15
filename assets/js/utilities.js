window.Argo = window.Argo || {};
window.Argo.setCurrentDateTime = (dateInput, timeInput) => {
  const now = new Date();
  if (dateInput) dateInput.value = now.toISOString().slice(0, 10);
  if (timeInput) timeInput.value = now.toTimeString().slice(0, 5);
};
