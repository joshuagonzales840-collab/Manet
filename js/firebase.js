// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1Uy3pjKb1p3uKtqUVz-15mzhYwazhluw",
  authDomain: "nikeshoes-2374c.firebaseapp.com",
  projectId: "nikeshoes-2374c",
  storageBucket: "nikeshoes-2374c.firebasestorage.app",
  messagingSenderId: "191331156081",
  appId: "1:191331156081:web:c8d56717da5e4e10e05bd0",
  measurementId: "G-X2V7CHKM3T"
};

/**
 * Show a toast notification on the page
 */
function showFirebaseToast(message, isSuccess = true) {
  // Remove any existing toast
  const existing = document.getElementById("firebase-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "firebase-toast";
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 99999;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: 'Montserrat', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: ${isSuccess ? "linear-gradient(135deg, #00c853, #009624)" : "linear-gradient(135deg, #ff1744, #d50000)"};
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.35s ease, transform 0.35s ease;
    max-width: 360px;
  `;

  toast.innerHTML = `
    <span style="font-size: 20px;">${isSuccess ? "✅" : "❌"}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Auto-hide after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

// Initialize Firebase
let app;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);

  // Expose app/analytics on window so classic (non-module) scripts like
  // js/main.js or js/shop.js can access them if needed
  window.firebaseApp = app;
  window.firebaseAnalytics = analytics;
  window.firebaseConnected = true;

  console.log("✅ Firebase connected successfully!", app.name);

  // Show notification once the DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      showFirebaseToast("Firebase is connected ✅");
    });
  } else {
    showFirebaseToast("Firebase is connected ✅");
  }
} catch (error) {
  console.error("❌ Firebase connection failed:", error);
  window.firebaseConnected = false;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      showFirebaseToast("Firebase connection failed", false);
    });
  } else {
    showFirebaseToast("Firebase connection failed", false);
  }
}

export { app, analytics };