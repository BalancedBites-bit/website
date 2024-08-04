document.addEventListener("DOMContentLoaded", () => {
  const flashMessages = document.querySelectorAll(".flash-message");

  function hideFlashMessage(flashMessage) {
    flashMessage.classList.remove("show");
    setTimeout(() => {
      flashMessage.remove();
    }, 500); // Adjust the delay as needed
  }

  flashMessages.forEach((flashMessage) => {
    const closeButton = flashMessage.querySelector(".close-btn");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        hideFlashMessage(flashMessage);
      });
    }

    // Automatically hide the messages after 5 seconds
    setTimeout(() => {
      hideFlashMessage(flashMessage);
    }, 5000);
  });
});
