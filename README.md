# Canvas Builder API with PDF Export

## Assignment Overview

**Objective:**
Develop a full-stack application with a Node.js backend and a modern frontend interface. The backend provides a Canvas-based API for drawing and exporting, while the frontend allows users to interactively build and export their designs as high-quality PDFs.

---

## Features

- **Backend (Node.js + Express):**
  - Initialize a drawable canvas with custom dimensions
  - Add rectangles, circles, text, and images (via URL or upload) to the canvas
  - Export the final canvas as a high-quality, optimized PDF (using `pdfkit` and `canvas`)
  - Basic PDF compression/optimization

- **Frontend (HTML, CSS, JavaScript):**
  - User interface to set canvas size, add elements, and preview the canvas
  - Trigger PDF export and download
  - Responsive and user-friendly design

---

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Canvas Manipulation:** [canvas](https://www.npmjs.com/package/canvas) (Node.js)
- **PDF Export:** [pdfkit](https://www.npmjs.com/package/pdfkit)

---

## API Endpoints

- `POST /api/canvas/init` — Initialize a new canvas
- `POST /api/canvas/add-rectangle` — Add a rectangle
- `POST /api/canvas/add-circle` — Add a circle
- `POST /api/canvas/add-text` — Add text
- `POST /api/canvas/add-image` — Add an image (file upload or URL)
- `GET /api/canvas/preview/:id` — Get a preview image of the canvas
- `POST /api/canvas/export-pdf` — Export the canvas as a PDF

---

## Getting Started (Local Development)

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd canvas-builder
   ```
2. **Install dependencies:**
   ```sh
   npm install
   cd backend && npm install
   ```
3. **Start the backend:**
   ```sh
   cd backend
   npm start
   ```
4. **Start the frontend:**
   - Open `frontend/index.html` with Live Server, or
   - Serve with [live-server](https://www.npmjs.com/package/live-server):
     ```sh
     npx live-server frontend --port=3000
     ```
5. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

---


## Project Requirements

- **Frontend:** HTML, CSS, JavaScript (or React for more interactivity)
- **Backend:** Node.js, Express
- **Canvas Manipulation:** Node.js `canvas` library
- **PDF Export:** `pdfkit` or similar
- **PDF Optimization:** Basic compression implemented

---

## Deliverables
- Full project code (GitHub)
- Hosted demo (Vercel or Surge + backend hosting)
- Well-documented README (this file)

---

## License
MIT

---

## Author
Your Name
