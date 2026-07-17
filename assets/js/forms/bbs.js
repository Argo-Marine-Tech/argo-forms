(() => {

    "use strict";

    const form = document.querySelector("#bbs-form");
    const confirmation = document.querySelector("#confirmation");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!form.checkValidity()) {

            form.classList.add("was-validated");
            return;

        }

        const submitButton = form.querySelector("button[type='submit']");

        submitButton.disabled = true;
        submitButton.innerText = "Submitting...";

        try {

            const data = {};

            // Collect every field

            new FormData(form).forEach((value, key) => {

                data[key] = value;

            });

            // Send to Azure Function

            const response = await window.Argo.API.submit(data);

            confirmation.hidden = false;

            confirmation.innerHTML = `
                <div class="alert alert-success">
                    <h5>Submission Successful</h5>
                    <p>${response.message}</p>
                    <strong>Submission ID:</strong><br>
                    ${response.submissionId}
                </div>
            `;

            form.reset();
            form.classList.remove("was-validated");

            confirmation.scrollIntoView({
                behavior: "smooth"
            });

        }

        catch (error) {

            alert(error.message);

        }

        finally {

            submitButton.disabled = false;
            submitButton.innerText = "Submit";

        }

    });

})();
