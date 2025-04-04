// These types should match the structure expected by the budget component
export interface BudgetResource {
  id: string;
  name: string;
  type: "hourly" | "fixed" | "quantity";
  rate: number;
}

export interface BudgetActivity {
  id: string;
  name: string;
  resourceAllocations: { [key: string]: number };
}

export interface BudgetSection {
  id: string;
  name: string;
  activities: BudgetActivity[];
  resources: BudgetResource[];
}

export interface BudgetData {
  section: BudgetSection[];
  commercial_margin: number;
  margin_type: "fixed" | "percentage";
  discount: number;
  discount_type: "fixed" | "percentage";
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Claude API interfaces
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContent[];
}

interface ClaudeContent {
  type: 'text';
  text: string;
}

interface ClaudeRequest {
  model: string;
  messages: ClaudeMessage[];
  system?: string;
  temperature?: number;
  max_tokens?: number;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: ClaudeContent[];
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Real Claude API service
class AIService {
  private static instance: AIService;
  private baseUrl: string = '/api/claude'; // Updated to use our API route
  private model: string = 'claude-3-7-sonnet-20250219'; // Updated to the latest model
  
  private systemPromptForBudgetGeneration: string = `
You are a specialized AI assistant that helps create budget structures for projects. 
Your task is to analyze the user's project description and generate a structured JSON object that represents the budget.

For the budget, you need to identify:
1. Sections of work (e.g., Development, Design, Marketing)
2. Resources needed for each section (people, materials, services) with their types and rates
3. Activities within each section
4. Resource allocations for each activity

Follow these guidelines:
- Generate a valid JSON structure that matches exactly the expected format
- Assign unique IDs to each element (using UUID v4 format)
- Be realistic with estimations of rates and allocations
- Consider standard industry practices for project budgeting
- Include appropriate commercial margin (typically 10-20%)

Your response should ONLY contain the JSON object within a JSON code block. Do not include any explanations, introductions, or extra text in your response.

The expected output format is:
json
{
  "section": [
    {
      "id": "unique-uuid",
      "name": "Section Name",
      "activities": [
        {
          "id": "unique-uuid",
          "name": "Activity Name",
          "resourceAllocations": {
            "resource-id-1": number,
            "resource-id-2": number
          }
        }
      ],
      "resources": [
        {
          "id": "resource-id-1",
          "name": "Resource Name",
          "type": "hourly|fixed|quantity",
          "rate": number
        }
      ]
    }
  ],
  "commercial_margin": number,
  "margin_type": "fixed|percentage",
  "discount": number,
  "discount_type": "fixed|percentage"
}

`;

  private systemPromptForBudgetModification: string = `
You are a specialized AI assistant that helps modify project budget structures.
Your task is to understand the user's request to modify an existing budget and apply those changes to the provided JSON structure.

For budget modifications, you need to:
1. Carefully analyze the user's request
2. Identify what specific changes they want (add/remove/modify sections, resources, activities, rates, etc.)
3. Apply these changes to the existing budget structure while preserving the overall structure
4. Generate a new valid JSON with the applied changes
5. Provide a brief, concise explanation of what changes you made

IMPORTANT RULES:
- Your output MUST be strictly formatted as a JSON object with two properties: "updatedBudget" and "responseMessage"
- The "updatedBudget" property MUST contain the COMPLETE budget data structure with ALL fields 
- ALWAYS include ALL original fields in the updatedBudget even if they're unchanged (section, commercial_margin, margin_type, discount, discount_type)
- NEVER forget to include any property from the original budget in the updatedBudget
- Maintain all existing IDs for unchanged elements
- Generate new UUIDs for any new elements (using UUID v4 format)
- Ensure all references remain valid (e.g., resourceAllocations references existing resource IDs)

Your response MUST be a valid JSON object in this exact format:
\`\`\`json
{
  "updatedBudget": {
    "section": [ 
      // complete section array with all sections
    ],
    "commercial_margin": number,
    "margin_type": "fixed|percentage",
    "discount": number,
    "discount_type": "fixed|percentage"
  },
  "responseMessage": "Brief description of changes made"
}
\`\`\`
`;
  
  // Private constructor for singleton pattern
  private constructor() {
    // No need to store API key locally anymore, it's managed by the server
  }
  
