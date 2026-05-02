from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import httpx
import time

from services.musicbrainz import search_artist, fetch_albums, search_artists_list
from services.deezer import get_artist_top_albums, normalize_title, get_itunes_artist_image
from services.analysis import compute_analysis

app = FastAPI()

@app.get("/ping")
def ping():
    return {"status": "ok", "message": "pong"}

# Enable CORS for all origins (or specify your frontend URL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache to prevent spamming APIs (Key: artist name, Value: (timestamp, data))
cache = {}
CACHE_TTL = 3600  # 1 hour

@app.get("/analyze")
async def analyze_artist(artist: str = Query(None), artist_id: str = Query(None)):
    if not artist and not artist_id:
        raise HTTPException(status_code=400, detail="Must provide either 'artist' or 'artist_id'")
        
    cache_key = f"{artist_id or artist}"
    
    if cache_key in cache:
        cached_data = cache[cache_key]
        if time.time() - cached_data["timestamp"] < CACHE_TTL:
            return cached_data["data"]

    try:
        browser_headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        async with httpx.AsyncClient(headers=browser_headers, timeout=15.0) as client:
            actual_artist_name = None
            
            # 1. Resolve artist name and ID
            if not artist_id:
                artist_search_data = await search_artist(client, artist)
                if not artist_search_data:
                    raise HTTPException(status_code=404, detail="Artist not found on MusicBrainz")
                artist_id = artist_search_data["id"]
                
            artist_data = await search_artist(client, artist_id, by_id=True)
            if not artist_data:
                raise HTTPException(status_code=404, detail="Artist not found on MusicBrainz")
                
            actual_artist_name = artist_data.get("name", "Unknown Artist")
            
            # Use identical iTunes image fallback as search bar per user mandate
            artist_image = await get_itunes_artist_image(client, actual_artist_name)
            
            # 2. Fetch albums 
            albums = await fetch_albums(client, artist_id)

            if not albums:
                raise HTTPException(status_code=404, detail="No albums found for artist")
                
            # 3. Bulk fetch Last.fm popularity using O(1) matching strategy
            top_albums_data = await get_artist_top_albums(client, actual_artist_name)
            
            # Create speedy lookup map
            lastfm_map = {alb["normalized_name"]: alb for alb in top_albums_data}
            
            current_year = 2026
            for album in albums:
                norm_mb_name = normalize_title(album["name"])
                
                # Direct fuzzy match
                matched_lf_album = lastfm_map.get(norm_mb_name)
                
                # Substring fallback if platforms tag editions differently
                if not matched_lf_album:
                    for lf_norm_name, lf_data in lastfm_map.items():
                        if len(norm_mb_name) > 3 and (norm_mb_name in lf_norm_name or lf_norm_name in norm_mb_name):
                            matched_lf_album = lf_data
                            break
                            
                if matched_lf_album:
                    raw_playcount = matched_lf_album["playcount"]
                    album["cover_url"] = matched_lf_album["cover_url"]
                else:
                    raw_playcount = 0
                    album["cover_url"] = None
                    
                # Calculate Stream Velocity (Plays per Year) to neutralize cumulative bias of older albums
                release_year = album.get("year", current_year)
                age_in_years = max(1, current_year - release_year)
                album["velocity"] = raw_playcount / age_in_years
            
            # Normalize Velocity to a clean 0-100 Hype Index (avg_popularity)
            max_velocity = max((a.get("velocity", 0) for a in albums), default=0)
            if max_velocity > 0:
                for a in albums:
                    a["avg_popularity"] = int((a.get("velocity", 0) / max_velocity) * 100)
            else:
                for a in albums:
                    a["avg_popularity"] = 0
                    
            # 4. Compute Growth Rate, Detect Breakout & Phases
            analysis_result = compute_analysis(albums)
            
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
            results = await search_artists_list(client, q)
            
            # Add pristine fast artist images using iTunes API search
            tasks = [get_itunes_artist_image(client, r["name"]) for r in results]
            images = await asyncio.gather(*tasks)
            
            for i, res in enumerate(results):
                res["image_url"] = images[i]
                
            return {"artists": results}
    except Exception as e:
        print(f"Search error: {e}")
        return {"artists": []}
