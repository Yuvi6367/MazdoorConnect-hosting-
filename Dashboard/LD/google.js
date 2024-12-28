// File: Script.js
import { auth, provider, signInWithPopup } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const googleLoginButton = document.getElementById("google-login");

  googleLoginButton.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log(`Logged in as: ${user.displayName}`);
      alert(`Welcome, ${user.displayName}!`);
  
      // Redirect to dashboard.html after successful login
      window.location.href = "Dashboard/dashboard.html";
    } catch (error) {
      console.error("Login failed:", error.message);
      alert("Login failed. Please try again.");
    }
  });
});