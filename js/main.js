const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
  });
}

const enquiryForm = document.querySelector("[data-enquiry-form]");

if (enquiryForm) {
  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = enquiryForm.querySelector("[data-form-message]");
    const submit = enquiryForm.querySelector("button[type='submit']");
    const formData = new FormData(enquiryForm);
    const payload = Object.fromEntries(formData.entries());

    if (message) {
      message.textContent = "Sending your enquiry...";
      message.className = "form-message";
    }

    if (submit) {
      submit.disabled = true;
    }

    try {
      const response = await fetch(enquiryForm.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to send enquiry");
      }

      enquiryForm.reset();
      if (message) {
        message.textContent = "Thank you. Your enquiry has been sent.";
        message.classList.add("success");
      }
    } catch (error) {
      if (message) {
        message.textContent = "Sorry, your enquiry could not be sent. Please email enquiries@dukegs.com.";
        message.classList.add("error");
      }
    } finally {
      if (submit) {
        submit.disabled = false;
      }
    }
  });
}
