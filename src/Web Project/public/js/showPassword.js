function togglePasswordVisibility(fieldId) {
  var passwordField = document.getElementById(fieldId);

  if (passwordField.type === "password") {
    passwordField.type = "text";

  } else {
    passwordField.type = "password";
  }
}

var resetPasswordButton = document.getElementById("resetPasswordButton");
resetPasswordButton.addEventListener("click", function(event) {
  var passwordField = document.getElementById("password");
  var confirmPasswordField = document.getElementById("confirmPassword");

  if (passwordField.value !== confirmPasswordField.value) {
    alert("Passwords do not match.");
    event.preventDefault();  // Prevent form submission
  }
});
