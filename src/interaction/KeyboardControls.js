// src/interaction/KeyboardControls.js

export class KeyboardControls {
  constructor(onPauseToggle) {
    this.onPauseToggle = onPauseToggle;
    this._addEventListeners();
  }

  _addEventListeners() {
    window.addEventListener("keydown", this._handleKeyDown);
  }

  _handleKeyDown = (event) => {
    if (event.code === "Space") {
      event.preventDefault(); // Prevent default spacebar action (e.g., scrolling)
      if (this.onPauseToggle) {
        this.onPauseToggle();
      }
    }
  };

  // Optional: method to remove event listeners if the controls need to be disabled
  dispose() {
    window.removeEventListener("keydown", this._handleKeyDown);
  }
}