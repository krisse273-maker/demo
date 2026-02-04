// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91"
};

// Init Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

window.addEventListener("DOMContentLoaded", async () => {
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const foodTitle = document.getElementById("foodTitle");
  const adminPanel = document.getElementById("adminPanel");

  let countriesData = [];
  let allFoods = [];

  const countryFlags = {
    Sweden: "🇸🇪",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Germany: "🇩🇪",
    France: "🇫🇷",
    Italy: "🇮🇹",
    Spain: "🇪🇸",
    Mexico: "🇲🇽",
    Japan: "🇯🇵",
    China: "🇨🇳",
    India: "🇮🇳"
  };

  logoutBtn.addEventListener("click", () =>
    auth.signOut().then(() => (window.location.href = "login.html"))
  );

  myFoodBtn.addEventListener("click", () => {
    window.location.href = "myfood.html";
  });

  async function loadCountries() {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    countrySelect.innerHTML = '<option value="">Select country</option>';
    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = `${countryFlags[c.country] || ""} ${c.country}`;
      countrySelect.appendChild(opt);
    });
  }

  countrySelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select city</option>';
    citySelect.disabled = true;

    const countryObj = countriesData.find(c => c.country === countrySelect.value);
    if (!countryObj) return;

    countryObj.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  });

  filterBtn.addEventListener("click", () => {
    const country = countrySelect.value;
    const city = citySelect.value;

    const filtered = allFoods.filter(f =>
      (!country || f.country === country) &&
      (!city || f.city === city)
    );
    renderFoodItems(filtered);
  });

  auth.onAuthStateChanged(async user => {
    if (!user) return (window.location.href = "login.html");

    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}!`;

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists && userDoc.data().admin === true) {
      adminPanel.style.display = "block";
    }

    await loadCountries();
    loadGlobalFood(user);
  });

  function loadGlobalFood(user) {
    db.collection("publicFoods")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        allFoods = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            title: d.title,
            city: d.city,
            country: d.country,
            emoji: d.emoji || "🍽️",
            user: d.userName,
            timestamp: d.createdAt
          };
        });
        renderFoodItems(allFoods);
      });
  }

  function renderFoodItems(items) {
    foodList.innerHTML = "";
    if (!items.length) {
      foodList.innerHTML = "<p>No food found.</p>";
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "food-item";
      div.innerHTML = `
        <span>${item.emoji}</span>
        <h3>${item.title}</h3>
        <p>${item.city}, ${item.country}</p>
        <small>By ${item.user}</small>
      `;
      foodList.appendChild(div);
    });
  }
});

// ===== MUTE ALERT (ENDA LISTENERN) =====
let muteAlertShown = false;

auth.onAuthStateChanged(user => {
  if (!user) return;

  db.collection("users")
    .doc(user.uid)
    .onSnapshot(docSnap => {
      if (!docSnap.exists) return;

      const data = docSnap.data();
      if (!data.muteUntil) return;

      const muteDate = data.muteUntil.toDate
        ? data.muteUntil.toDate()
        : new Date(data.muteUntil);

      if (muteDate > new Date() && !muteAlertShown) {
        muteAlertShown = true;

        const backdrop = document.getElementById("customAlertBackdrop");
        const msg = document.getElementById("alertMessage");
        const okBtn = document.getElementById("alertOkBtn");

        if (!backdrop || !msg || !okBtn) return;

        msg.textContent = `You are muted until ${muteDate.toLocaleString()}`;
        backdrop.classList.remove("hidden");

        okBtn.onclick = () => {
          backdrop.classList.add("hidden");
        };
      }
    });
});
