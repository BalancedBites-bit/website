function toggleMenu() {
    const menu = document.querySelector(".menu-container");
    const hamburger = document.querySelector(".hamburger");
    menu.classList.toggle("show");
    hamburger.classList.toggle("open");
  }

  document.addEventListener("DOMContentLoaded", function () {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");

      question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close all items
        faqItems.forEach((i) => {
          i.classList.remove("active");
          const answer = i.querySelector(".faq-answer");
          answer.style.maxHeight = "0";
          answer.style.opacity = "0";
          i.querySelector(".faq-icon").style.transform = "rotate(0deg)";
        });

        // Open the clicked item if it was not already active
        if (!isActive) {
          item.classList.add("active");
          answer.style.maxHeight = answer.scrollHeight + "px";
          answer.style.opacity = "1";
          item.querySelector(".faq-icon").style.transform =
            "rotate(180deg)";
        }
      });
    });
  });