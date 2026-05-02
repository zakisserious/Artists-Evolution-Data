import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.services.deezer import enrich_album_with_popularity
import httpx

async def run():
    async with httpx.AsyncClient() as c:
        try:
            album = {"name": "DINOSAUR"}
            res = await enrich_album_with_popularity(c, "Tyler, The Creator", album)
            print("Success:", res)
        except Exception as e:
            print("CAUGHT IN SCRIPT:", repr(e))

asyncio.run(run())
