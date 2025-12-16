import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PuzzleData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const puzzleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy vintage mystery title" },
    story: { type: Type.STRING, description: "A short backstory setting the scene (max 2 sentences)" },
    categories: {
      type: Type.ARRAY,
      description: "Exactly 3 categories involved in the puzzle (e.g. Suspects, Weapons, Rooms). Each category must have exactly 4 items.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 unique items in this category"
          }
        },
        required: ["id", "name", "items"]
      }
    },
    clues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of exactly 6 logic clues. The puzzle MUST be 100% solvable using ONLY these 6 clues. Ensure no ambiguity."
    },
    solution: {
      type: Type.ARRAY,
      description: "A list of solution entries, representing the solved grid connections.",
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "The item name (e.g. Alice)" },
          matches: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of items that this item is paired with (e.g. ['Red', 'London'])"
          }
        },
        required: ["item", "matches"]
      }
    }
  },
  required: ["title", "story", "categories", "clues", "solution"]
};

export const generatePuzzle = async (theme: string = "random"): Promise<PuzzleData> => {
  // Using Pro model for better logical consistency in puzzle generation
  const model = "gemini-3-pro-preview";
  
  const prompt = `Create a logic grid puzzle with a '${theme}' theme. 
  The puzzle MUST have exactly 3 categories.
  Each category MUST have exactly 4 items.
  
  Provide exactly 6 clues.
  CRITICAL: The puzzle MUST be 100% solvable using ONLY these 6 clues.
  Use a mix of positive ("A is B") and negative ("A is not C") clues.
  Avoid circular logic or insufficient information.
  
  The solution must be returned as a list of objects, where each object contains an 'item' and a list of its 'matches'.
  For example, if Category 1 has 'A', Cat 2 has 'B', Cat 3 has 'C', and they are linked:
  [
    { "item": "A", "matches": ["B", "C"] },
    { "item": "B", "matches": ["A", "C"] },
    { "item": "C", "matches": ["A", "B"] }
  ]
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: puzzleSchema,
        temperature: 0.7, // Slightly lower temperature for more rigorous logic
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const rawData = JSON.parse(text);
    
    // Transform solution array to Record<string, string[]> for the app
    const solutionMap: Record<string, string[]> = {};
    if (Array.isArray(rawData.solution)) {
      rawData.solution.forEach((entry: { item: string, matches: string[] }) => {
        solutionMap[entry.item] = entry.matches;
      });
    }

    const data: PuzzleData = {
      title: rawData.title,
      story: rawData.story,
      categories: rawData.categories,
      clues: rawData.clues,
      solution: solutionMap
    };
    
    // Post-processing to ensure stability
    data.categories.forEach((cat, idx) => {
      if (!cat.id) cat.id = `cat_${idx}`;
    });

    return data;
  } catch (error) {
    console.error("Failed to generate puzzle:", error);
    // Fallback static puzzle
    return {
      title: "The Midnight Express (Offline)",
      story: "Three passengers ordered different drinks in different train cars. What a mystery!",
      categories: [
        { id: "passengers", name: "Passengers", items: ["Colonel Mustard", "Miss Scarlet", "Prof. Plum", "Mrs. Peacock"] },
        { id: "drinks", name: "Drinks", items: ["Martini", "Whisky", "Cognac", "Sherry"] },
        { id: "cars", name: "Cars", items: ["Dining Car", "Lounge", "Sleeper", "Observation"] }
      ],
      clues: [
        "Colonel Mustard was seen in the Dining Car.",
        "The Whisky drinker was not Miss Scarlet.",
        "Prof. Plum drank Cognac.",
        "The Sherry was served in the Lounge.",
        "Mrs. Peacock was not in the Sleeper.",
        "The person in the Observation car didn't drink Martini."
      ],
      solution: {
        "Colonel Mustard": ["Martini", "Dining Car"], // Example fix for mock
        "Miss Scarlet": ["Sherry", "Lounge"],
        "Prof. Plum": ["Cognac", "Sleeper"],
        "Mrs. Peacock": ["Whisky", "Observation"],
        "Martini": ["Colonel Mustard", "Dining Car"],
        "Whisky": ["Mrs. Peacock", "Observation"],
        "Cognac": ["Prof. Plum", "Sleeper"],
        "Sherry": ["Miss Scarlet", "Lounge"],
        "Dining Car": ["Colonel Mustard", "Martini"],
        "Lounge": ["Miss Scarlet", "Sherry"],
        "Sleeper": ["Prof. Plum", "Cognac"],
        "Observation": ["Mrs. Peacock", "Whisky"]
      }
    };
  }
};