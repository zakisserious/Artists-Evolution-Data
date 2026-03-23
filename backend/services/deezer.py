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
        
        if "error" in data or "album" not in data:
            album["avg_popularity"] = 0
            album["cover_url"] = None
            return album
            
        album_data = data["album"]
        
        # Parse Popularity using Last.fm Playcount
        playcount = int(album_data.get("playcount", 0))
        album["avg_popularity"] = playcount
        
        # Parse Cover Art
        images = album_data.get("image", [])
        cover_url = None
        for img in reversed(images):
            if img.get("#text"):
                cover_url = img.get("#text")
                break
                
        album["cover_url"] = cover_url
            
    except Exception as e:
        print(f"Error enriching album {album['name']}: {e}")
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
        
        if "error" in data or "artist" not in data:
            return None
            
        artist_data = data["artist"]
        images = artist_data.get("image", [])
        
        for img in reversed(images):
            if img.get("#text"):
                # Ensure we don't return the default grey star last.fm gives if no image exists
                url = img.get("#text")
                if "2a96cbd8b46e442fc41c2b86b821562f" not in url:
                    return url
                    
        return None
    except Exception as e:
        print(f"Error fetching artist image for {artist_name}: {e}")
        return None
