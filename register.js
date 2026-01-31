// ===== Firebase och annat är som innan =====

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidName(name) {
    return /^[a-zA-Z0-9]{1,15}$/.test(name);
  }

  function hasUppercaseAndNumber(password) {
    // Minst en stor bokstav och minst en siffra
    return /[A-Z]/.test(password) && /[0-9]/.test(password);
  }

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // ✅ Grundkontroller
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields!");
      return;
    }

    if (!isValidName(name)) {
      alert("Name must be 1-15 characters and contain only letters and numbers.");
      return;
    }

    if (!isValidEmail(email) || email.length > 100) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    // ✅ Ny kontroll för uppercase och number
    if (!hasUppercaseAndNumber(password)) {
      alert("Password must contain at least 1 uppercase letter and 1 number");
      return;
    }

    // Här kan resten av din registreringskod fortsätta (Firebase osv.)
    registerBtn.disabled = true;
    registerBtn.textContent = "Registering...";
    
    try {
      // Skapa användare med Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // ... Resten av din kod
      window.location.href = "index.html";
    } catch (error) {
      console.error("Registration error:", error);
      if (error.code === "auth/email-already-in-use") alert("This email already exists.");
      else if (error.code === "auth/invalid-email") alert("Please enter a valid email address.");
      else if (error.code === "auth/weak-password") alert("Password must be at least 6 characters.");
      else alert("Registration failed. Please check your inputs.");
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Register / Enter App";
    }
  });
});
