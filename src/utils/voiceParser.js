import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Parses natural language input into a structured transaction object using Gemini AI.
 * 
 * @param {string} text - The transcribed voice input.
 * @param {Array} accounts - List of user accounts for matching.
 * @param {Array} categories - List of user categories for matching.
 * @returns {Promise<Object|null>} - A structured transaction object or null if parsing fails.
 */
export async function parseVoiceTransaction(text, accounts, categories) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const accountNames = accounts.map(a => a.name).join(", ");
        const categoryNames = categories.join(", ");

        const prompt = `
            You are a transaction parser for an expense tracker app called "Balance".
            Convert the following natural language input into a JSON transaction object.

            Input: "${text}"

            Context:
            - Standard Accounts: ${accountNames}
            - Standard Categories: ${categoryNames}
            - Current Date: ${new Date().toISOString().split('T')[0]}

            JSON Format:
            {
                "type": "income" | "expense" | "transfer",
                "amount": number,
                "category": string (match from Standard Categories if possible, otherwise suggest a logical one),
                "accountId": string (MUST map to one of the Standard Accounts. Look for names like "Fi Money", "SBI", "Cash", etc. If the input mentions an account, find the best match),
                "accountName": string (The name of the matched Standard Account),
                "toAccountId": string (for transfers only),
                "toAccountName": string (for transfers only),
                "date": "YYYY-MM-DD",
                "notes": string (brief description of the item/purpose)
            }

            Rules:
            1. Only return the JSON object. No other text.
            2. If an account is mentioned but doesn't exist in Standard Accounts, pick the most logical one or leave accountId null.
            3. "Fi Money" often implies a bank account.
            4. If the amount is not clear, return null.

            Example: "I purchased a shirt from Zudio priced 399rs using my Fi Money UPI"
            Result: {
                "type": "expense",
                "amount": 399,
                "category": "Shopping",
                "accountName": "Fi Money",
                "notes": "Shirt from Zudio",
                "date": "${new Date().toISOString().split('T')[0]}"
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Extract JSON block if AI includes extra formatting
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);

        // Post-processing: Map accountName back to accountId
        if (parsed.accountName) {
            const acc = accounts.find(a => a.name.toLowerCase() === parsed.accountName.toLowerCase() || a.name.toLowerCase().includes(parsed.accountName.toLowerCase()));
            if (acc) parsed.accountId = acc.id;
        }

        if (parsed.toAccountName) {
            const acc = accounts.find(a => a.name.toLowerCase() === parsed.toAccountName.toLowerCase() || a.name.toLowerCase().includes(parsed.toAccountName.toLowerCase()));
            if (acc) parsed.toAccountId = acc.id;
        }

        return parsed;
    } catch (error) {
        console.error("Gemini Parsing Error:", error);
        return null;
    }
}
