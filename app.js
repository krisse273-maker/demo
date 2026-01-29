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

/* =========================
   🔒 AUTH-GUARD (KORREKT)
   ========================= */
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // 🔥 användaren är inloggad → starta appen
  startApp();
});

function startApp() {

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

  /* ---------- LÄNDER ---------- */
  fetch("https://countriesnow.space/api/v0.1/countries")
    .then(res => res.json())
    .then(data => {
      countriesData = data.data || [];

      clearSelect(countrySelect);
      const def = document.createElement("option");
      def.value = "";
      def.textContent = "Select country";
      countrySelect.appendChild(def);

      countriesData.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.country;
        opt.textContent = c.country;
        countrySelect.appendChild(opt);
      });
    })
    .catch(err => {
      console.error("Countries error:", err);
    });

  countrySelect.addEventListener("change", () => {
    clearSelect(citySelect);
    const def = document.createElement("option");
    def.value = "";
    def.textContent = "Select city";
    citySelect.appendChild(def);
    citySelect.disabled = true;

    const country = countriesData.find(c => c.country === countrySelect.value);
    if (!country) return;

    country.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  });

  /* ---------- LOGOUT ---------- */
  logoutBtn.addEventListener("click", async () => {
    await firebase.auth().signOut();
    window.location.href = "login.html";
  });

  myFoodBtn.addEventListener("click", () => {
    window.location.href = "myfood.html";
  });

  /* ---------- RENDER ---------- */
  function render(items) {
    foodList.innerHTML = "";
    if (!items.length) {
      foodList.textContent = "No food found.";
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "food-item";
      div.innerHTML = `
        <span class="icon">${item.emoji}</span>
        <h3>${item.title}</h3>
        <p>${item.city}, ${item.country}</p>
        <p>By ${item.user}</p>
      `;
      foodList.appendChild(div);
    });
  }

  /* ---------- GLOBAL FEED ---------- */
  db.collectionGroup("items").onSnapshot(snapshot => {
    allFoods = snapshot.docs.map(d => d.data());
    render(allFoods);
  });

  filterBtn.addEventListener("click", () => {
    const c = countrySelect.value;
    const city = citySelect.value;

    render(
      allFoods.filter(f =>
        (!c || f.country === c) &&
        (!city || f.city === city)
      )
    );
  });
}
