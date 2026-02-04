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
  logoutBtn.addEventListener("click", () => auth.signOut().then(() => window.location.href = "../index.html"));

  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "../login.html";

    // Kolla att användaren är admin
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data().admin) {
      alert("Access denied! Only admins can access this page.");
      return window.location.href = "../index.html";
    }

    welcomeMsg.textContent = `Welcome, ${userDoc.data().name}!`;

    // Ladda alla publicFoods
    db.collection("publicFoods").orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        foodList.innerHTML = "";
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
          const deleteBtn = div.querySelector(".delete-btn");
          deleteBtn.addEventListener("click", async () => {
            if (confirm(`Are you sure you want to delete "${data.title}"?`)) {
              try {
                await db.collection("publicFoods").doc(doc.id).delete();
                alert("Deleted!");
              } catch (err) {
                console.error("Error deleting food:", err);
                alert("Failed to delete!");
              }
            }
          });

          foodList.appendChild(div);
        });
      });
  });
});
