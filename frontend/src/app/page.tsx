"use client";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import PopularityChart from "@/components/PopularityChart";
import AlbumCard from "@/components/AlbumCard";
import { Timeline } from "@/components/ui/timeline";
import { fetchArtistAnalysis, AnalysisResponse } from "@/lib/api";
import { Zap, TrendingUp, Share2, BarChart2, Linkedin, Mail } from "lucide-react";
import { StaggeredTitle } from "@/components/ui/animated-text";

const PHASE_CONFIG: Record<string, { color: string; bg: string }> = {
  "Growth": { color: "text-emerald-400", bg: "bg-emerald-500/10" },
  "Rising": { color: "text-emerald-400", bg: "bg-emerald-500/10" },
  "Peak/Stable": { color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  "Decline": { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisResponse | null>(null);

  const handleSearch = async (artistQuery: string, isId: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchArtistAnalysis(artistQuery, isId);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  const timelineData = data?.albums.map((album) => ({
    title: String(album.year),
    content: (
      <div className="mb-10 w-full flex justify-start">
        <AlbumCard album={album} />
      </div>
    )
  })) || [];

  const breakoutAlbumData = data?.breakout_album
    ? data.albums.find(a => a.name === data.breakout_album)
    : null;

  return (
    <main className="min-h-screen bg-[#0a0a0f] font-sans selection:bg-indigo-500/40 selection:text-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative z-50 flex flex-col items-center justify-center min-h-[52vh] px-6 pt-20 pb-24">
        {/* Subtle ambient glow — no purple, just depth */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-700/15 blur-[130px] -z-10" />

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">


          <StaggeredTitle line1="Artist" line2="Evolution" />

          <p className="text-base md:text-lg text-white/40 max-w-lg mx-auto">
            Discover an artist's breakout era, trace their popularity, and explore their discography timeline.
          </p>

          <div className="pt-4">
            <SearchBar onSearch={(query: string, isId?: boolean) => handleSearch(query, isId)} isLoading={isLoading} />
            {error && (
              <p className="mt-5 text-rose-400 text-sm font-medium bg-rose-500/10 border border-rose-500/20 py-2.5 px-4 rounded-xl inline-block">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── RESULTS ───────────────────────────────────────── */}
      {data && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-500">

          {/* Artist Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/8">
            <div className="flex items-center gap-4">
              {data.image_url ? (
                <img src={data.image_url} alt={data.artist} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{data.artist.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Results for</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{data.artist}</h2>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/60 hover:text-white text-sm font-medium"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>

          {/* Top Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Breakout Card */}
            {data.breakout_album ? (
              <div className="relative rounded-3xl overflow-hidden min-h-[280px] flex flex-col justify-end group">
                {/* Background: blurred album cover or dark gradient */}
                {breakoutAlbumData?.cover_url ? (
                  <>
                    <img
                      src={breakoutAlbumData.cover_url}
                      alt={data.breakout_album}
                      className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900" />
                )}

                {/* Artist portrait in the top-right corner */}
                {data.image_url && (
                  <div className="absolute top-5 right-5 z-20">
                    <img
                      src={data.image_url}
                      alt={data.artist}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                    />
                  </div>
                )}

                {/* Text content */}
                <div className="relative z-10 p-7">
                  <span className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-3">Breakout Era</span>
                  <p className="text-6xl font-black text-white tracking-tighter leading-none mb-2">{data.breakout_year}</p>
                  <p className="text-xl font-bold text-white/90">{data.breakout_album}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/8 bg-white/4 flex items-center justify-center min-h-[200px] p-8 text-center">
                <p className="text-white/40 font-medium">No distinct breakout era detected from the data.</p>
              </div>
            )}

            {/* Career Phases */}
            <div className="rounded-3xl border border-white/8 bg-white/4 p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Career Phases</h3>
              </div>
              <div className="space-y-2.5">
                {data.career_phases.map((phase, idx) => {
                  const cfg = PHASE_CONFIG[phase.phase] ?? { color: "text-white/60", bg: "bg-white/5" };
                  return (
                    <div key={idx} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                      <span className={`text-sm font-bold ${cfg.color}`}>{phase.phase}</span>
                      <span className="text-xs font-semibold text-white/40 bg-white/8 px-3 py-1 rounded-full">
                        {phase.start_year === phase.end_year ? phase.start_year : `${phase.start_year} – ${phase.end_year}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Popularity Chart */}
          <div className="rounded-3xl border border-white/8 bg-white/4 p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Popularity Over Time</h3>
              <span className="text-xs text-white/30 font-medium ml-auto">Deezer track rank proxy</span>
            </div>
            <PopularityChart data={data.albums} />
          </div>

          {/* Albums Timeline */}
          <div className="rounded-3xl border border-white/8 bg-white/4 overflow-hidden">
            <Timeline data={timelineData} />
          </div>

        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-20 border-t border-white/8 pt-12 text-center space-y-12">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-xl font-black text-white tracking-wider">WHY I BUILT THIS</h3>
          <p className="text-white text-sm leading-relaxed font-medium opacity-80">
            I built the Artist Evolution Analyzer to combine my love for music with modern web technologies.
            I thought it would be cool to create a tool that tracks an artist’s popularity over time and shows when they blew up.
            It was a fun way to explore music through data while experimenting with web development. If you have any questions or suggestions, let me know at my email, zakaria.m.omar@gmail.com
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a
            href="https://linkedin.com/in/zakaria-omar-21b0b729b/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white shadow-xl"
          >
            <Linkedin className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">LinkedIn</span>
          </a>

          <a
            href="mailto:zakaria.m.omar@gmail.com"
            className="flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white shadow-xl"
          >
            <Mail className="w-4 h-4" />
            <span className="text-sm font-black uppercase tracking-widest">Email Me</span>
          </a>
        </div>

        <div className="pt-8">
          <p className="text-sm text-white uppercase tracking-[0.5em] font-black opacity-90">
            Designed & Developed by Zakaria Omar
          </p>
        </div>
      </footer>
    </main>
  );
}
