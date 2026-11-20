(function () {
  "use strict";

  const message = document.getElementById("account-message");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const accountScriptUrl = new URL(document.currentScript.src);
  const accountApiUrl = new URL("../api/auth.php", accountScriptUrl);
  let csrfToken = "";

  function endpoint(action) {
    const url = new URL(accountApiUrl);
    url.searchParams.set("action", action);
    return url.toString();
  }

  function showMessage(text, success) {
    message.textContent = text;
    message.classList.toggle("is-success", Boolean(success));
  }

  function setAccountView(view) {
    const showRegister = view === "register";
    document.getElementById("login-panel").hidden = showRegister;
    document.getElementById("register-panel").hidden = !showRegister;
    document.getElementById("login-tab").classList.toggle("is-active", !showRegister);
    document.getElementById("register-tab").classList.toggle("is-active", showRegister);
    document.getElementById("login-tab").setAttribute("aria-selected", String(!showRegister));
    document.getElementById("register-tab").setAttribute("aria-selected", String(showRegister));
    if (history.replaceState) {
      history.replaceState(null, "", showRegister ? "#register" : "#login");
    }
  }

  async function readResponse(response) {
    const body = await response.text();
    let data;
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      const contentType = response.headers.get("content-type") || "unknown content type";
      throw new Error(
        "Account API did not return JSON (HTTP " + response.status + ", " + contentType +
        "). Open this project through Laragon at http://localhost/OninInternVariant6/; static hosting does not run PHP."
      );
    }
    if (!response.ok) throw new Error(data.error || "Account request failed.");
    if (!body) {
      throw new Error(
        "Account API returned an empty response (HTTP " + response.status +
        "). Check Laragon's PHP error log and confirm Apache is running."
      );
    }
    return data;
  }

  async function apiFetch(url, options) {
    try {
      return await fetch(url, options);
    } catch {
      throw new Error(
        "Cannot reach the PHP account API at " + url +
        ". Start Apache in Laragon and open the project from http://localhost/OninInternVariant6/."
      );
    }
  }

  async function request(path, body) {
    const response = await apiFetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(body),
    });
    return readResponse(response);
  }

  function showSignedIn(user) {
    if (!user) return;
    showMessage("Signed in as " + user.name + " (" + user.email + "). Checkout will use this account.", true);
  }

  let csrfPromise;
  async function getCsrfToken() {
    if (!csrfPromise) {
      csrfPromise = apiFetch(endpoint("csrf"), { credentials: "same-origin" })
        .then(readResponse)
        .then(function (data) {
          csrfToken = data.csrfToken;
          return csrfToken;
        })
        .catch(function (error) {
          csrfPromise = null;
          throw error;
        });
    }
    return csrfPromise;
  }

  async function submitAccountForm(form, action) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage("");
    try {
      await getCsrfToken();
      const values = Object.fromEntries(new FormData(form).entries());
      const data = await request(endpoint(action), values);
      csrfToken = data.csrfToken;
      csrfPromise = Promise.resolve(csrfToken);
      showSignedIn(data.user);
      window.setTimeout(function () {
        window.location.href = "check-out.html";
      }, 700);
    } catch (error) {
      showMessage(error.message || "Account request failed.", false);
    } finally {
      button.disabled = false;
    }
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    submitAccountForm(loginForm, "login");
  });

  document.querySelectorAll("[data-account-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      setAccountView(tab.dataset.accountTab);
      showMessage("");
    });
  });

  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();
    submitAccountForm(registerForm, "register");
  });

  setAccountView(window.location.hash === "#register" ? "register" : "login");

  apiFetch(endpoint("current"), { credentials: "same-origin" })
    .then(readResponse)
    .then(function (data) {
      csrfToken = data.csrfToken;
      csrfPromise = Promise.resolve(csrfToken);
      showSignedIn(data.user);
    })
    .catch(function (error) {
      showMessage(error.message || "Account service is unavailable.", false);
    });
})();
