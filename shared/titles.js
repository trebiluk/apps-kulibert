/* Class titles. Kids tap one word from each list. They do not type. */
(function (global) {
  var LISTS = [
    { id: "feel", label: "Feel", words: ["whimsical", "sleepy", "tiny", "brave", "quiet", "shiny", "lucky", "gentle"] },
    { id: "color", label: "Color", words: ["blue", "gold", "green", "silver", "amber", "coral", "teal", "violet"] },
    { id: "animal", label: "Animal", words: ["gopher", "otter", "robin", "panda", "fox", "whale", "heron", "beetle"] },
    { id: "kind", label: "Kind", words: ["ballad", "loop", "march", "beat", "sketch", "pulse", "jam", "song"] },
  ];
  var RESERVED = [
    "First Beat", "Clap Class", "Recess", "Night Walk", "Locker Boom", "Blank page",
    "Demo", "March", "Skip", "Class beat", "Written", "Score",
  ];
  var STARTER = ["whimsical", "blue", "gopher", "ballad"];

  function compose(parts) {
    return parts.join(" ");
  }

  function partsOf(value) {
    var bits = String(value || "").replace(/[~<>]/g, " ").replace(/\s+/g, " ").trim().toLowerCase().split(" ");
    if (bits.length !== LISTS.length) return null;
    var out = [];
    var i;
    var w;
    for (i = 0; i < LISTS.length; i++) {
      var found = "";
      for (w = 0; w < LISTS[i].words.length; w++) {
        if (LISTS[i].words[w] === bits[i]) found = LISTS[i].words[w];
      }
      if (!found) return null;
      out.push(found);
    }
    return out;
  }

  function safeTitle(value, fallback) {
    var text = String(value || "").replace(/[~<>]/g, " ").replace(/\s+/g, " ").trim();
    var i;
    for (i = 0; i < RESERVED.length; i++) {
      if (RESERVED[i].toLowerCase() === text.toLowerCase()) return RESERVED[i];
    }
    var parts = partsOf(text);
    if (parts) return compose(parts);
    return fallback == null ? "Class beat" : fallback;
  }

  function starterTitle() {
    return compose(STARTER);
  }

  function pickTitle() {
    return compose(LISTS.map(function (list) {
      return list.words[Math.floor(Math.random() * list.words.length)];
    }));
  }

  function mount(parent, current, onChange) {
    var parts = partsOf(current) || STARTER.slice();
    parent.innerHTML = "";
    parent.classList.add("title-build");
    LISTS.forEach(function (list, index) {
      var row = document.createElement("div");
      row.className = "title-row";
      var label = document.createElement("span");
      label.textContent = list.label;
      row.appendChild(label);
      list.words.forEach(function (word) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn" + (word === parts[index] ? " on" : "");
        b.textContent = word;
        b.setAttribute("aria-pressed", String(word === parts[index]));
        b.addEventListener("click", function () {
          parts[index] = word;
          row.querySelectorAll("button").forEach(function (el) {
            var on = el === b;
            el.classList.toggle("on", on);
            el.setAttribute("aria-pressed", String(on));
          });
          if (onChange) onChange(compose(parts));
        });
        row.appendChild(b);
      });
      parent.appendChild(row);
    });
    return compose(parts);
  }

  global.KulibertTitles = {
    LISTS: LISTS,
    safeTitle: safeTitle,
    pickTitle: pickTitle,
    starterTitle: starterTitle,
    partsOf: partsOf,
    mount: mount,
  };
})(window);
