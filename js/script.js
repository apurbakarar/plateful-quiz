window.addEventListener("load", function () {
  "use strict";

  var PRODUCT_URL = "https://www.plateful.co/products/ti-pan";

  var FLOW = [
    "intro",
    "frequency",
    "food",
    "pan-use",
    "heat",
    "lifespan",
    "cookware",
    "cookware-info",
    "cook-for",
    "transfer",
    "analysis-transition",
    "assessment",
    "why-fails",
    "recommendation",
    "product",
    "feat-titanium",
    "feat-nonstick",
    "feat-limits",
    "feat-lifetime",
    "trusted",
    "submit",
  ];

  var COOKWARE_INFO = {
    "Non-stick": {
      title: "Your Non-Stick Pan May Be Releasing Toxins",
      line1: "Non-stick coatings break down with heat and scratches.",
      line2:
        "As they degrade, highly toxic chemicals can migrate into food — even when the pan still looks fine.",
      img: "images/info-nonstick.webp",
    },
    "Stainless steel": {
      title: "You Thought Stainless Steel Was Safe - It's Not",
      line1:
        "Under high heat and surface wear, stainless steel can release chromium and nickel.",
      line2: " These metals accumulate in the body over time.",
      img: "images/info-stainless.webp",
    },
    "Cast iron": {
      title: "Cast Iron Can Rust Faster Than You Think",
      line1: "Cast iron reacts with acidic food like tomatoes and wine.",
      line2:
        "Without perfect seasoning and drying, it can rust and shed metal particles into meals.",
      img: "images/info-castiron.webp",
    },
    Ceramic: {
      title: "Ceramic Coatings Chip and Crack Over Time",
      line1: "Ceramic pans rely on surface coatings.",
      line2: "Over time, they chip, crack, and expose underlying materials.",
      img: "images/info-ceramic.webp",
    },
    Other: {
      title: "Your Non-Stick Pan May Be Releasing Toxins",
      line1: "Non-stick coatings break down with heat and scratches.",
      line2:
        "As they degrade, highly toxic chemicals can migrate into food — even when the pan still looks fine.",
      img: "images/info-nonstick.webp",
    },
  };

  var INTERSTITIALS = [
    "Would you switch your pan to stop toxic exposure from your meals forever?",
    "Would a pan that lasts a lifetime justify a higher upfront cost?",
    "Do you want to claim your personalized solution and discount?",
  ];

  var answers = {};
  var current = 0;
  var submitStarted = false;

  var backBtn = document.getElementById("backBtn");
  var screens = {};
  FLOW.forEach(function (step) {
    screens[step] = document.querySelector('[data-step="' + step + '"]');
  });

  function show(index) {
    current = Math.max(0, Math.min(index, FLOW.length - 1));
    var currentStep = FLOW[current];

    FLOW.forEach(function (step, i) {
      screens[step].classList.toggle("active", i === current);
    });

    backBtn.classList.toggle("visible", current > 0);

    // Auto-advance if on the loader/transition screen
    if (currentStep === "analysis-transition") {
      setTimeout(function () {
        const loader = document.querySelector(".circle-loader");
        if (loader) {
          loader.classList.add("load-complete"); // Trigger animation

          // Wait for the checkmark animation to finish before proceeding
          setTimeout(next, 1200);
        } else {
          next();
        }
      }, 2000); // Original delay before showing the checkmark
    }

    if (currentStep === "cookware-info") applyCookwareInfo();

    if (currentStep === "submit") {
      startSubmit();
    } else {
      stopSubmit();
    }

    window.scrollTo(0, 0);
    if (location.hash !== "#" + currentStep) {
      history.pushState(null, "", "#" + currentStep);
    }
  }

  function next() {
    // 1. Define steps that require validation (must select an option)
    const stepsToValidate = ["intro", "pan-use"];
    const currentStepKey = FLOW[current];

    if (stepsToValidate.includes(currentStepKey)) {
      const optionsGroup = screens[currentStepKey].querySelector(".options");
      const isSelected = optionsGroup.querySelector("input:checked");

      if (!isSelected) {
        // 2. Apply shake animation if nothing is selected
        optionsGroup.classList.add("shake-animation");

        // 3. Remove class once animation ends so it can be re-triggered
        optionsGroup.addEventListener(
          "animationend",
          () => {
            optionsGroup.classList.remove("shake-animation");
          },
          { once: true },
        );

        return; // Stop execution: do not proceed to next screen
      }
    }

    show(current + 1);
  }

  // Add this to your script.js or a script tag
  document
    .querySelector('label.card input[value="Other"]')
    .addEventListener("click", function () {
      // Wait for the default logic to run, then override
      setTimeout(() => {
        const targetIndex = FLOW.indexOf("cook-for");
        if (targetIndex !== -1) show(targetIndex);
      }, 200);
    });

  /*function back() {
    show(current + 1);
  }*/

  function applyCookwareInfo() {
    var info = COOKWARE_INFO[answers.cookware] || COOKWARE_INFO["Other"];
    document.getElementById("cookwareInfoTitle").textContent = info.title;
    document.getElementById("cookwareInfoLine1").textContent = info.line1;
    document.getElementById("cookwareInfoLine2").textContent = info.line2;
    document.getElementById("cookwareInfoImg").src = info.img;
  }

  document.querySelectorAll("[data-question]").forEach(function (group) {
    var auto = group.dataset.auto === "true";
    var key = group.dataset.question;

    group.addEventListener("click", function (e) {
      var input = e.target;

      if (input.type === "radio") {
        group.querySelectorAll(".option, .card").forEach(function (el) {
          el.classList.toggle("selected", el.contains(input) && input.checked);
        });

        answers[key] = input.value;

        if (auto) setTimeout(next, 180);
      } else {
        input.closest(".option").classList.toggle("selected", input.checked);

        answers[key] = Array.prototype.map.call(
          group.querySelectorAll("input:checked"),
          function (i) {
            return i.value;
          },
        );
      }
    });
  });

  // Simplified Next Button handling
  document.querySelectorAll("[data-next]").forEach(function (btn) {
    btn.addEventListener("click", next);
  });

  backBtn.addEventListener("click", function () {
    history.back();
  });

  window.addEventListener("popstate", function () {
    var step = location.hash.slice(1);
    var idx = FLOW.indexOf(step);

    if (idx >= 0 && idx !== current) show(idx);
  });

  var overlay = document.getElementById("modalOverlay");
  var modalQuestion = document.getElementById("modalQuestion");
  var ctaBtn = document.getElementById("ctaBtn");
  var interstitialIdx = 0;
  var modalCallback = null;
  var activeProgressTimer = null;
  var submitRunId = 0;

  function isSubmitActive(runId) {
    return runId === submitRunId && FLOW[current] === "submit" && submitStarted;
  }

  function clearProgressTimer() {
    if (!activeProgressTimer) return;

    clearInterval(activeProgressTimer);
    activeProgressTimer = null;
  }

  function askInterstitial(callback, runId) {
    if (!isSubmitActive(runId)) return;

    if (interstitialIdx >= INTERSTITIALS.length) {
      callback();
      return;
    }

    modalCallback = callback;
    modalQuestion.textContent = INTERSTITIALS[interstitialIdx];
    overlay.classList.add("open");
  }

  overlay.querySelectorAll("[data-answer]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!submitStarted || FLOW[current] !== "submit") {
        overlay.classList.remove("open");
        return;
      }

      answers["interstitial" + (interstitialIdx + 1)] = btn.dataset.answer;
      interstitialIdx++;
      overlay.classList.remove("open");

      if (modalCallback) {
        var callback = modalCallback;
        modalCallback = null;
        callback();
      }
    });
  });

  function animateBar(row, done, runId) {
    var fill = row.querySelector(".fill");
    var pct = row.querySelector(".pct");
    var value = 0;
    var modalShown = false;

    function startTimer() {
      if (!isSubmitActive(runId)) return;

      activeProgressTimer = setInterval(function () {
        if (!isSubmitActive(runId)) {
          clearProgressTimer();
          return;
        }

        value = Math.min(modalShown ? 100 : 50, value + 4);

        fill.style.width = value + "%";
        pct.textContent = value + "%";

        if (value === 50 && !modalShown) {
          modalShown = true;
          clearProgressTimer();

          askInterstitial(startTimer, runId);
          return;
        }

        if (value >= 100) {
          clearProgressTimer();
          done();
        }
      }, 120);
    }

    startTimer();
  }

  function resetSubmit() {
    var rows = document.querySelectorAll("#screen-submit .progress-row");

    rows.forEach(function (row) {
      row.querySelector(".fill").style.width = "0%";
      row.querySelector(".pct").textContent = "0%";
    });

    interstitialIdx = 0;
    modalCallback = null;

    INTERSTITIALS.forEach(function (_, index) {
      delete answers["interstitial" + (index + 1)];
    });

    overlay.classList.remove("open");

    document.getElementById("submitTitle").textContent =
      "Applying Your $310 Discount…";

    ctaBtn.hidden = true;
  }

  function stopSubmit() {
    clearProgressTimer();

    submitRunId++;
    submitStarted = false;
    modalCallback = null;

    overlay.classList.remove("open");
  }

  function finishSubmit(runId) {
    if (!isSubmitActive(runId)) return;

    overlay.classList.remove("open");

    document.getElementById("submitTitle").textContent =
      "Your $310 Discount Is Ready";

    ctaBtn.hidden = false;
    ctaBtn.focus();
  }

  function runProgressBar(rows, index, runId) {
    if (!isSubmitActive(runId)) return;

    if (index >= rows.length) {
      finishSubmit(runId);
      return;
    }

    animateBar(
      rows[index],
      function () {
        runProgressBar(rows, index + 1, runId);
      },
      runId,
    );
  }

  function startSubmit() {
    stopSubmit();
    resetSubmit();

    submitStarted = true;
    submitRunId++;

    var runId = submitRunId;
    var rows = document.querySelectorAll("#screen-submit .progress-row");

    runProgressBar(rows, 0, runId);
  }

  ctaBtn.addEventListener("click", function () {
    window.location.href = PRODUCT_URL;
  });

  var initial = FLOW.indexOf(location.hash.slice(1));
  show(initial >= 0 ? initial : 0);
});
