document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const passwordInput = document.getElementById("password");
  const loader = document.getElementById("loader");

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidName(name) {
    return /^[a-zA-Z0-9]{1,15}$/.test(name);
  }

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const confirmPassword = document.getElementById("confirmPassword").value;

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

    if (password.length > 128) {
      alert("Password must be 128 characters or less.");
      return;
    }

    // ✅ Visa loader och ändra knapptext
    const originalBtnText = registerBtn.textContent;
    registerBtn.disabled = true;
    loader.style.visibility = "visible";
    registerBtn.textContent = "Registering…";

    try {
      const usersRef = firebase.firestore().collection("users");
      const nameQuery = await usersRef.where("publicName", "==", name.toLowerCase()).get();

      if (!nameQuery.empty) {
        alert("This name is already taken. Please choose another.");
        return;
      }

      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await Promise.all([
        user.updateProfile({ displayName: name }),
        firebase.firestore().collection("users").doc(user.uid).set({
          name: name,
          publicName: name.toLowerCase(),
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
      ]);

      window.location.href = "index.html";

    } catch (error) {
      console.error("Error during registration:", error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email already exists.");
      } else if (
        error.code === "auth/invalid-email" ||
        /badly formatted/.test(error.message)
      ) {
        alert("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        alert("Password must be at least 6 characters.");
      } else {
        alert("Registration failed. Please check your inputs.");
      }
    } finally {
      // ✅ Göm loader och återställ knapptext
      loader.style.visibility = "hidden";
      registerBtn.disabled = false;
      registerBtn.textContent = originalBtnText;
    }
  });
});
