// globals
let character_index = 0;
let full_text = "";
let character_objects = [];
let words_typed = 0;
let chars_typed = 0;
let chars_wrong = 0;
let start_time = new Date().getTime();
let started = false;
let update_wpm_interval_id = null;
const typing_element = document.getElementById("typing");
const wpm_element = document.getElementById("wpm");
const finish_padding_element = document.getElementById("finish-padding");
const finish_element = document.getElementById("finish");
const accuracy_number = document.getElementById("accuracy-num");
const kb = document.getElementById("keyboard");

// Functions for updating the ui
function lerp(a, b, t) {
  return a * (1.0 - t) + b * t;
}
function gen_color(t) {
  const l = lerp(55, 93, t).toFixed(0);
  const c = 0.45;
  const h = lerp(259, 145, t).toFixed(0);

  return "oklch( " + l + "% " + c + " " + h + ")";
}
function update_underline() {
  const char = character_objects[character_index];

  if (char != null) {
    const char_rect = char.getBoundingClientRect();
    const ty_rect = typing_element.getBoundingClientRect();

    // ty.scroll(0, rect.top + ty.scrollTop);

    underline_target = {
      x: char_rect.left - ty_rect.left,
      y: typing_element.scrollTop + char_rect.bottom,
      w: char_rect.width,
    };
    typing_element.scroll({
      top: char_rect.top + typing_element.scrollTop - char_rect.height * 0.2,
      behavior: "smooth",
    });

    document.documentElement.style.setProperty(
      "--under-left",
      underline_target.x + "px",
    );
    document.documentElement.style.setProperty(
      "--under-top",
      "calc(" + underline_target.y + "px - 1.8rem)",
      // calc( underline_target.y + "px",
    );

    document.documentElement.style.setProperty(
      "--under-width",
      underline_target.w + "px",
    );
  }
}
function update_wpm() {
  const now = new Date().getTime();
  const elapsed = (now - start_time) / 1000;
  const wpm = (words_typed / elapsed) * 60;

  const wpm_coef = 1.0 - Math.exp(wpm * -0.01);

  wpm_element.innerText = wpm.toFixed(0);

  document.documentElement.style.setProperty(
    "--wpm-offset",
    (1.0 - wpm_coef) * 610,
  );
  document.documentElement.style.setProperty(
    "--wpm-color",
    gen_color(wpm_coef),
  );
}

function update_accuracy() {
  let accuracy;
  if (chars_typed == 0) {
    accuracy = 0.0;
    accuracy_number.innerText = "N/a";
  } else {
    accuracy = 1.0 - chars_wrong / chars_typed;
    accuracy_number.innerText = (accuracy * 100).toFixed(0) + "%";
  }

  document.documentElement.style.setProperty(
    "--accuracy-offset",
    (1.0 - accuracy) * 610,
  );

  document.documentElement.style.setProperty(
    "--accuracy-color",
    gen_color(accuracy),
  );
}

// Functions for creating the on screen keyboard
function fill_keyboard() {
  const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  for (let i = 0; i < 3; i++) {
    var row = document.createElement("div");
    row.className = "keyboard-row";
    layout[i].split("").forEach((chr) => {
      row.appendChild(mk_key(chr));
    });
    kb.appendChild(row);
  }
}

function mk_key(chr) {
  const div = document.createElement("div");

  div.className = "key";
  div.id = "key-" + chr;

  if (chr == "f" || chr == "j") {
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.innerHTML =
      chr +
      '<span style="width: 20px; position: relative; top: 3px; height: 2px; background: #f2f2f200; border-radius: 2px; align-self: center;box-shadow: -1px -1px 2px rgba(256,250,240,0.9), 1px 1px 2px rgba(0,20,40,0.2);"></span>';
  } else {
    div.innerText = chr;
  }
  return div;
}

// Functions to update the on screen keyboard
function run_on_kb_key(ch, cb) {
  const chr = ch.toLowerCase();
  const key_pressed = document.getElementById("key-" + chr);
  if (key_pressed != null) {
    cb(key_pressed.classList);
  }
}
function highlight_char(i) {
  run_on_kb_key(full_text[i], (list) => list.add("char-active"));
}
function unhighlight_char(i) {
  const char = character_objects[i];
  run_on_kb_key(full_text[i], (list) => list.remove("char-active"));
  char.classList.remove("char-right");
  char.classList.remove("char-wrong");
}
addEventListener("keydown", (event) => {
  run_on_kb_key(event.key, (list) => list.add("pressed"));
});
addEventListener("keyup", (event) => {
  run_on_kb_key(event.key, (list) => list.remove("pressed"));
});

