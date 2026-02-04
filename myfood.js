// ===== Firebase setup =====
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== DOM elements =====
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");
const emojiError = document.getElementById("emojiError");
const foodTitle = document.getElementById("foodTitle");
const foodCountry = document.getElementById("foodCountry");
const foodCity = document.getElementById("foodCity");
const addFoodForm = document.getElementById("addFoodForm");
const foodListContainer = document.querySelector(".my-food-list");
const publicFoodListContainer = document.querySelector(".public-food-list");

let selectedEmoji = "";
let countriesData = [];
let currentUserData = null; // här sparar vi användardata inkl mute/banned
let unsubscribeUserStatus = null; // för realtidslyssnaren

// ===== Emoji picker =====
emojiPickerBtn.addEventListener("click", () => {
  emojiPicker.style.display =
    emojiPicker.style.display === "flex" ? "none" : "flex";
});

emojiPicker.querySelectorAll("span").forEach((span) => {
  span.addEventListener("click", () => {
    selectedEmoji = span.textContent;
    emojiPickerBtn.textContent = selectedEmoji;
    emojiPicker.style.display = "none";
    emojiError.style.display = "none"; // göm felmeddelande direkt
  });
});

// ===== Country & City - Dynamiskt =====
async function loadCountries() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    // Rensa och fyll landet dropdown
    foodCountry.innerHTML = '<option value="">Select Country</option>';
    countriesData.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      foodCountry.appendChild(opt);
    });
    foodCountry.disabled = false;
  } catch (err) {
    console.error("Failed to fetch countries:", err);
    alert("Failed to load countries. Try refreshing.");
  }
}

foodCountry.addEventListener("change", () => {
  foodCity.innerHTML = '<option value="">Select City</option>';
  foodCity.disabled = true;

  const countryObj = countriesData.find((c) => c.country === foodCountry.value);
  if (!countryObj) return;

  countryObj.cities.forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    foodCity.appendChild(opt);
  });
  foodCity.disabled = false;
});

// Kör direkt vid sidladdning
loadCountries();

// ===== Realtidslyssnare för användarstatus =====
function listenToUserStatus(userId) {
  if (unsubscribeUserStatus) unsubscribeUserStatus(); // stäng tidigare listener

  unsubscribeUserStatus = db.collection("users").doc(userId)
    .onSnapshot((doc) => {
      if (!doc.exists) return;
      currentUserData = doc.data();

      const now = new Date();

      // Banned
      if (currentUserData.banned === true) {
        alert("You have been banned by an admin. Logging out...");
        setTimeout(() => {
          auth.signOut().then(() => window.location.href = "../index.html");
        }, 100);
        addFoodForm.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
        return;
      }

      // Muted
      if (currentUserData.muteUntil) {
        const muteDate = currentUserData.muteUntil.toDate ? currentUserData.muteUntil.toDate() : new Date(currentUserData.muteUntil);
        if (muteDate > now) {
          alert(`You are muted until ${muteDate.toLocaleString()}. You cannot post foods right now.`);
          addFoodForm.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
        } else {
          addFoodForm.querySelectorAll("input, select, button").forEach(el => el.disabled = false);
        }
      } else {
        // Om ingen mute
        addFoodForm.querySelectorAll("input, select, button").forEach(el => el.disabled = false);
      }
    });
}

