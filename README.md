# MechCheck - Organic Chemistry Mechanism Checker

Draw or upload organic chemistry mechanisms and get instant AI-powered feedback on correctness, errors, and step-by-step solutions.

## Features

- **Freehand Drawing Canvas** — Draw mechanisms with pen, eraser, multiple colors, undo/redo
- **Image Upload** — Drag & drop or browse to upload photos of handwritten mechanisms
- **AI Analysis** — Powered by Google Gemini 2.0 Flash (free tier) to identify reaction types, verify correctness, and pinpoint errors
- **Error Explanation & Teaching** — Learn why mistakes were made and the underlying concepts
- **Correct Mechanism Generation** — Get step-by-step descriptions of the correct mechanism
- **Electron Pushing Diagrams** — Analyze curved arrow notation and electron flow
- **Structure Determination** — Help with spectral data interpretation and structure ID problems
- **Chat History** — Conversations saved in browser localStorage with sidebar navigation
- **Follow-up Questions** — Ask clarifying questions within the same conversation
- **Dark/Light Mode** — Toggle between themes

## Setup

1. **Get a free Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey) (no credit card required)

2. **Clone and install:**
   ```bash
   cd chem-mechanism-checker
   npm install
   ```

3. **Set your API key** — edit `.env.local`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 16** (App Router) — React framework
- **Google Gemini 2.0 Flash** — Multimodal AI (free tier: 1,500 req/day)
- **Tailwind CSS + shadcn/ui** — Modern UI components
- **react-sketch-canvas** — Freehand drawing
- **localStorage** — Zero-cost chat persistence
