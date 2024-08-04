function showSection(sectionId) {
    document.querySelector(".admitted-section").classList.add("hidden");
    document.querySelector(".pending-section").classList.add("hidden");
    document.querySelector(".counseling-section").classList.add("hidden");
    document.querySelector(".upcoming-sessions").classList.add("hidden");
    document.querySelector(`#${sectionId}`).classList.remove("hidden");
    document.querySelector(`#${sectionId}`).classList.add("fadeIn");
    document
      .querySelectorAll(".navbar button")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelector(`.navbar button[data-section="${sectionId}"]`)
      .classList.add("active");
  }
