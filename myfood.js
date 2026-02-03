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

let selectedEmoji = "";
let countriesData = [];

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

// ===== Add food to Firestore =====
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = foodTitle.value.trim();
  const country = foodCountry.value;
  const city = foodCity.value;

  emojiError.style.display = "none"; // reset

  if (!selectedEmoji) {
    emojiError.style.display = "block";
    return; // stoppar formuläret
  }

  if (!title || !country || !city) return alert("Fill in all fields!");

  const user = auth.currentUser;
  if (!user) return alert("You must be logged in!");

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
    await db
      .collection("foods")
      .doc(user.uid)
      .collection("items")
      .add(newFoodData);

    // Reset form
    foodTitle.value = "";
    foodCountry.value = "";
    foodCity.innerHTML = '<option value="">Select City</option>';
    foodCity.disabled = true;
    emojiPickerBtn.textContent = "Select your food Emoji";
    selectedEmoji = "";
    emojiError.style.display = "none";

    loadFoodList();
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
      <div>
        <strong>${data.title}</strong><br/>
        <small>${data.city}, ${data.country}</small>
      </div>
      <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
    `;
    foodListContainer.appendChild(div);
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const docId = btn.dataset.id;
      if (!confirm("Are you sure you want to delete this food?")) return;

      try {
        await db
          .collection("foods")
          .doc(user.uid)
          .collection("items")
          .doc(docId)
          .delete();
        loadFoodList();
      } catch (err) {
        console.error(err);
        alert("Error deleting food.");
      }
    });
  });
}

// ===== Initial load =====
auth.onAuthStateChanged((user) => {
  if (user) loadFoodList();
});
