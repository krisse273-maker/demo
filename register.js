// Vänta på att Firebase är klart
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  // Hantera användarregistrering
  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Kolla om alla fält är fyllda
    if (!name || !email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    // Skapa användare via Firebase Auth
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Spara användardata i Firestore under användarens UID
      await firebase.firestore().collection("users").doc(user.uid).set({
        name: name,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Omdirigera användaren till myfood.html
      window.location.href = "myfood.html";
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
