(function () {
  "use strict";

  var STORAGE_KEY = "mealio.recipes";

  var listView = document.getElementById("list-view");
  var detailView = document.getElementById("detail-view");
  var editorView = document.getElementById("editor-view");

  var cardsEl = document.getElementById("cards");
  var emptyEl = document.getElementById("empty-state");
  var searchInput = document.getElementById("search");

  var detailTitle = document.getElementById("detail-title");
  var detailIngredients = document.getElementById("detail-ingredients");
  var detailSteps = document.getElementById("detail-steps");

  var form = document.getElementById("recipe-form");
  var fTitle = document.getElementById("f-title");
  var fIngredients = document.getElementById("f-ingredients");
  var fSteps = document.getElementById("f-steps");

  var currentId = null; // recipe open in detail view
  var editingId = null; // recipe open in editor, null means new

  function loadRecipes() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecipes(recipes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    } catch (e) {
      // Storage unavailable (private mode); the app still works for the session.
    }
  }

  function findRecipe(id) {
    return loadRecipes().find(function (r) {
      return r.id === id;
    });
  }

  function lines(text) {
    return text
      .split("\n")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function show(view) {
    listView.hidden = view !== listView;
    detailView.hidden = view !== detailView;
    editorView.hidden = view !== editorView;
    window.scrollTo(0, 0);
  }

  /* List */

  function renderList() {
    var query = searchInput.value.trim().toLowerCase();
    var recipes = loadRecipes()
      .slice()
      .sort(function (a, b) {
        return b.updated - a.updated;
      })
      .filter(function (r) {
        if (!query) return true;
        return (
          r.title.toLowerCase().indexOf(query) !== -1 ||
          r.ingredients.join("\n").toLowerCase().indexOf(query) !== -1
        );
      });

    cardsEl.textContent = "";
    emptyEl.hidden = loadRecipes().length > 0;

    recipes.forEach(function (r) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "card recipe-card";

      var h2 = document.createElement("h2");
      h2.textContent = r.title;

      var p = document.createElement("p");
      p.textContent = r.ingredients.join(", ");

      card.appendChild(h2);
      card.appendChild(p);
      card.addEventListener("click", function () {
        openDetail(r.id);
      });
      cardsEl.appendChild(card);
    });
  }

  /* Detail */

  function openDetail(id) {
    var r = findRecipe(id);
    if (!r) return;
    currentId = id;

    detailTitle.textContent = r.title;

    detailIngredients.textContent = "";
    r.ingredients.forEach(function (ing) {
      var li = document.createElement("li");
      li.textContent = ing;
      detailIngredients.appendChild(li);
    });

    detailSteps.textContent = "";
    r.steps.forEach(function (step) {
      var li = document.createElement("li");
      li.textContent = step;
      detailSteps.appendChild(li);
    });
    detailSteps.previousElementSibling.hidden = r.steps.length === 0;
    detailSteps.hidden = r.steps.length === 0;

    show(detailView);
  }

  /* Editor */

  function openEditor(id) {
    editingId = id || null;
    var r = id ? findRecipe(id) : null;
    fTitle.value = r ? r.title : "";
    fIngredients.value = r ? r.ingredients.join("\n") : "";
    fSteps.value = r ? r.steps.join("\n") : "";
    show(editorView);
    fTitle.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var title = fTitle.value.trim();
    var ingredients = lines(fIngredients.value);
    if (!title || ingredients.length === 0) return;

    var recipes = loadRecipes();
    if (editingId) {
      var existing = recipes.find(function (r) {
        return r.id === editingId;
      });
      if (existing) {
        existing.title = title;
        existing.ingredients = ingredients;
        existing.steps = lines(fSteps.value);
        existing.updated = Date.now();
      }
      saveRecipes(recipes);
      renderList();
      openDetail(editingId);
    } else {
      var recipe = {
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        title: title,
        ingredients: ingredients,
        steps: lines(fSteps.value),
        updated: Date.now(),
      };
      recipes.push(recipe);
      saveRecipes(recipes);
      renderList();
      openDetail(recipe.id);
    }
  });

  /* Wiring */

  document.getElementById("new-btn").addEventListener("click", function () {
    openEditor(null);
  });

  document.getElementById("detail-back").addEventListener("click", function () {
    currentId = null;
    show(listView);
  });

  document.getElementById("edit-btn").addEventListener("click", function () {
    openEditor(currentId);
  });

  document.getElementById("delete-btn").addEventListener("click", function () {
    var r = findRecipe(currentId);
    if (!r) return;
    if (!window.confirm('Delete "' + r.title + '"?')) return;
    saveRecipes(
      loadRecipes().filter(function (x) {
        return x.id !== currentId;
      })
    );
    currentId = null;
    renderList();
    show(listView);
  });

  document.getElementById("editor-cancel").addEventListener("click", function () {
    if (editingId) {
      openDetail(editingId);
    } else {
      show(listView);
    }
  });

  searchInput.addEventListener("input", renderList);

  renderList();
  show(listView);
})();
