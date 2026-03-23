from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import httpx
import asyncio
import time

from services.musicbrainz import search_artist, fetch_albums
from services.deezer import enrich_album_with_popularity
from services.analysis import compute_analysis

app = FastAPI(title="Artist Evolution Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache
# Format: { "artist_name_lower": { "timestamp": float, "data": dict } }
cache = {}
CACHE_TTL = 3600  # 1 hour in seconds

@app.get("/analyze")
async def analyze_artist(artist: Optional[str] = None, artist_id: Optional[str] = None):
    if not artist and not artist_id:
        raise HTTPException(status_code=400, detail="Must provide artist name or artist_id")
        
    cache_key = artist_id if artist_id else (artist.lower().strip() if artist else "")
    
    # Check cache
    if cache_key in cache:
        cached_item = cache[cache_key]
        if time.time() - cached_item["timestamp"] < CACHE_TTL:
            return cached_item["data"]
            
    try:
        from services.deezer import get_artist_image
        browser_headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        async with httpx.AsyncClient(headers=browser_headers) as client:
            actual_artist_name = None
            
            # 1. Resolve artist name and ID
            if artist_id:
                # Always look up by ID to get the canonical name from MusicBrainz
                artist_data = await search_artist(client, artist_id, by_id=True)
                if not artist_data:
                    raise HTTPException(status_code=404, detail="Artist not found on MusicBrainz")
                actual_artist_name = artist_data.get("name", "Unknown Artist")
            else:
                artist_data = await search_artist(client, artist)
                if not artist_data:
                    raise HTTPException(status_code=404, detail="Artist not found on MusicBrainz")
                artist_id = artist_data["id"]
                actual_artist_name = artist_data["name"]
            
            # 2. Fetch albums and artist image concurrently
            albums_task = fetch_albums(client, artist_id)
            image_task = get_artist_image(client, actual_artist_name)
            albums, artist_image = await asyncio.gather(albums_task, image_task)

            if not albums:
                raise HTTPException(status_code=404, detail="No albums found for artist")
                
            # 3. Fetch Deezer popularity for each album concurrently
            tasks = [enrich_album_with_popularity(client, actual_artist_name, album) for album in albums]
            enriched_albums = await asyncio.gather(*tasks)
            
            # 4. Compute Growth Rate, Detect Breakout & Phases
            analysis_result = compute_analysis(enriched_albums)
            
            response_data = {
                "artist": actual_artist_name,
                "image_url": artist_image,
                **analysis_result
            }
            
            # Save to cache
            cache[cache_key] = {
                "timestamp": time.time(),
                "data": response_data
            }
            
            return response_data
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"External API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/search_artists")
async def search_artists_endpoint(q: str):
    if not q or len(q) < 2:
        return {"artists": []}
    
    try:
        browser_headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        async with httpx.AsyncClient(headers=browser_headers) as client:
            from services.musicbrainz import search_artists_list
            results = await search_artists_list(client, q)
            # Add artist images from deezer as an enrichment step
            from services.deezer import get_artist_image
            
            # Fetch images concurrently for the top results
            tasks = [get_artist_image(client, r["name"]) for r in results]
            images = await asyncio.gather(*tasks)
            
            for i, res in enumerate(results):
                res["image_url"] = images[i]
                
            return {"artists": results}
    except Exception as e:
        print(f"Search error: {e}")
        return {"artists": []}
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"External API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Artist Evolution Analyzer API. Use /analyze?artist={name}"}
