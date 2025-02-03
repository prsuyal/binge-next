import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch('http://localhost:8000/api/py/tv/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}