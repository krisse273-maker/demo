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
      console.log("Attempting to create user in Firebase Auth...");

      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log("User created in Firebase Auth:", user);

      // Spara användarens namn i Firebase Auth (valfritt, mest för UI)
      await user.updateProfile({ displayName: name });

      // Försök att spara användarens data i Firestore
      const db = firebase.firestore();
      console.log("Attempting to save user data to Firestore...");

      try {
        await db.collection("users").doc(user.uid).set({
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("User saved to Firestore:", name, email);

        // Om användaren är skapad i Firestore, skicka till myfood.html
        window.location.href = "myfood.html";
      } catch (firestoreError) {
        // Logga och visa ett specifikt fel om det inte går att spara i Firestore
        console.error("Error saving user to Firestore:", firestoreError);
        alert("Failed to save user to Firestore: " + firestoreError.message);
      }
    } catch (error) {
      // Logga och visa ett fel om det inte går att skapa användaren i Firebase Auth
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
