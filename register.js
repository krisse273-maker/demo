document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Kolla att alla fält är fyllda
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields!");
      return;
    }

    // Kontrollera att lösenord matchar
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Validera maxlängder (valfritt)
    if (name.length > 50) {
      alert("Name must be 50 characters or less");
      return;
    }
    if (email.length > 100) {
      alert("Email must be 100 characters or less");
      return;
    }
    if (password.length > 128) {
      alert("Password must be 128 characters or less");
      return;
    }

    try {
      // Kontrollera om namnet redan finns i Firestore (case-insensitive)
      const usersRef = firebase.firestore().collection("users");
      const nameQuery = await usersRef
        .where("publicName", "==", name.toLowerCase())
        .get();

      if (!nameQuery.empty) {
        alert("This name is already taken. Please choose another.");
        return;
      }

      // Skapa användare i Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Sätt displayName för Auth-användaren
      await user.updateProfile({ displayName: name });

      // Skapa Firestore-dokument för användaren
      await firebase.firestore().collection("users").doc(user.uid).set({
        name: name,
        publicName: name.toLowerCase(),
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Skicka användaren till index.html
      window.location.href = "index.html";

    } catch (error) {
      console.error("Error during registration:", error);

      // Visa förenklat felmeddelande för email och annat
      if (error.code === "auth/email-already-in-use") {
        alert("This email already exists.");
      } else {
        alert("Registration failed: " + error.message);
      }
    }
  });
});
