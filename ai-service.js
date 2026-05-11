import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function extractReceiptData(imageFile) {
  console.log("Starting extraction process for:", imageFile.name);
  try {
    if (!API_KEY) {
      throw new Error("Gemini API Key is missing. Please check your .env file.");
    }

    // Convert image to base64
    console.log("Converting image to base64...");
    const imageData = await fileToGenerativePart(imageFile);
    console.log("Image conversion successful.");
    
    // Use gemini-2.5-flash for speed and accuracy
    console.log("Initializing Gemini model...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Model initialized:", model.model);

    const prompt = `
      Extract the following information from this receipt image or document:
      - Merchant name
      - Date (in YYYY-MM-DD format if possible)
      - Total amount (as a number)
      - Currency (3-letter ISO code if possible, e.g., USD, EUR, GBP)

      Return the data strictly in JSON format with these keys: 
      "merchant", "date", "total", "currency".
      If a field cannot be found, use null.
      Return ONLY the JSON object, no other text.
    `;

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();
    
    // Clean up response text in case it includes markdown code blocks
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error extracting receipt data:", error);
    throw error;
  }
}

async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
