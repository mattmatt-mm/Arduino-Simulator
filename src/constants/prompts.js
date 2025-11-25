export const CODE_MODIFICATION_PROMPT = `You are an Arduino code assistant. Modify the following Arduino code based on the user's request.

Current Code:
\`\`\`cpp
{code}
\`\`\`

User Request: {prompt}

Instructions:
- Modify the code to fulfill the user's request
- Keep existing functionality unless asked to change it
- Return ONLY the complete modified Arduino code
- Do NOT include explanations, markdown formatting, or code block markers
- The code must be ready to compile

Return the modified code now:`;

export const COMPONENT_EXTRACTION_PROMPT = `Analyze this electronic component {sourceType} and extract the following information in JSON format:
{
  "name": "Component name",
  "color": "Hex color code for the component (e.g., #4B5563)",
  "pins": [
    {
      "id": "Pin identifier (e.g., VCC, GND, D1)",
      "label": "Pin label to display",
      "position": "bottom|top|left|right"
    }
  ]
}

Rules:
- Extract all pin names and their functions
- VISUAL POSITIONING IS CRITICAL: Look at the image/schematic to determine where pins are physically located.
    - If pins are in two rows on the sides (like DIP packages, DevKits, ESP32, Arduino Nano), assign them to 'left' and 'right'.
    - If pins are a single header (like Servo, Sensors), assign them to 'bottom' or 'top'.
    - Do NOT default to 'bottom' unless it's a single-row connector at the bottom.
- Choose a color that represents the component type
- Be precise with pin identifiers
- Return ONLY the JSON object, no additional text.`;

export const URL_ANALYSIS_PROMPT = `Analyze this webpage content from {url} and extract component pinout information:

{content}

Extract the following information in JSON format:
{
  "name": "Component name",
  "color": "Hex color code for the component (e.g., #4B5563)",
  "pins": [
    {
      "id": "Pin identifier (e.g., VCC, GND, GPIO0)",
      "label": "Pin label to display",
      "position": "bottom|top|left|right"
    }
  ]
}

Rules:
- Extract all pin names and their functions from the content
- VISUAL POSITIONING IS CRITICAL: Infer the physical location of pins from the description or standard form factors.
    - Dual-inline/Breadboard-friendly boards (Nano, ESP32): Use 'left' and 'right'.
    - Modules/Sensors: Usually 'bottom' or 'left'.
- Choose a color that represents the component type
- Be precise with pin identifiers
- If you cannot find clear pin information, return a JSON with "name": "No Data" and one pin explaining why

Return ONLY the JSON object, no additional text or explanations.`;
