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

      // Uppdatera användarnamnet i Firebase Auth
      await user.updateProfile({
        displayName: name, // Uppdatera med användarnamnet
      });

      // Spara användardata i Firestore
      await firebase.firestore().collection("users").doc(user.uid).set({
        name: name,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Spara användaren i localStorage för myfood.html
      localStorage.setItem("currentUser", JSON.stringify({ email: user.email, name: name }));

      // Skicka användaren till myfood.html
      window.location.href = "myfood.html";
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
