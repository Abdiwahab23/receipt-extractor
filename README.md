# Receipt Extractor AI

A web application that automatically extracts key data from uploaded receipts (images or PDFs) using Google's Gemini AI and saves the structured data to a Supabase database.

## How to run it

### Running Locally
1. Clone the repository to your local machine.
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Live Version
This app is designed to be easily deployed to static hosting services like Vercel.

## AI Model Used
This application uses **Gemini 2.5 Flash** (`gemini-2.5-flash`). This model was chosen because it provides lightning-fast responses and has excellent multimodal capabilities for quickly and accurately reading both image and PDF documents.

## Prompt Used
When a user uploads a receipt, the image/PDF is passed to the AI along with the following strict system prompt to ensure consistent JSON formatting:

```text
Extract the following information from this receipt image or document:
- Merchant name
- Date (in YYYY-MM-DD format if possible)
- Total amount (as a number)
- Currency (3-letter ISO code if possible, e.g., USD, EUR, GBP)

Return the data strictly in JSON format with these keys: 
"merchant", "date", "total", "currency".
If a field cannot be found, use null.
Return ONLY the JSON object, no other text.
```
