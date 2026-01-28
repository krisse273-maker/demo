window.addEventListener("DOMContentLoaded", async () => {
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const headerP = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  // Kontrollera inloggad användare
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) window.location.href = "login.html";
  headerP.textContent = `Welcome, ${currentUser.name}! Find and share food near you!`;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });

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

  // --- Hämta global mat från localStorage ---
  let allFoods = JSON.parse(localStorage.getItem("allFoods")) || [];

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

  filterBtn.addEventListener("click", () => {
    const country = countrySelect.value;
    const city = citySelect.value;

    const filtered = allFoods.filter(f =>
      (!country || f.country === country) &&
      (!city || f.city === city)
    );
    renderFoodItems(filtered);
  });

  renderFoodItems(allFoods);

  myFoodBtn.addEventListener("click", () => {
    window.location.href = "myfood.html";
  });
});