function on_keydown(event) {
  if (event.defaultPrevented) {
    return; // Do nothing if event already handled
  }

  if (event.key == "'" || event.code == "Space") {
    event.preventDefault();
  }

  if (
    event.key == "Shift" ||
    event.key == "Control" ||
    event.key == "Alt" ||
    event.key == "Meta"
  ) {
    return;
  }

  if (started == false) {
    started = true;
    start_time = new Date().getTime();
    update_wpm_interval_id = setInterval(update_wpm, 1000);
  }

  unhighlight_char(character_index);
  if (event.key == "Backspace") {
    character_index--;
    if (character_index < 0) {
      character_index = 0;
    }
    unhighlight_char(character_index);
    if (full_text[character_index] == " ") {
      words_typed--;

      update_wpm();
    }
  } else {
    let c = character_objects[character_index];
    if (full_text[character_index] == " ") {
      words_typed++;
      update_wpm();
    }
    if (event.key == full_text[character_index]) {
      c.classList.add("char-right");
    } else {
      c.classList.add("char-wrong");
      chars_wrong++;
    }
    chars_typed++;

    update_accuracy();

    character_index++;
    if (character_index == character_objects.length) {
      finish_element.classList.remove("colapsed");
      finish_padding_element.classList.remove("colapsed");

      clearInterval(update_wpm_interval_id);

      typing_element.scroll({
        top: typing_element.scrollTopMax,
        behavior: "smooth",
      });

      character_index--;
      return;
    }
  }
  highlight_char(character_index);
  update_underline();
}

function reset() {
  clearInterval(update_wpm_interval_id);
  finish_element.classList.add("colapsed");
  finish_padding_element.classList.add("colapsed");
  create_typing_display(full_text);
  update_underline();
  update_wpm();
  update_accuracy();
  document.documentElement.style.setProperty("--wpm-color", "");
  document.documentElement.style.setProperty("--accuracy-color", "");
}

addEventListener("keydown", on_keydown);

function parse_words_and_spaces(text) {
  const atoms = [];
  let word = "";
  for (let i = 0; i < full_text.length; i++) {
    if (text[i] == " ") {
      atoms.push(word);
      word = "";
      atoms.push(null);
    } else {
      word += text[i];
    }
  }
  atoms.push(word);
  return atoms;
}

addEventListener("paste", (event) => {
  const paste = (event.clipboardData || window.clipboardData).getData("text");
  paste.replace(/\s+/g, " ").replace(/’/g, "'").replace(/”/g, '"').trim();
  full_text = paste;
  reset();
});

function render_typable_word(words, output_arr) {
  const wrapper = document.createElement("span");
  wrapper.className = "word";
  wrapper.classList.add("keyboard-row");
  for (let i = 0; i < words.length; i++) {
    const span = document.createElement("span");
    span.innerText = words[i];
    span.className = "slim-key";
    output_arr.push(span);
    wrapper.appendChild(span);
  }
  return wrapper;
}

function create_space(output_arr) {
  const span = document.createElement("span");
  span.innerText = "·";
  span.className = "space";
  output_arr.push(span);
  return span;
}

function create_typing_display(text) {
  character_index = 0;
  chars_typed = 0;
  chars_wrong = 0;
  words_typed = 0;
  console.log(text);
  full_text = text;
  const atoms = parse_words_and_spaces(full_text);

  character_objects.forEach((char) => {
    char.remove();
  });

  started = false;
  start_time = Date.now();

  character_objects = [];

  let keys = document.getElementsByClassName("key");
  if (keys != null) {
    for (var i = 0; i < keys.length; i++) {
      keys.item(i).classList.remove("char-active");
    }
  }

  atoms.forEach((atom) => {
    if (atom != null) {
      typing_element.insertBefore(
        render_typable_word(atom, character_objects),
        finish_padding_element,
      );
    } else {
      typing_element.insertBefore(
        create_space(character_objects),
        finish_padding_element,
      );
    }
  });

  character_objects[0].scrollIntoView({ behavior: "smooth" });

  console.log("reset");
}

function on_load() {
  fill_keyboard();
  create_typing_display(
    "Now that you’ve learned a bit more about CSS gradients, and why they are so useful, keep your eye out for them in the services you already use on a daily basis. You’ll find them in logos, advertisements, fortune-500 websites, mobile apps and streaming services. Because they are code-based they add little to no loading time and their effect can be quite dramatic.",
  );
  update_underline();
}

window.onload = on_load;
