// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91"
};

// Initiera Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

window.addEventListener("DOMContentLoaded", async () => {
  const foodList = document.querySelector(".admin-food-list");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const usersBtn = document.getElementById("usersBtn");
  const toastContainer = document.getElementById("toastContainer");

  // Toast-funktion
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Logga ut
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "../index.html");
  });

  // Navigera till Users-sidan
  usersBtn.addEventListener("click", () => {
    window.location.href = "user.html";
  });

  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "../login.html";

    let userDoc;
    try {
      userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists || !userDoc.data()?.admin) {
        showToast("Access denied! Only admins can access this page.");
        return window.location.href = "../index.html";
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      showToast("Failed to verify admin. Try logging in again.");
      return window.location.href = "../login.html";
    }

    welcomeMsg.textContent = `Welcome, ${userDoc.data().name || "Admin"}!`;

    // Loader
    foodList.innerHTML = "<p>Loading meals...</p>";

    db.collection("publicFoods").orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        foodList.innerHTML = "";
        if (snapshot.empty) {
          foodList.textContent = "No meals shared yet.";
          return;
        }

        const fragment = document.createDocumentFragment();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const title = data.title || "";
          const emoji = data.emoji || "🍽️";
          const city = data.city || "";
          const country = data.country || "";
          const userName = data.userName || "Anonymous";

          const div = document.createElement("div");
          div.className = "food-item";

          div.innerHTML = `
            <div class="food-header">
              <span>${emoji}</span>
              <h3>${title}</h3>
            </div>
            <div class="food-details">
              <p><span class="icon-small">📍</span><strong>Location:</strong> ${city}, ${country}</p>
              <p><span class="icon-small">👤</span><strong>Published By:</strong> ${userName}</p>
            </div>
            <button class="delete-btn">Delete</button>
          `;

          // Delete-knapp
          div.querySelector(".delete-btn").addEventListener("click", async () => {
            try {
              await db.collection("publicFoods").doc(doc.id).delete();
              showToast(`"${title}" deleted!`);
            } catch (err) {
              console.error("Error deleting food:", err);
              showToast("Failed to delete this meal.");
            }
          });

          fragment.appendChild(div);
        });

        foodList.appendChild(fragment);
      }, err => {
        console.error("Error fetching publicFoods:", err);
        foodList.textContent = "Failed to load meals.";
      });
  });
});
