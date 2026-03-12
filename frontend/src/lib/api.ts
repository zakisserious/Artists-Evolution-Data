const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Album {
  name: string;
  year: number;
  avg_popularity: number;
  growth_rate: number;
  phase: string;
  cover_url: string | null;
}

export interface CareerPhase {
  phase: string;
  start_year: number;
  end_year: number;
}

export interface AnalysisResponse {
  artist: string;
  image_url: string | null;
  albums: Album[];
  breakout_album: string | null;
  breakout_year: number | null;
  career_phases: CareerPhase[];
}

export async function fetchArtistAnalysis(artistQuery: string, isId: boolean = false): Promise<AnalysisResponse> {
  const urlParams = new URLSearchParams();
  if (isId) {
    urlParams.append("artist_id", artistQuery);
    urlParams.append("artist", "Unknown");
  } else {
    urlParams.append("artist", artistQuery);
  }

  const response = await fetch(`${API_BASE_URL}/analyze?${urlParams.toString()}`);

  if (!response.ok) {
    let errorMessage = "Failed to fetch artist analysis";
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch (e) {
      // JSON parse failed, stick to default
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export interface ArtistSuggestion {
  id: string;
  name: string;
  disambiguation?: string;
  country?: string;
  image_url?: string;
}

export async function fetchArtistSuggestions(query: string): Promise<ArtistSuggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/search_artists?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.artists || [];
  } catch (e) {
    return [];
  }
}
