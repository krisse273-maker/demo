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
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const profileIcon = document.getElementById("profileIcon");

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
    await auth.signOut();
    window.location.href = "login.html";
  });

  // --- Vänta tills användaren är inloggad ---
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const loggedInUserName = user.displayName || user.email;
    welcomeMsg.textContent = `Welcome, ${loggedInUserName}!`;

    // Neutral emoji istället för profilikon
    profileIcon.textContent = "👤";

    // --- Hämta global publicFoods ---
    let allFoods = [];
    db.collection("publicFoods")
      .orderBy("publishedAt", "desc")
      .onSnapshot(snapshot => {
        allFoods = snapshot.docs.map(doc => {
          const data = doc.data();

          // Visa alltid userName som sparades i databasen
          return {
            title: data.title || "",
            city: data.city || "",
            country: data.country || "",
            emoji: data.emoji || "🍽️",
            user: data.userName || "Anonymous",  // <-- ändrat här
            timestamp: data.publishedAt || null
          };
        });

        renderFoodItems(allFoods);
      }, err => {
        console.error("Error fetching public foods:", err);
        foodList.innerHTML = "<p>Failed to load public foods.</p>";
      });

    // --- Render-funktion ---
    function renderFoodItems(items) {
      foodList.innerHTML = "";
      if (!items.length) {
        foodList.innerHTML = "<p>No food found.</p>";
        return;
      }

      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      items.forEach(item => {
        let dateStr = "";
        if (item.timestamp && item.timestamp.toDate) {
          const date = item.timestamp.toDate();
          const day = date.getDate().toString().padStart(2, "0");
          const month = monthNames[date.getMonth()];
          dateStr = `${day} ${month}`;
        }

        const div = document.createElement("div");
        div.classList.add("food-item");
        div.innerHTML = `
          <div class="food-header">
            <span>${item.emoji}</span>
            <h3>${item.title}</h3>
          </div>
          <div class="food-details">
            <p><span class="icon-small">📍</span><strong>Location:</strong> ${item.city}, ${item.country}</p>
            <p><span class="icon-small">👤</span><strong>Published By:</strong> ${item.user}</p>
            ${dateStr ? `<p><span class="icon-small">📅</span><strong>Posted On:</strong> ${dateStr}</p>` : ""}
          </div>
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
