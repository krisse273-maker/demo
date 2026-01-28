// --- Kontrollera om användaren är inloggad ---
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Logga användaren för att kontrollera om de är autentiserade
console.log(currentUser); // Lägg till här för att logga användaren

if (!currentUser) {
  window.location.href = "login.html";
}

// --- Lägg till dummy-mat i localStorage om det inte finns ---
if (!localStorage.getItem("allFoods")) {
  const dummyFoods = [
    { title: "Burger", country: "USA", city: "New York", emoji: "🍔", user: "test@example.com" },
    { title: "Sushi", country: "Japan", city: "Tokyo", emoji: "🍣", user: "sushi@domain.com" },
    { title: "Tacos", country: "Mexico", city: "Mexico City", emoji: "🌮", user: "maria@domain.com" },
  ];
  localStorage.setItem("allFoods", JSON.stringify(dummyFoods));
}

// --- Hälsa användaren ---
const headerP = document.getElementById("welcomeMsg");
headerP.textContent = `Welcome, ${currentUser.name}! Here’s your food list.`;

// --- Log out knapp ---
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  firebase.auth().signOut();
  window.location.href = "login.html";
});

// --- DOM-element ---
const myFoodList = document.querySelector(".my-food-list");
const addFoodForm = document.getElementById("addFoodForm");
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");
const foodTitleInput = document.getElementById("foodTitle");
const foodCountrySelect = document.getElementById("foodCountry");
const foodCitySelect = document.getElementById("foodCity");

// --- Mat-data ---
let myFoods = JSON.parse(localStorage.getItem("allFoods")) || [];
let countriesData = []; // För att hålla länder och städer

// --- Firebase-konfiguration och initialisering ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.firebasestorage.app",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

// Initiera Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// --- Hämta alla länder och städer från API ---
async function loadCountries() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    countriesData.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.country;
      option.textContent = c.country;
      foodCountrySelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load countries:", err);
    alert("Could not load countries data. Try refreshing the page.");
  }
}
loadCountries();

// --- Ladda städer när ett land väljs ---
foodCountrySelect.addEventListener("change", () => {
  const selectedCountry = foodCountrySelect.value;
  foodCitySelect.innerHTML = '<option value="">Select City</option>';
  foodCitySelect.disabled = true;

  if (!selectedCountry) return;

  const countryObj = countriesData.find((c) => c.country === selectedCountry);
  if (countryObj && countryObj.cities.length) {
    countryObj.cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      foodCitySelect.appendChild(option);
    });
    foodCitySelect.disabled = false;
  }
});

// --- Emoji picker ---
let selectedEmoji = "";

// Visa emoji-picker när knappen trycks
emojiPickerBtn.addEventListener("click", () => {
  emojiPicker.style.display =
    emojiPicker.style.display === "flex" ? "none" : "flex";
});

// Lägg till eventlyssnare på emoji-pickern för att göra dem klickbara
emojiPicker.addEventListener("click", (e) => {
  if (e.target.tagName.toLowerCase() === "span") {
    selectedEmoji = e.target.textContent; // Sätt vald emoji
    emojiPicker.style.display = "none"; // Stäng emoji-picker
    emojiPickerBtn.textContent = `Selected: ${selectedEmoji}`; // Uppdatera knappen med vald emoji
  }
});

// --- Lägg till mat ---
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedEmoji) {
    alert("Please select an emoji for your food!");
    return;
  }

  const newFood = {
    title: foodTitleInput.value, // Matens namn
    country: foodCountrySelect.value, // Landet maten kommer ifrån
    city: foodCitySelect.value, // Staden maten kommer ifrån
    emoji: selectedEmoji, // Emoji som representerar maten
    user: currentUser.email, // Användarens e-postadress
    timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Firebase timestamp
  };

  let newArray = Array.from(myFoods); // Kopiera befintlig matlista
  newArray.push(newFood); // Lägg till nya matobjektet
  console.log("New food to add:", newFood); // Kontrollera vad som skickas till Firestore
  firebase.auth().onAuthStateChanged(async (user) => {
    // --- Lägg till i Firebase Firestore ---
    try {
      await db.collection("foods").doc(user.uid).collection("items").add({
        title: newFood.title,
        country: newFood.country,
        city: newFood.city,
        emoji: newFood.emoji,
        user: newFood.user,
        ownerId: user.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      alert("Food item added successfully!");

      // --- Uppdatera användarens matlista ---
      loadUserFoods(); // Hämta matdata på nytt
      addFoodForm.reset();
      selectedEmoji = "";
      emojiPickerBtn.textContent = "Select your food Emoji";
      foodCitySelect.disabled = true;
    } catch (error) {
      console.error("Error adding food: ", error); // Logga det faktiska felet här
      alert("Failed to add food!");
    }
  });
});

// --- Ladda användarens matlista från Firestore ---
async function loadUserFoods() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      console.log("User is signed in:", user.uid);
    }

    try {
      const snapshot = await db
        .collection("foods")
        .doc(user.uid)
        .collection("items")
        .orderBy("timestamp", "desc")
        .get();
      myFoods = snapshot.docs.map((doc) => doc.data());

      // Spara alltid i localStorage så index.html har något att rendera
      localStorage.setItem("allFoods", JSON.stringify(myFoods.length ? myFoods : myFoods));

      console.log("User foods loaded:", myFoods);
      renderMyFoods();
    } catch (error) {
      console.error("Error loading user foods: ", error);
      alert("Failed to load food items.");
    }
  });
}

// --- Rendera användarens matlista ---
function renderMyFoods() {
  myFoodList.innerHTML = "";
  if (myFoods.length === 0) {
    myFoodList.innerHTML = `<p class="no-food">You don't have any food listed yet.</p>`;
    return;
  }

  myFoods.forEach((foodItem) => {
    const div = document.createElement("div");
    div.classList.add("food-item");
    div.innerHTML = `<span class="icon">${foodItem.emoji}</span>
                     <h3>${foodItem.title}</h3>
                     <p>${foodItem.city}, ${foodItem.country}</p>`;
    myFoodList.appendChild(div);
  });
}

// --- Initial load av mat ---
window.onload = async () => {
  await loadUserFoods();
};
