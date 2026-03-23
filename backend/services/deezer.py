import httpx
import re

LASTFM_API_KEY = "b25b959554ed76058ac220b7b2e0a026"
BASE_URL = "http://ws.audioscrobbler.com/2.0/"

def normalize_title(title: str) -> str:
    # Strip everything except alphanumeric, convert to lowercase for fuzzy matching
    # E.g., "CALL ME IF YOU GET LOST: The Estate Sale" -> "callmeifyougetlosttheestatesale"
    return re.sub(r'[^a-zA-Z0-9]', '', title).lower()

async def get_artist_top_albums(client: httpx.AsyncClient, artist_name: str):
    """Fetches the top 50 albums from Last.fm in ONE single rapid API call"""
    params = {
        "method": "artist.gettopalbums",
        "api_key": LASTFM_API_KEY,
        "artist": artist_name,
        "format": "json",
        "limit": 100
    }
    
    try:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if not isinstance(data, dict) or "error" in data or "topalbums" not in data:
            return []
            
        album_list = data["topalbums"].get("album", [])
        if not isinstance(album_list, list):
            album_list = [album_list] if isinstance(album_list, dict) else []
            
        parsed_albums = []
        for alb in album_list:
            if not isinstance(alb, dict):
                continue
                
            name = alb.get("name", "")
            playcount_raw = alb.get("playcount", 0)
            try:
                playcount = int(float(playcount_raw)) if playcount_raw else 0
            except (ValueError, TypeError):
                playcount = 0
                
            # Extract Album Cover
            raw_images = alb.get("image", [])
            images = [raw_images] if isinstance(raw_images, dict) else (raw_images if isinstance(raw_images, list) else [])
            cover_url = None
            for img in reversed(images):
                if isinstance(img, dict) and img.get("#text"):
                    cover_url = img.get("#text")
                    break
                    
            parsed_albums.append({
                "name": name,
                "normalized_name": normalize_title(name),
                "playcount": playcount,
                "cover_url": cover_url
            })
            
        return parsed_albums
    except Exception as e:
        print(f"Error fetching top albums for {artist_name}: {type(e).__name__} - {repr(e)}")
        return []

async def get_itunes_artist_image(client: httpx.AsyncClient, artist_name: str):
    """Uses iTunes blazing fast unthrottled API to fetch high-res artist search images"""
    url = "https://itunes.apple.com/search"
    params = {
        "term": artist_name,
        "entity": "album",
        "limit": 1
    }
    try:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])
        if results:
            artwork = results[0].get("artworkUrl100")
            if artwork:
                return artwork.replace("100x100bb", "600x600bb")
        return None
    except Exception as e:
        print(f"Error fetching iTunes image for {artist_name}: {e}")
        return None
