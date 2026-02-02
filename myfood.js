// ===== Firebase setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== DOM elements =====
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");
const foodTitle = document.getElementById("foodTitle");
const foodCountry = document.getElementById("foodCountry");
const foodCity = document.getElementById("foodCity");
const addFoodForm = document.getElementById("addFoodForm");
const foodListContainer = document.querySelector(".my-food-list");

let selectedEmoji = "";

// ===== Emoji picker toggle =====
emojiPickerBtn.addEventListener("click", () => {
  emojiPicker.style.display = emojiPicker.style.display === "flex" ? "none" : "flex";
});

emojiPicker.querySelectorAll("span").forEach(span => {
  span.addEventListener("click", () => {
    selectedEmoji = span.textContent;
    emojiPickerBtn.textContent = selectedEmoji;
    emojiPicker.style.display = "none";
  });
});

// ===== Country & city handling =====
const countries = {
  Sweden: ["Stockholm", "Gothenburg", "Malmö"],
  USA: ["New York", "Los Angeles", "Chicago"],
  Japan: ["Tokyo", "Osaka", "Kyoto"]
};

for (let country in countries) {
  const option = document.createElement("option");
  option.value = country;
  option.textContent = country;
  foodCountry.appendChild(option);
}

foodCountry.addEventListener("change", () => {
  const cities = countries[foodCountry.value] || [];
  foodCity.innerHTML = '<option value="">Select City</option>';
  foodCity.disabled = cities.length === 0;
  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    foodCity.appendChild(option);
  });
});

// ===== Add food to Firestore =====
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = foodTitle.value.trim();
  const country = foodCountry.value;
  const city = foodCity.value;

  if (!title || !country || !city) return alert("Please fill in all fields!");

  try {
    await addDoc(collection(db, "foods"), {
      title,
      emoji: selectedEmoji,
      country,
      city,
      createdAt: new Date()
    });

    // Reset form
    foodTitle.value = "";
    foodCountry.value = "";
    foodCity.innerHTML = '<option value="">Select City</option>';
    foodCity.disabled = true;
    emojiPickerBtn.textContent = "Select your food Emoji";
    selectedEmoji = "";

    loadFoodList();
  } catch (err) {
    console.error(err);
    alert("Error adding food.");
  }
});

// ===== Load food list from Firestore =====
async function loadFoodList() {
  foodListContainer.innerHTML = "";

  const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const noFood = document.createElement("p");
    noFood.className = "no-food";
    noFood.textContent = "No foods added yet!";
    foodListContainer.appendChild(noFood);
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "food-item";
    div.innerHTML = `
      <span class="icon">${data.emoji || "🍽️"}</span>
      <div>
        <strong>${data.title}</strong><br/>
        <small>${data.city}, ${data.country}</small>
      </div>
    `;
    foodListContainer.appendChild(div);
  });
}

// ===== Initial load =====
document.addEventListener("DOMContentLoaded", loadFoodList);
