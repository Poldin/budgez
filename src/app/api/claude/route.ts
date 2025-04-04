import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Get API key from environment variables on the server
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API key not configured on the server' },
        { status: 500 }
      );
    }

    // Headers for Claude API
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };

    // Ensure the body has the required structure for Claude API
    // The client might send only the messages and system prompt,
    // so we need to structure the request properly
    const claudeRequestBody = {
      model: body.model || 'claude-3-sonnet-20240229',
      max_tokens: body.max_tokens || 4000,
      messages: body.messages || [],
      system: body.system || undefined,
      temperature: body.temperature || 0.7
    };

    // Forward the request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(claudeRequestBody)
    });

    // Get the response from Claude
    const data = await claudeResponse.json();

    // If Claude returned an error
    if (!claudeResponse.ok) {
      console.error('Claude API error:', data);
      return NextResponse.json(
        { error: data.error?.message || data.error || 'Error from Claude API' },
        { status: claudeResponse.status }
      );
    }

    // Return the Claude API response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Claude API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 