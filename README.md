# wave-record

A web app to record audio from your microphone, visualize the waveform in real time, and export your recordings. Built with Vite and TypeScript.

## Functionality

- Record audio from your microphone using the browser's MediaRecorder API.
- Visualize the live waveform as you record.
- Start, pause, and stop recording with simple controls.
- Review and export your recordings (WAV or browser-supported format).
- Lightweight, fast, and easy to use.

## Quick start

1. Install dependencies

   npm install

2. Run the dev server

   npm run dev

3. Build for production

   npm run build

4. Preview production build

   npm run preview

(If your package.json uses different scripts, substitute those commands.)

## Project structure (important files)

- index.html — app entry HTML
- src/main.ts — app bootstrapping
- src/wave-record.ts — main app code
- public/ — static assets (style.css, images, fonts)
- package.json, tsconfig.json, vite config (if present)

## Add Tailwind CSS (optional)

If you want Tailwind utility classes, a minimal setup is:

1. Install Tailwind and PostCSS tooling (dev deps):

   npm install -D tailwindcss postcss autoprefixer

2. Initialize config files:

   npx tailwindcss init -p

3. Configure `tailwind.config.js` content paths, e.g.:

   module.exports = {
     content: ["./index.html", "./src/**/*.{ts,js,tsx,jsx}"],
     theme: { extend: {} },
     plugins: [],
   }

4. Replace or update your CSS (public/style.css) to include:

   @tailwind base;
   @tailwind components;
   @tailwind utilities;

5. Ensure the stylesheet is loaded by the app (linked in index.html or imported in src/main.ts).

If you'd like, I can add Tailwind to this project now and wire up the config and CSS for you.

## Notes

- This README is intentionally short — tell me what else you'd like documented (usage, examples, tests, CI).

- If you want a more detailed contributor guide or a license file, I can add that too.
