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

  function stableTitle(text) {
    var n = 0;
    var i;
    for (i = 0; i < text.length; i++) n = (n * 33 + text.charCodeAt(i)) >>> 0;
    var parts = [];
    for (i = 0; i < LISTS.length; i++) {
      parts.push(LISTS[i].words[(n >>> (i * 3)) % LISTS[i].words.length]);
    }
    return compose(parts);
  }

  function safeTitle(value, fallback) {
    var text = String(value || "").replace(/[~<>]/g, " ").replace(/\s+/g, " ").trim();
    var i;
    if (!text) return fallback == null ? "Class beat" : fallback;
    for (i = 0; i < RESERVED.length; i++) {
      if (RESERVED[i].toLowerCase() === text.toLowerCase()) return RESERVED[i];
    }
    var parts = partsOf(text);
    if (parts) return compose(parts);
    if (fallback === "") return "";
    return stableTitle(text.toLowerCase());
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
      var row = document.createElement("label");
      row.className = "title-row";
      var name = document.createElement("span");
      name.textContent = list.label;
      var sel = document.createElement("select");
      sel.setAttribute("aria-label", list.label);
      list.words.forEach(function (word) {
        var opt = document.createElement("option");
        opt.value = word;
        opt.textContent = word;
        if (word === parts[index]) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        parts[index] = sel.value;
        onChange(compose(parts));
      });
      row.append(name, sel);
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
