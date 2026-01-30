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

      console.log("User created in Auth:", user.uid); // Kontrollera att användaren skapades korrekt

      // Spara displayName i Auth (valfritt, används mest i UI)
      await user.updateProfile({ displayName: name });

      // Vänta tills användaren är inloggad innan vi försöker spara i Firestore
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          console.log("User is authenticated:", user.uid); // Kontrollera att användaren är autentiserad

          // 🔹 Spara namn, email och timestamp i Firestore users collection
          const db = firebase.firestore();
          console.log("Attempting to save user in Firestore...");

          try {
            await db.collection("users").doc(user.uid).set({
              name: name,
              email: email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log("User saved in Firestore:", name, email);
          } catch (error) {
            console.error("Error saving user to Firestore:", error);
          }

          // Skicka användaren till myfood.html
          window.location.href = "myfood.html";
        } else {
          console.log("No user is authenticated.");
        }
      });

    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
