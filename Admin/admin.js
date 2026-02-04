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

  // Logga ut
  logoutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => window.location.href = "../index.html")
      .catch(err => console.error("Logout error:", err));
  });

  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "../login.html";

    let userDoc;
    try {
      userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists || !userDoc.data()?.admin) {
        alert("Access denied! Only admins can access this page.");
        return window.location.href = "../index.html";
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      alert("Failed to verify admin. Try logging in again.");
      return window.location.href = "../login.html";
    }

    welcomeMsg.textContent = `Welcome, ${userDoc.data().name}!`;

    // Ladda alla publicFoods med loader
    const loader = document.createElement("p");
    loader.textContent = "Loading meals...";
    foodList.innerHTML = "";
    foodList.appendChild(loader);

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
          const div = document.createElement("div");
          div.className = "food-item";
          div.innerHTML = `
            <div class="food-header">
              <span>${data.emoji || "🍽️"}</span>
              <h3>${data.title}</h3>
            </div>
            <div class="food-details">
              <p><span class="icon-small">📍</span><strong>Location:</strong> ${data.city || ""}, ${data.country || ""}</p>
              <p><span class="icon-small">👤</span><strong>Published By:</strong> ${data.userName || "Anonymous"}</p>
            </div>
            <button class="delete-btn">Delete</button>
          `;

          // Delete-knapp
          const deleteBtn = div.querySelector(".delete-btn");
          deleteBtn.addEventListener("click", async () => {
            if (!confirm(`Are you sure you want to delete "${data.title}"?`)) return;
            try {
              await db.collection("publicFoods").doc(doc.id).delete();
              alert(`"${data.title}" deleted!`);
            } catch (err) {
              console.error("Error deleting food:", err);
              alert("Failed to delete this meal.");
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
