import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PuzzleData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const puzzleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy mystery title" },
    story: { type: Type.STRING, description: "A short backstory setting the scene (max 2 sentences)" },
    theme: {
      type: Type.OBJECT,
      description: "Visual style configuration for the UI based on the puzzle theme.",
      properties: {
        colors: {
          type: Type.OBJECT,
          properties: {
            background: { type: Type.STRING, description: "Main page background color (hex or css gradient)" },
            surface: { type: Type.STRING, description: "Card/Board background color (hex). Must contrast with text." },
            border: { type: Type.STRING, description: "Border/Grid line color (hex)." },
            text: { type: Type.STRING, description: "Main text color (hex). Must have high contrast on surface." },
            accent: { type: Type.STRING, description: "Highlight/Button color (hex)." },
            primary: { type: Type.STRING, description: "Primary branding color (hex)." }
          },
          required: ["background", "surface", "border", "text", "accent", "primary"]
        },
        font: { type: Type.STRING, enum: ["serif", "sans", "mono"], description: "Font style that matches the vibe." },
        emoji: { type: Type.STRING, description: "A single representative emoji (e.g. 🕵️‍♀️, 🚀, 🏰, 🤠) for background patterns." }
      },
      required: ["colors", "font", "emoji"]
    },
    categories: {
      type: Type.ARRAY,
      description: "Exactly 3 categories. Each must have exactly 4 items.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 unique items"
          }
        },
        required: ["id", "name", "items"]
      }
    },
    clues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 6 logic clues. Puzzle MUST be solvable with ONLY these."
    },
    solution: {
      type: Type.ARRAY,
      description: "Solution logic.",
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          matches: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["item", "matches"]
      }
    }
  },
  required: ["title", "story", "theme", "categories", "clues", "solution"]
};

export const generatePuzzle = async (theme: string = "random"): Promise<PuzzleData> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `Create a logic grid puzzle with a '${theme}' theme. 
  
  DESIGN INSTRUCTIONS:
  You are also a UI Designer. Generate a 'theme' object with colors, fonts, and an emoji that perfectly matches the puzzle's vibe.
  - If 'Noir': Grayscale, serif, dark backgrounds.
  - If 'Sci-Fi': Dark blue/black, neon green/cyan accents, mono font.
  - If 'Fantasy': Parchment/Gold colors, serif font.
  - If 'Cyberpunk': Pink/Blue neon, black bg, sans font.
  
  LOGIC INSTRUCTIONS:
  The puzzle MUST have exactly 3 categories.
  Each category MUST have exactly 4 items.
  Provide exactly 6 clues.
  The puzzle MUST be 100% solvable using ONLY these 6 clues.
  
  The solution must be returned as a list of objects linking items.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: puzzleSchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const rawData = JSON.parse(text);
    
    // Transform solution
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
      solution: solutionMap,
      theme: rawData.theme
    };
    
    data.categories.forEach((cat, idx) => {
      if (!cat.id) cat.id = `cat_${idx}`;
    });

    return data;
  } catch (error) {
    console.error("Failed to generate puzzle:", error);
    // Fallback static puzzle with default theme
    return {
      title: "The Midnight Express (Offline)",
      story: "Three passengers ordered different drinks in different train cars. What a mystery!",
      theme: {
        colors: {
            background: "#fdf6e3",
            surface: "#f3e9dc",
            border: "#d6cbb6",
            text: "#2b2d42",
            accent: "#d90429",
            primary: "#2b2d42"
        },
        font: "serif",
        emoji: "🚂"
      },
      categories: [
        { id: "passengers", name: "Passengers", items: ["Col. Mustard", "Miss Scarlet", "Prof. Plum", "Mrs. Peacock"] },
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
        "Colonel Mustard": ["Martini", "Dining Car"], 
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