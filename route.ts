import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, model = "llama3:latest" } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log(`Using model: ${model}`)
    console.log(`User message: ${message}`)

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: message,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ollama API error:", errorText)
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Ollama response received")

    return NextResponse.json({
      response: data.response || "No response received from the model",
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process your request. Make sure Ollama is running and the model is available.",
      },
      { status: 500 },
    )
  }
}