  // Singleton pattern
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Helper method to call Claude API via our proxy
  private async callClaudeAPI(
    messages: ClaudeMessage[], 
    systemPrompt: string
  ): Promise<ClaudeResponse> {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Structure the request according to Claude API specifications
    const body: ClaudeRequest = {
      model: this.model,
      messages: messages,
      system: systemPrompt,
      temperature: 0.7,
      max_tokens: 4000
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${response.status} ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  // Extract JSON from Claude's response
  private extractJsonFromResponse<T>(response: ClaudeResponse): T {
    try {
      // Get the full text from the response
      const fullText = response.content
        .filter(c => c.type === 'text')
        .map(c => (c as ClaudeContent).text)
        .join('');
      
      // Extract JSON from code blocks
      const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim()) as T;
        } catch (parseError) {
          console.error('Error parsing JSON from code block:', parseError);
          console.log('Raw JSON content:', jsonMatch[1]);
          throw parseError;
        }
      }
      
      // If no code block, try to parse the entire response as JSON
      try {
        return JSON.parse(fullText.trim()) as T;
      } catch (parseError) {
        console.error('Error parsing full text as JSON:', parseError);
        console.log('Raw response content:', fullText);
        throw parseError;
      }
    } catch (error) {
      console.error('Error extracting JSON from Claude response:', error);
      throw new Error('Failed to parse JSON from Claude response');
    }
  }

  // Generate budget from prompt using Claude API
  async generateBudget(prompt: string): Promise<{ budget: BudgetData; message: string }> {
    try {
      // Call Claude API with the user's prompt
      const messages: ClaudeMessage[] = [
        {
          role: 'user',
          content: `Create a budget structure for the following project: ${prompt}`
        }
      ];
      
      const claudeResponse = await this.callClaudeAPI(
        messages, 
        this.systemPromptForBudgetGeneration
      );
      
      // Extract the budget JSON from Claude's response
      const budget = this.extractJsonFromResponse<BudgetData>(claudeResponse);
      
      // Generate a description message
      const descriptionMessages: ClaudeMessage[] = [
        {
          role: 'user',
          content: `
I have the following budget structure:
\`\`\`json
${JSON.stringify(budget, null, 2)}
\`\`\`

Describe this budget in a concise paragraph, highlighting the main sections, key resources, 
and explaining how the structure would help the project. Let the user know they can refine 
this structure by sending messages with specific modification requests.
`
        }
      ];
      
      const descriptionResponse = await this.callClaudeAPI(
        descriptionMessages,
        "You are a helpful assistant that explains budget structures in clear, concise language."
      );
      
      // Extract just the text content from the response
      const message = descriptionResponse.content
        .filter(c => c.type === 'text')
        .map(c => (c as ClaudeContent).text)
        .join('')
        .trim();
      
      return { budget, message };
    } catch (error) {
      console.error('Error generating budget with Claude:', error);
      throw new Error('Failed to generate budget');
    }
  }

  // Modify existing budget based on a user message using Claude API
  async modifyBudget(
    message: string, 
    currentBudget: BudgetData
  ): Promise<{ updatedBudget: BudgetData; responseMessage: string }> {
    try {
      // Call Claude API with the user's modification request and current budget
      const messages: ClaudeMessage[] = [
        {
          role: 'user',
          content: `
Current budget structure:
\`\`\`json
${JSON.stringify(currentBudget, null, 2)}
\`\`\`

Modification request: ${message}

Important: Apply this modification to the budget and return ONLY a valid JSON object with the following structure:
\`\`\`json
{
  "updatedBudget": {
    // The complete modified budget structure with ALL fields
  },
  "responseMessage": "Brief description of changes made"
}
\`\`\`
Do not include any extra text, only the JSON response.
`
        }
      ];
      
      const claudeResponse = await this.callClaudeAPI(
        messages,
        this.systemPromptForBudgetModification
      );
      
      // Extract the response JSON
      interface ModifyBudgetResponse {
        updatedBudget: BudgetData;
        responseMessage: string;
      }
      const result = this.extractJsonFromResponse<ModifyBudgetResponse>(claudeResponse);
      
      // Log the result for debugging
      console.log("Extracted result:", JSON.stringify(result, null, 2));
      
      // Check if we have a valid updatedBudget property
      if (!result.updatedBudget) {
        console.error("Missing updatedBudget in Claude response:", result);
        throw new Error("Invalid response format from Claude: missing updatedBudget property");
      }
      
      // Verify the updatedBudget has the expected structure
      if (!result.updatedBudget.section || !Array.isArray(result.updatedBudget.section)) {
        console.error("Invalid section structure in updatedBudget:", result.updatedBudget);
        throw new Error("Invalid budget structure in Claude response");
      }
      
      return {
        updatedBudget: result.updatedBudget,
        responseMessage: result.responseMessage || "Budget updated based on your request."
      };
    } catch (error) {
      console.error('Error modifying budget with Claude:', error);
      throw new Error(`Failed to modify budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default AIService.getInstance(); 