// ===== Add food to Firestore =====
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("You must be logged in!");

  const now = new Date();
  if (currentUserData?.banned === true) {
    alert("You are banned and cannot post foods.");
    return;
  }
  if (currentUserData?.muteUntil) {
    const muteDate = currentUserData.muteUntil.toDate ? currentUserData.muteUntil.toDate() : new Date(currentUserData.muteUntil);
    if (muteDate > now) {
      alert(`You are muted until ${muteDate.toLocaleString()}. You cannot post foods right now.`);
      return;
    }
  }

  const title = foodTitle.value.trim();
  const country = foodCountry.value;
  const city = foodCity.value;

  emojiError.style.display = "none"; // reset

  if (!selectedEmoji) {
    emojiError.style.display = "block";
    return;
  }

  if (!title || !country || !city) return alert("Fill in all fields!");
  if (!confirm(`Are you sure you want to publish this Foodpost: "${title}"?`)) return;

  const newFoodData = {
    title,
    emoji: selectedEmoji,
    country,
    city,
    type: "meal",
    ownerId: user.uid,
    userName: user.displayName || user.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("foods").doc(user.uid).collection("items").add(newFoodData);
    await db.collection("publicFoods").add({
      ...newFoodData,
      publishedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Reset form
    foodTitle.value = "";
    foodCountry.value = "";
    foodCity.innerHTML = '<option value="">Select City</option>';
    foodCity.disabled = true;
    emojiPickerBtn.textContent = "Select your food Emoji";
    selectedEmoji = "";
    emojiError.style.display = "none";

    loadFoodList();
    loadPublicFoods();
  } catch (err) {
    console.error("Error adding food: ", err);
    alert("Error adding food. Please try again.");
  }
});

// ===== Load food list =====
async function loadFoodList() {
  const user = auth.currentUser;
  if (!user) return;

  foodListContainer.innerHTML = "";

  try {
    const snapshot = await db
      .collection("foods")
      .doc(user.uid)
      .collection("items")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      const p = document.createElement("p");
      p.className = "no-food";
      p.textContent = "No foods added yet!";
      foodListContainer.appendChild(p);
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "food-item";
      div.innerHTML = `
        <span class="icon">${data.emoji || "🍽️"}</span>
        <div class="food-info">
          <strong>${data.title}</strong><br/>
          <small>${data.city}, ${data.country}</small>
        </div>
        <span class="delete-icon" data-id="${docSnap.id}">&times;</span>
      `;
      foodListContainer.appendChild(div);
    });

    document.querySelectorAll(".delete-icon").forEach((icon) => {
      icon.addEventListener("click", async () => {
        const docId = icon.dataset.id;
        if (!confirm("Are you sure you want to delete this food?")) return;

        try {
          await db.collection("foods").doc(user.uid).collection("items").doc(docId).delete();
          loadFoodList();
        } catch (err) {
          console.error(err);
          alert("Error deleting food.");
        }
      });
    });
  } catch (err) {
    console.error("Error loading foods:", err);
    foodListContainer.textContent = "Failed to load foods.";
  }
}

// ===== Load public foods =====
async function loadPublicFoods() {
  if (!publicFoodListContainer) return;

  publicFoodListContainer.innerHTML = "";

  try {
    const snapshot = await db
      .collection("publicFoods")
      .orderBy("publishedAt", "desc")
      .get();

    if (snapshot.empty) {
      const p = document.createElement("p");
      p.textContent = "No public foods yet!";
      publicFoodListContainer.appendChild(p);
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const publishedDate = data.publishedAt?.toDate();
      const options = { day: "2-digit", month: "short" };
      const formattedDate = publishedDate ? publishedDate.toLocaleDateString("en-US", options) : "";

      const div = document.createElement("div");
      div.className = "public-food-item";
      div.innerHTML = `
        <span class="icon">${data.emoji || "🍽️"}</span>
        <div>
          <strong>${data.title}</strong> by <em>${data.userName}</em><br/>
          <small>${data.city}, ${data.country} • ${formattedDate}</small>
        </div>
      `;
      publicFoodListContainer.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading public foods:", err);
    publicFoodListContainer.textContent = "Failed to load public foods.";
  }
}

// ===== Initial load =====
auth.onAuthStateChanged((user) => {
  if (user) {
    listenToUserStatus(user.uid); // ✅ Realtidslyssnare för mute/banned
    loadFoodList();
    loadPublicFoods();
  }
});
