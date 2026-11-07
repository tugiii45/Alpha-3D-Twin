const path = require("path");

function glob(relativePath) {
  return path.join(__dirname, relativePath).replace(/\\/g, "/");
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [glob("index.html"), glob("src/**/*.{ts,tsx}")],
  theme: {
    extend: {},
  },
  plugins: [],
};
