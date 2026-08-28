(function () {
  "use strict";

  var STORAGE_KEY = "mealio.meals";

  var form = document.getElementById("meal-form");
  var nameInput = document.getElementById("meal-name");
  var caloriesInput = document.getElementById("meal-calories");
  var typeRow = document.getElementById("type-row");
  var daysEl = document.getElementById("days");
  var emptyEl = document.getElementById("empty-state");
  var todayLabel = document.getElementById("today-label");

  var selectedType = defaultTypeForNow();

  function defaultTypeForNow() {
    var h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 15) return "lunch";
    if (h < 21) return "dinner";
    return "snack";
  }

  function loadMeals() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveMeals(meals) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    } catch (e) {
      // Storage unavailable (private mode); the app still works for the session.
    }
  }

  function dayKey(ts) {
    var d = new Date(ts);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function dayTitle(key) {
    var today = dayKey(Date.now());
    var yesterday = dayKey(Date.now() - 86400000);
    if (key === today) return "Today";
    if (key === yesterday) return "Yesterday";
    var parts = key.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function timeLabel(ts) {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function render() {
    var meals = loadMeals().slice().sort(function (a, b) {
      return b.ts - a.ts;
    });

    daysEl.textContent = "";
    emptyEl.hidden = meals.length > 0;

    var groups = {};
    var order = [];
    meals.forEach(function (m) {
      var key = dayKey(m.ts);
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(m);
    });

    order.forEach(function (key) {
      var section = document.createElement("section");

      var head = document.createElement("div");
      head.className = "day-head";

      var title = document.createElement("span");
      title.className = "day-title";
      title.textContent = dayTitle(key);
      head.appendChild(title);

      var totalKcal = groups[key].reduce(function (sum, m) {
        return sum + (m.kcal || 0);
      }, 0);
      if (totalKcal > 0) {
        var total = document.createElement("span");
        total.className = "day-total";
        total.textContent = totalKcal + " kcal";
        head.appendChild(total);
      }

      var list = document.createElement("ul");
      list.className = "meal-list";

      groups[key].forEach(function (m) {
        var li = document.createElement("li");
        li.className = "meal";

        var info = document.createElement("div");
        info.className = "meal-info";

        var name = document.createElement("div");
        name.className = "meal-name";
        name.textContent = m.name;

        var meta = document.createElement("div");
        meta.className = "meal-meta";
        var type = document.createElement("span");
        type.className = "meal-type";
        type.textContent = capitalize(m.type);
        meta.appendChild(type);
        meta.appendChild(document.createTextNode(" · " + timeLabel(m.ts)));

        info.appendChild(name);
        info.appendChild(meta);
        li.appendChild(info);

        if (m.kcal) {
          var kcal = document.createElement("span");
          kcal.className = "meal-kcal";
          kcal.textContent = m.kcal + " kcal";
          li.appendChild(kcal);
        }

        var del = document.createElement("button");
        del.className = "del-btn";
        del.type = "button";
        del.setAttribute("aria-label", "Delete " + m.name);
        del.textContent = "×";
        del.addEventListener("click", function () {
          var next = loadMeals().filter(function (x) {
            return x.id !== m.id;
          });
          saveMeals(next);
          render();
        });
        li.appendChild(del);

        list.appendChild(li);
      });

      section.appendChild(head);
      section.appendChild(list);
      daysEl.appendChild(section);
    });
  }

  function setType(type) {
    selectedType = type;
    Array.prototype.forEach.call(
      typeRow.querySelectorAll(".type-btn"),
      function (btn) {
        var active = btn.dataset.type === type;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-checked", active ? "true" : "false");
        btn.setAttribute("role", "radio");
      }
    );
  }

  typeRow.addEventListener("click", function (e) {
    var btn = e.target.closest(".type-btn");
    if (btn) setType(btn.dataset.type);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    if (!name) return;

    var kcal = parseInt(caloriesInput.value, 10);
    var meals = loadMeals();
    meals.push({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name: name,
      type: selectedType,
      kcal: kcal > 0 ? kcal : null,
      ts: Date.now(),
    });
    saveMeals(meals);

    nameInput.value = "";
    caloriesInput.value = "";
    nameInput.focus();
    render();
  });

  todayLabel.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  setType(selectedType);
  render();
})();
