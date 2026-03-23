import httpx

LASTFM_API_KEY = "b25b959554ed76058ac220b7b2e0a026"
BASE_URL = "http://ws.audioscrobbler.com/2.0/"

async def enrich_album_with_popularity(client: httpx.AsyncClient, artist_name: str, album: dict):
    # Search album on Last.fm
    params = {
        "method": "album.getinfo",
        "api_key": LASTFM_API_KEY,
        "artist": artist_name,
        "album": album["name"],
        "format": "json"
    }
    
    try:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if not isinstance(data, dict) or "error" in data or "album" not in data:
            album["avg_popularity"] = 0
            album["cover_url"] = None
            return album
            
        album_data = data["album"]
        if not isinstance(album_data, dict):
            album["avg_popularity"] = 0
            album["cover_url"] = None
            return album
        
        # Parse Popularity using Last.fm Playcount with ultimate safety
        playcount_raw = album_data.get("playcount")
        try:
            playcount = int(float(playcount_raw)) if playcount_raw else 0
        except (ValueError, TypeError):
            playcount = 0
            
        album["avg_popularity"] = playcount
        
        # Parse Cover Art
        raw_images = album_data.get("image", [])
        if isinstance(raw_images, dict):
            images = [raw_images]
        elif isinstance(raw_images, list):
            images = raw_images
        else:
            images = []
            
        cover_url = None
        for img in reversed(images):
            if isinstance(img, dict) and img.get("#text"):
                cover_url = img.get("#text")
                break
                
        album["cover_url"] = cover_url
            
    except Exception as e:
        print(f"Error enriching album {album['name']}: {type(e).__name__} - {repr(e)}")
        album["avg_popularity"] = 0
        album["cover_url"] = None
        
    return album


async def get_artist_image(client: httpx.AsyncClient, artist_name: str):
    params = {
        "method": "artist.getinfo",
        "api_key": LASTFM_API_KEY,
        "artist": artist_name,
        "format": "json"
    }
    
    try:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if not isinstance(data, dict) or "error" in data or "artist" not in data:
            return None
            
        artist_data = data["artist"]
        if not isinstance(artist_data, dict):
            return None
            
        raw_images = artist_data.get("image", [])
        if isinstance(raw_images, dict):
            images = [raw_images]
        elif isinstance(raw_images, list):
            images = raw_images
        else:
            images = []
        
        for img in reversed(images):
            if isinstance(img, dict) and img.get("#text"):
                url = img.get("#text")
                if url and "2a96cbd8b46e442fc41c2b86b821562f" not in url:
                    return url
                    
        return None
    except Exception as e:
        print(f"Error fetching artist image for {artist_name}: {type(e).__name__} - {repr(e)}")
        return None
