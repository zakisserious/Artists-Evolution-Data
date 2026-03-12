import httpx

BASE_URL = "https://api.deezer.com"

async def enrich_album_with_popularity(client: httpx.AsyncClient, artist_name: str, album: dict):
    # 1. Search album on Deezer
    search_url = f"{BASE_URL}/search/album"
    params = {"q": f"{artist_name} {album['name']}"}
    try:
        response = await client.get(search_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        albums_data = data.get("data", [])
        if not albums_data:
            album["avg_popularity"] = 0
            album["cover_url"] = None
            return album
            
        deezer_album = albums_data[0]
        deezer_album_id = deezer_album["id"]
        # Grab the album cover art
        album["cover_url"] = deezer_album.get("cover_big") or deezer_album.get("cover_medium") or deezer_album.get("cover")
        
        # 2. Get tracks for this album
        tracks_url = f"{BASE_URL}/album/{deezer_album_id}/tracks"
        tracks_response = await client.get(tracks_url)
        tracks_response.raise_for_status()
        tracks_data = tracks_response.json().get("data", [])
        
        if not tracks_data:
            album["avg_popularity"] = 0
            return album
            
        # Top 10 tracks by rank
        ranks = [t.get("rank", 0) for t in tracks_data]
        ranks.sort(reverse=True)
        top_10_ranks = ranks[:10]
        
        if top_10_ranks:
            album["avg_popularity"] = sum(top_10_ranks) / len(top_10_ranks)
        else:
            album["avg_popularity"] = 0
            
    except Exception as e:
        print(f"Error enriching album {album['name']}: {e}")
        album["avg_popularity"] = 0
        album["cover_url"] = None
        
    return album


async def get_artist_image(client: httpx.AsyncClient, artist_name: str):
    search_url = f"{BASE_URL}/search/artist"
    params = {"q": artist_name}
    try:
        response = await client.get(search_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        artists_data = data.get("data", [])
        if not artists_data:
            return None
            
        return artists_data[0].get("picture_medium")
    except Exception as e:
        print(f"Error fetching artist image for {artist_name}: {e}")
        return None
