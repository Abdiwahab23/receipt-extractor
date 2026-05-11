# ReceiptAI - Project Guide

This document provides a comprehensive overview of the **ReceiptAI** application. It details the technologies used, the architectural choices, and the specific functionality we implemented. Use this as your primary technical reference!

---

## 1. Tech Stack Overview
The project is built entirely as a **Client-Side Single Page Application (SPA)** using a lightweight, modern technology stack. It does not have a traditional backend server (like Node/Express or Python), but instead relies on BaaS (Backend-as-a-Service) for data storage and API integrations for intelligence.

### **Core Languages & UI**
*   **HTML5 (`index.html`)**: Provides the structural skeleton of the application (the drag-and-drop zone, form, modal layout).
*   **Vanilla CSS3 (`style.css`)**: Handles all styling. We explicitly *avoided* frameworks like Tailwind or Bootstrap. Instead, we used a custom "Glassmorphism" design system utilizing CSS variables (`--primary`, `--bg`), `backdrop-filter: blur()`, flexbox/grid for layouts, and media queries for responsiveness.
*   **Vanilla JavaScript (ES6+) (`main.js`, `ai-service.js`)**: Handles all the logic, DOM manipulation, state management, and API calls. We used modern syntax like `async/await`, arrow functions, destructuring, and ES Modules (`import`/`export`).

### **Tooling & Infrastructure**
*   **Vite**: The build tool and local development server. Vite is incredibly fast because it serves native ES modules during development and uses Rollup for bundling in production.
*   **Supabase**: An open-source Firebase alternative based on PostgreSQL. It acts as our database (`receipts` table) and provides a secure, instant REST API to fetch and save data.
*   **Google Gemini API**: Provides the core "AI" functionality. Specifically, we are using the `gemini-2.5-flash` multimodal model to process images and return structured JSON data.

### **Third-Party Libraries (via npm)**
*   `@google/generative-ai`: The official Google SDK to communicate with the Gemini API.
*   `@supabase/supabase-js`: The official SDK to securely query and mutate data in the Supabase PostgreSQL database.
*   `sweetalert2`: Used for beautiful, customized popups (alerts, confirmation dialogs, and the Edit Receipt modal form).
*   `xlsx`: A robust library used to convert our receipt JSON data into downloadable Excel (`.xlsx`) files right in the user's browser.

---

## 2. Architecture & Data Flow
Here is the step-by-step breakdown of how the application operates from end-to-end:

1.  **User Input**: The user drags and drops a receipt image (or clicks to select) into the drop zone in `index.html`.
2.  **File Processing**: `main.js` catches the file using the `FileReader` API to instantly show a preview image to the user.
3.  **AI Extraction (`ai-service.js`)**: 
    *   The file is converted into base64 data.
    *   It is sent to the **Gemini 2.5 Flash** model along with a strict system prompt instructing it to act as an OCR system.
    *   The prompt forces the AI to return exactly four fields in a structured JSON format: `merchant`, `date`, `total`, and `currency`.
4.  **User Review**: The returned JSON data automatically populates the HTML form inputs. The user reviews the AI's work and can manually correct any mistakes.
5.  **Database Storage (`supabase.js` / `main.js`)**: When the user clicks "Verify & Submit", the finalized data is sent directly from the browser to the Supabase database table named `receipts`.
6.  **Data Retrieval**: When "View all receipts" is clicked, the app sends a `SELECT *` query to Supabase (ordered by date), loops through the results, and dynamically injects HTML rows into the modal's table using JavaScript template literals.

---

## 3. Key Technical Implementations & Solutions

During development, several key technical approaches were taken to ensure a robust application:

*   **Prompt Engineering & JSON Parsing**: AI models can occasionally append conversational text (e.g., "Here is the data: \`\`\`json..."). We implemented logic to strip out markdown backticks inside `ai-service.js` to ensure `JSON.parse()` processes the Gemini API response reliably.
*   **Supabase Security & RLS**: The "View all receipts" functionality requires direct interaction with the PostgreSQL database. We had to account for Row Level Security (RLS) policies to ensure that the frontend app is permitted to `SELECT` and read the saved data.
*   **Schema Flexibility**: To ensure stability, our Javascript logic dynamically sorts by the guaranteed `date` field instead of relying on default timestamps, preventing crashes if the database schema ever lacks a `created_at` column.
*   **Responsive Tables & Modals**: Tables are notoriously hard to style on mobile. We implemented a custom horizontal scrollbar with `overflow-x: auto` and used `white-space: nowrap` on table cells to ensure data like dates and amounts remain legible and don't break onto multiple lines on small phone screens.
*   **Dynamic DOM Event Binding**: Because the receipt table rows are generated dynamically *after* the initial page load, we ensured the Edit, Delete, and Download buttons inside those rows attach their event listeners immediately after the table rendering cycle is completed.

---

## 4. Architectural Q&A

**Q: Did you use Node.js in this project, and why?**
> A: We used Node.js **only as a development tool**, not as a backend server. Node is required to run **npm** (to install our libraries like Supabase, Gemini, and SweetAlert2) and to run **Vite** (our fast local development server). Because this is a Client-Side Single Page Application (SPA), once we build the project for production, the final output is just static HTML, CSS, and JavaScript. The actual backend database is handled entirely by Supabase, meaning we don't need to host or maintain a live Node.js server.

**Q: Why was this built without a Javascript framework like React or Vue?**
> A: For a project of this scope, Vanilla JavaScript paired with Vite is highly efficient, resulting in a much smaller bundle size and zero dependency overhead. We handle state locally and manipulate the DOM directly. Upgrading to a framework like React would be the logical next step if the application expanded to include complex routing, deep state management, or multi-page dashboards.

**Q: How is security handled when connecting directly to the database from the front-end?**
> A: We use Supabase, which is designed for this exact pattern. We only expose the `anon` key in the frontend, keeping the master key hidden. Supabase relies on PostgreSQL's Row Level Security (RLS) to enforce rules. In a full production environment, this is paired with Supabase Auth so RLS policies restrict users to only view or edit their own authenticated rows.

**Q: How are AI hallucinations handled?**
> A: This is handled via strict prompt engineering—commanding the model to only return valid JSON. Additionally, the `JSON.parse()` and extraction logic are wrapped in a `try/catch` block. If the AI response is malformed, the error is caught, the user is alerted, and the submit button is re-enabled so the user can fallback to manual data entry without being blocked.
