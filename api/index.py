from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from openai import OpenAI
from tvdb_v4_official import TVDB
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
tvdb = TVDB(apikey=os.getenv("TVDB_API_KEY"))

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

class ShowRequest(BaseModel):
    description: str

@app.post("/api/py/tv/search")
async def search_shows(request: ShowRequest):
    try:
        recommendations = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You're a TV show expert. List 5 specific shows similar to what they're looking for. Return ONLY the show titles without any numbers or dashes. One show per line.",
                },
                {"role": "user", "content": request.description},
            ],
            temperature=0.7,
        )

        show_names = [
            name.strip("- 1234567890.\"'")
            for name in recommendations.choices[0].message.content.split("\n")
            if name.strip()
        ]
        print(f"GPT recommended shows: {show_names}")

        detailed_results = []

        for show_name in show_names:
            try:
                results = tvdb.search(show_name, type="series")
                if not results:
                    print(f"No results found for: {show_name}")
                    continue

                show_id = results[0].get("id")
                if isinstance(show_id, str) and "series-" in show_id:
                    show_id = show_id.replace("series-", "")

                print(f"Getting details for: {show_name} (ID: {show_id})")
                details = tvdb.get_series(show_id)

                prev_shows_context = ""
                if detailed_results:
                    prev_shows = "\n".join(
                        [
                            f"- {show['name']}: {show['casual_description'][:200]}..."
                            for show in detailed_results
                        ]
                    )
                    prev_shows_context = f"Previously recommended shows:\n{prev_shows}"

                casual_description = (
                    client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {
                                "role": "system",
                                "content": (
                                    "You're having a casual conversation about TV shows. When describing each show:\n"
                                    "- Reference similarities or differences to previously mentioned shows if any\n"
                                    "- Keep the conversation flowing naturally\n"
                                    "- Make connections between recommendations\n"
                                    "- Use casual, friendly language but do not add too much fluff; stay direct\n"
                                    "- Stay focused on why this specific show matches their request"
                                ),
                            },
                            {
                                "role": "user",
                                "content": (
                                    f"They asked for: {request.description}\n\n"
                                    f"{prev_shows_context}\n\n"
                                    f"Now telling them about:\n"
                                    f"Title: {details.get('name')}\n"
                                    f"Overview: {details.get('overview')}\n"
                                    f"Network: {details.get('network')}\n"
                                    f"First Aired: {details.get('firstAired')}"
                                ),
                            },
                        ],
                        temperature=0.7,
                    )
                    .choices[0]
                    .message.content
                )

                detailed_results.append(
                    {
                        "id": show_id,
                        "name": details.get("name"),
                        "original_description": details.get("overview"),
                        "casual_description": casual_description,
                        "first_aired": details.get("firstAired"),
                        "network": details.get("network"),
                        "rating": details.get("rating"),
                        "image": details.get("image"),
                    }
                )
                print(f"Successfully processed: {show_name}")

            except Exception as e:
                print(f"Error processing {show_name}: {str(e)}")
                continue

        if not detailed_results:
            fallback_message = (
                client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "system",
                            "content": "You're a friendly TV expert. Write a helpful message suggesting these specific shows and why they match what they're looking for.",
                        },
                        {
                            "role": "user",
                            "content": f"Request: {request.description}\nShows to recommend: {', '.join(show_names)}",
                        },
                    ],
                    temperature=0.7,
                )
                .choices[0]
                .message.content
            )
            return {"results": [], "message": fallback_message}

        return {"results": detailed_results}

    except Exception as e:
        print(f"Main error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))