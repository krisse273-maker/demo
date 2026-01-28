window.addEventListener("DOMContentLoaded", () => {
  // DOM-element
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const headerP = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  // Kontrollera login
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    headerP.textContent = `Welcome, ${currentUser.name}! Find and share food near you!`;
  }

  // Log out
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });

  // Länder/städer
  let countriesData = [];

  async function loadCountries() {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries");
      const data = await res.json();
      countriesData = data.data;

      // Fyll i country dropdown
      countrySelect.innerHTML = '<option value="">Select country</option>';
      countriesData.forEach(c => {
        const option = document.createElement("option");
        option.value = c.country;
        option.textContent = c.country;
        countrySelect.appendChild(option);
      });
    } catch (err) {
      console.error("Failed to load countries:", err);
      alert("Could not load countries. Refresh the page.");
    }
  }

  // Visa städer
  countrySelect.addEventListener("change", () => {
    const selectedCountry = countrySelect.value;
    citySelect.innerHTML = '<option value="">Select city</option>';
    citySelect.disabled = true;

    if (!selectedCountry) return;

    const countryObj = countriesData.find(c => c.country === selectedCountry);
    if (countryObj && countryObj.cities.length) {
      countryObj.cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
      citySelect.disabled = false;
    }
  });

  // --- Hämta sparad mat från localStorage, annars använd dummy-lista ---
  let allFoods = JSON.parse(localStorage.getItem("allFoods"));

  if (!allFoods || !allFoods.length) {
    // Om det inte finns mat i localStorage, lägg in dummy
    allFoods = [
      { title: "Burger", country: "USA", city: "New York", emoji: "🍔", user: "test@example.com" },
      { title: "Sushi", country: "Japan", city: "Tokyo", emoji: "🍣", user: "sushi@domain.com" },
      { title: "Tacos", country: "Mexico", city: "Mexico City", emoji: "🌮", user: "maria@domain.com" },
    ];
    localStorage.setItem("allFoods", JSON.stringify(allFoods));
  }

  // --- Render-funktion ---
  function renderFoodItems(items) {
    foodList.innerHTML = "";
    if (!items.length) {
      foodList.innerHTML = "<p>No food found.</p>";
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("food-item");
      div.innerHTML = `
        <span class="icon">${item.emoji || "🍽️"}</span>
        <h3>${item.title}</h3>
        <p>Location: ${item.city}, ${item.country}</p>
        <p>Shared by: ${item.user || "Anonymous"}</p>
      `;
      foodList.appendChild(div);
    });
  }

  // --- Filtrering (oförändrad) ---
  filterBtn.addEventListener("click", () => {
    const country = countrySelect.value;
    const city = citySelect.value;

    const filtered = allFoods.filter(item => {
      return (!country || item.country === country) && (!city || item.city === city);
    });

    renderFoodItems(filtered);
  });

  // My Food List knapp
  myFoodBtn.addEventListener("click", () => {
    window.location.href = "myfood.html";
  });

  // --- Init ---
  loadCountries().then(() => console.log("Countries loaded."));

  // --- Rendera mat direkt på sidan ---
  renderFoodItems(allFoods);
});
