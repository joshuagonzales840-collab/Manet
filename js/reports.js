(function () {
  "use strict";

  const form = document.getElementById("reports-filter");
  const content = document.getElementById("reports-content");
  const loginNotice = document.getElementById("reports-login");
  const message = document.getElementById("reports-message");
  const ordersBody = document.getElementById("reports-orders-body");
  const emptyMessage = document.getElementById("reports-empty");
  const scriptUrl = new URL(document.currentScript.src);
  const apiUrl = new URL("../api/reports.php", scriptUrl);
  const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function showMessage(text) {
    message.textContent = text;
  }

  async function loadReport(from, to) {
    const url = new URL(apiUrl);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    showMessage("");

    let response;
    try {
      response = await fetch(url, { credentials: "same-origin" });
    } catch {
      throw new Error("Cannot reach the reports service. Start Apache in Laragon and reopen this page.");
    }

    const data = await response.json().catch(function () {
      throw new Error("The reports service returned an invalid response.");
    });
    if (response.status === 401) {
      content.hidden = true;
      loginNotice.hidden = false;
      return;
    }
    if (!response.ok) throw new Error(data.error || "Could not load reports.");

    loginNotice.hidden = true;
    content.hidden = false;
    document.getElementById("reports-scope").textContent = data.scope === "all"
      ? "Store-wide order and sales totals for the selected date range."
      : "Your order and sales totals for the selected date range.";
    document.getElementById("order-count").textContent = data.summary.orderCount.toLocaleString("en-PH");
    document.getElementById("sales-total").textContent = currency.format(data.summary.salesTotal);
    document.getElementById("paid-sales-total").textContent = currency.format(data.summary.paidSalesTotal);
    document.getElementById("report-date-range").textContent = data.from + " to " + data.to;

    ordersBody.replaceChildren();
    data.orders.forEach(function (order) {
      const row = document.createElement("tr");
      const values = [
        "#" + order.id,
        new Date(order.createdAt.replace(" ", "T")).toLocaleString("en-PH"),
        order.orderStatus,
        order.paymentStatus + " (" + order.paymentMethod.toUpperCase() + ")",
        currency.format(order.total),
      ];
      values.forEach(function (value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      ordersBody.appendChild(row);
    });
    emptyMessage.hidden = data.orders.length !== 0;
  }

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const fromInput = document.getElementById("date-from");
  const toInput = document.getElementById("date-to");
  fromInput.value = localDate(firstDay);
  toInput.value = localDate(today);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (fromInput.value > toInput.value) {
      showMessage("The start date must be on or before the end date.");
      return;
    }
    loadReport(fromInput.value, toInput.value).catch(function (error) {
      showMessage(error.message || "Could not load reports.");
    });
  });

  document.getElementById("export-pdf").addEventListener("click", function () {
    window.print();
  });

  loadReport(fromInput.value, toInput.value).catch(function (error) {
    showMessage(error.message || "Could not load reports.");
  });
})();
