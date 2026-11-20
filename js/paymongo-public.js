(function () {
  "use strict";

  async function request(url, options) {
    const csrfToken = await window.shopGetCsrfToken();
    const response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      headers: {
        ...(options && options.headers ? options.headers : {}),
        "X-CSRF-Token": csrfToken,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "PayMongo request failed.");
    return data;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
      image.onload = function () { resolve(image); };
      image.onerror = reject;
      image.src = src;
    });
  }

  async function toScanFriendlyQr(imageUrl) {
    try {
      const image = await loadImage(imageUrl);
      const inner = Math.max(image.naturalWidth || 256, image.naturalHeight || 256, 420);
      const padding = Math.round(inner * 0.12);
      const canvas = document.createElement("canvas");
      canvas.width = inner + padding * 2;
      canvas.height = inner + padding * 2;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, padding, padding, inner, inner);
      return canvas.toDataURL("image/png");
    } catch {
      return imageUrl;
    }
  }

  window.PaymongoGcash = {
    async startCheckout(order) {
      const payment = await request("api/payment.php?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: order.name,
          email: order.email,
          couponCode: localStorage.getItem("Skate_bb_coupon") || "",
          items: order.items.map((item) => ({ id: item.id, qty: item.qty })),
        }),
      });
      payment.qrImageUrl = await toScanFriendlyQr(payment.qrImageUrl);
      return payment;
    },

    async getStatus(id) {
      return request("api/payment.php?action=status&id=" + encodeURIComponent(id), {
        method: "GET",
      });
    },
  };
})();
