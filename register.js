// ===== Firebase och annat är som innan =====

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtn = document.getElementById("togglePassword"); // Toggle-knappen

  // ===== Funktionskontroller =====
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidName(name) {
    return /^[a-zA-Z0-9]{1,15}$/.test(name);
  }

  function hasUppercaseAndNumber(password) {
    return /[A-Z]/.test(password) && /[0-9]/.test(password);
  }

  // ===== Toggle password visibility (backup-versionens logik) =====
  if (togglePasswordBtn && passwordInput && confirmPasswordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      // Om lösenordet är "password", sätt det till text, annars till password
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        confirmPasswordInput.type = "text";
        togglePasswordBtn.textContent = "ON";
      } else {
        passwordInput.type = "password";
        confirmPasswordInput.type = "password";
        togglePasswordBtn.textContent = "OFF";
      }
    });
  }

  // ===== Register-knapp =====
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

    if (!hasUppercaseAndNumber(password)) {
      alert("Password must contain at least 1 uppercase letter and 1 number");
      return;
    }

    // ===== Firebase-registration =====
    registerBtn.disabled = true;
    registerBtn.textContent = "Registering...";

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Eventuell extra kod här
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
