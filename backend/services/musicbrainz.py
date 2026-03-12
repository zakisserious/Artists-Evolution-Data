import httpx
from datetime import datetime

# Required User-Agent by MusicBrainz
HEADERS = {
    "User-Agent": "ArtistEvolutionAnalyzer/1.0 (zakinator12345@gmail.com)"
}
BASE_URL = "https://musicbrainz.org/ws/2"

async def search_artist(client: httpx.AsyncClient, artist_query: str, by_id: bool = False):
    if by_id:
        url = f"{BASE_URL}/artist/{artist_query}"
        params = {"fmt": "json"}
        response = await client.get(url, params=params, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    else:
        url = f"{BASE_URL}/artist/"
        params = {"query": f"artist:{artist_query}", "fmt": "json"}
        response = await client.get(url, params=params, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        if not data.get("artists"):
            return None
        return data["artists"][0]

async def search_artists_list(client: httpx.AsyncClient, query: str):
    url = f"{BASE_URL}/artist/"
    params = {"query": query, "fmt": "json", "limit": 6}
    try:
        response = await client.get(url, params=params, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        artists = data.get("artists", [])
        results = []
        for a in artists:
            results.append({
                "id": a["id"],
                "name": a["name"],
                "disambiguation": a.get("disambiguation", ""),
                "country": a.get("country", "")
            })
        return results
    except Exception as e:
        print(f"Error fetching artists from MB: {e}")
        return []

async def fetch_albums(client: httpx.AsyncClient, artist_id: str):
    url = f"{BASE_URL}/release-group"
    params = {"artist": artist_id, "type": "album", "fmt": "json", "limit": 100}
    response = await client.get(url, params=params, headers=HEADERS)
    response.raise_for_status()
    data = response.json()

    release_groups = data.get("release-groups", [])
    albums = []

    # Strictly filter: must be primary type "Album" with NO secondary types
    # that indicate it's not a studio album (no Live, Compilation, Remix, etc.)
    for rg in release_groups:
        primary_type = rg.get("primary-type", "")
        secondary_types = rg.get("secondary-types", [])

        if primary_type != "Album":
            continue
        if any(st in secondary_types for st in ["Compilation", "Live", "Remix", "DJ-mix", "Mixtape/Street"]):
            continue

        if rg.get("first-release-date"):
            try:
                year = int(rg["first-release-date"][:4])
                albums.append({
                    "id": rg["id"],
                    "name": rg["title"],
                    "year": year,
                    "first_release_date": rg["first-release-date"]
                })
            except ValueError:
                continue

    # Sort chronologically
    albums.sort(key=lambda x: x["first_release_date"])

    # Dedup by name
    seen_names = set()
    unique_albums = []
    for album in albums:
        name_lower = album["name"].lower()
        if name_lower not in seen_names:
            seen_names.add(name_lower)
            unique_albums.append(album)

    # Limit to first 15 studio albums
    return unique_albums[:15]
