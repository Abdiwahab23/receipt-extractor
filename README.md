# Receipt-to-Form Auto-Fill Web App

This application uses Google Gemini 2.5 Flash to extract information from receipt images and auto-fill a web form.

## Features
- **Modern UI**: Sleek, glassmorphic design with dark mode and smooth animations.
- **AI Extraction**: Powered by Gemini 2.5 Flash for high-accuracy OCR.
- **Real-time Feedback**: Visual scanning animation while processing.
- **Editable Form**: Users can review and edit extracted data before submission.
- **Local Persistence**: Submissions are saved to the browser's local storage.

## Project Structure
- `index.html`: Main application structure.
- `style.css`: Custom CSS with glassmorphism and animations.
- `main.js`: UI logic and file handling.
- `ai-service.js`: Integration with Google Generative AI SDK.
- `.env`: Environment variables (API Key).

## How to Run
1. Ensure you have the Gemini API key in your `.env` file.
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open the provided URL (usually http://localhost:5173).
4. Drag and drop a receipt image or click to upload.
5. Review the extracted data and click "Verify & Submit".
