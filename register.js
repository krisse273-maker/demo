document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Kontrollera att alla fält är ifyllda
    if (!name || !email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // Skapa användare i Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Spara displayName i Auth (valfritt, används mest i UI)
      await user.updateProfile({ displayName: name });

      // 🔹 Spara namn, email och timestamp i Firestore users collection
      const db = firebase.firestore();
      await db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log("User saved in Firestore:", name, email);

      // Skicka användaren till myfood.html
      window.location.href = "myfood.html";

    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
