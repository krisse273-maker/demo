// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91"
};

// Initiera Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

window.addEventListener("DOMContentLoaded", async () => {

  // --- Säkerhet: Kolla auth först ---
  const user = firebase.auth().currentUser;
  if (!user) {
    // Om inte inloggad -> skicka till login
    window.location.href = "login.html";
    return;
  }

  // --- Allt annat startar först efter att användare är inloggad ---
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  let countriesData = [];
  let allFoods = [];

  function clearSelect(select) {
    while (select.firstChild) select.removeChild(select.firstChild);
  }

  // --- Ladda länder/städer ---
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data || [];

    clearSelect(countrySelect);
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select country";
    countrySelect.appendChild(defaultOption);

    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      countrySelect.appendChild(opt);
    });
    countrySelect.disabled = false;
  } catch (err) {
    console.error("Could not fetch countries:", err);
    alert("Failed to load countries. Refresh the page.");
  }

  // --- När ett land väljs ---
  countrySelect.addEventListener("change", () => {
    clearSelect(citySelect);
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select city";
    citySelect.appendChild(defaultOption);
    citySelect.disabled = true;

    const selectedCountry = countrySelect.value;
    if (!selectedCountry) return;

    const countryObj = countriesData.find(c => c.country === selectedCountry);
    if (!countryObj || !countryObj.cities.length) return;

    countryObj.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  });

  // --- Logout ---
  logoutBtn.addEventListener("click", async () => {
    await firebase.auth().signOut();
    window.location.href = "login.html";
  });

  // --- Navigera till My Food ---
  myFoodBtn.addEventListener("click", () => {
    window.location.href = "myfood.html";
  });

  // --- Rendera global food-list ---
  function renderFoodItems(items) {
    while (foodList.firstChild) foodList.removeChild(foodList.firstChild);

    if (!items.length) {
      const p = document.createElement("p");
      p.textContent = "No food found.";
      foodList.appendChild(p);
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("food-item");

      const emojiSpan = document.createElement("span");
      emojiSpan.classList.add("icon");
      emojiSpan.textContent = item.emoji || "🍽️";

      const titleH3 = document.createElement("h3");
      titleH3.textContent = item.title || "";

      const locationP = document.createElement("p");
      locationP.textContent = `Location: ${item.city || ""}, ${item.country || ""}`;

      const userP = document.createElement("p");
      userP.textContent = `Shared by: ${item.user || "Anonymous"}`;

      div.appendChild(emojiSpan);
      div.appendChild(titleH3);
      div.appendChild(locationP);
      div.appendChild(userP);

      foodList.appendChild(div);
    });
  }

  // --- Realtidslyssning på global foods ---
  db.collectionGroup("items")
    .onSnapshot(snapshot => {
      allFoods = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          title: data.title || "",
          city: data.city || "",
          country: data.country || "",
          emoji: data.emoji || "🍽️",
          user: data.user || "Anonymous",
          timestamp: data.timestamp || null
        };
      });

      renderFoodItems(allFoods);
    }, err => {
      console.error("Error fetching global foods:", err);
    });

  // --- Filter ---
  filterBtn.addEventListener("click", () => {
    const selectedCountry = countrySelect.value;
    const selectedCity = citySelect.value;

    const filtered = allFoods.filter(f =>
      (!selectedCountry || f.country === selectedCountry) &&
      (!selectedCity || f.city === selectedCity)
    );

    renderFoodItems(filtered);
  });
});
