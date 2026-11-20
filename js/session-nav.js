(function () {
  "use strict";

  const scriptUrl = new URL(document.currentScript.src);
  const authUrl = new URL("../api/auth.php", scriptUrl);
  const guestLinks = document.querySelectorAll("[data-session-guest]");
  const signedInLinks = document.querySelectorAll("[data-session-auth]");
  const logoutLinks = document.querySelectorAll("[data-session-logout]");
  let csrfToken = "";

  function authEndpoint(action) {
    const url = new URL(authUrl);
    url.searchParams.set("action", action);
    return url.toString();
  }

  function setSessionView(signedIn) {
    guestLinks.forEach(function (link) {
      link.hidden = signedIn;
    });
    signedInLinks.forEach(function (link) {
      link.hidden = !signedIn;
    });
    logoutLinks.forEach(function (link) {
      link.hidden = !signedIn;
    });
  }

  fetch(authEndpoint("current"), { credentials: "same-origin" })
    .then(async function (response) {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not check your account session.");
      csrfToken = data.csrfToken;
      setSessionView(Boolean(data.user));
    })
    .catch(function (error) {
      console.error("Could not load account navigation:", error);
    });

  logoutLinks.forEach(function (link) {
    link.addEventListener("click", async function (event) {
      event.preventDefault();
      link.setAttribute("aria-disabled", "true");
      try {
        const response = await fetch(authEndpoint("logout"), {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: "{}",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not sign out.");
        window.location.reload();
      } catch (error) {
        link.removeAttribute("aria-disabled");
        window.alert(error.message || "Could not sign out.");
      }
    });
  });
})();
