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
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const homeBtn = document.getElementById("homeBtn");

  // --- Länder/städer ---
  let countriesData = [];
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    countrySelect.innerHTML = '<option value="">Select country</option>';
    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      countrySelect.appendChild(opt);
    });
    countrySelect.disabled = false;
  } catch (err) {
    console.error("Could not fetch countries:", err);
    alert("Failed to load countries. Try refreshing.");
  }

  countrySelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select city</option>';
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

  // --- Navigera ---
  myFoodBtn.addEventListener("click", () => window.location.href = "myfood.html");
  logoutBtn.addEventListener("click", async () => {
    await firebase.auth().signOut();
    window.location.href = "login.html";
  });
  if (homeBtn) homeBtn.addEventListener("click", () => window.location.href = "index.html");

  // --- Vänta tills användaren är inloggad innan Firestore ---
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      // Användaren är inte inloggad → redirect till login
      window.location.href = "login.html";
      return;
    }

    // --- Global real-time food list ---
    let allFoods = [];

    db.collection("publicFoods")
      .orderBy("createdAt", "desc") // OBS: ska vara samma som vi använder i myfood.js
      .onSnapshot(snapshot => {
        allFoods = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            title: data.title || "",
            city: data.city || "",
            country: data.country || "",
            emoji: data.emoji || "🍽️",
            user: data.user || "Anonymous",
            timestamp: data.createdAt || null // vi sparar createdAt i myfood.js
          };
        });

        renderFoodItems(allFoods);
      }, err => {
        console.error("Error fetching global foods:", err);
      });

    // --- Render-funktion ---
    function renderFoodItems(items) {
      foodList.innerHTML = "";
      if (!items.length) {
        foodList.innerHTML = "<p>No food found.</p>";
        return;
      }
      items.forEach(item => {
        // Konvertera Firestore timestamp till läsbar tid
        let timeStr = "Unknown time";
        if (item.timestamp) {
          const date = item.timestamp.toDate(); // timestamp → JS Date
          // Visa bara datum och timmar/minuter utan sekunder
          const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
          timeStr = date.toLocaleString(undefined, options); // t.ex. "01/29/2026, 21:29"
        }

        const div = document.createElement("div");
        div.classList.add("food-item");
        div.innerHTML = `
          <span class="icon">${item.emoji}</span>
          <h3>${item.title}</h3>
          <p>Location: ${item.city}, ${item.country}</p>
          <p>Shared by: ${item.user}</p>
          <p>Posted: ${timeStr}</p>
        `;
        foodList.appendChild(div);
      });
    }

    // --- Filterknapp ---
    filterBtn.addEventListener("click", () => {
      const country = countrySelect.value;
      const city = citySelect.value;

      const filtered = allFoods.filter(f =>
        (!country || f.country === country) &&
        (!city || f.city === city)
      );

      renderFoodItems(filtered);
    });
  });
});
