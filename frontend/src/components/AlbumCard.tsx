import { Album } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function AlbumCard({ album }: { album: Album }) {
  const isHighGrowth = album.growth_rate > 0.3;
  const isNegativeGrowth = album.growth_rate < -0.1;

  const phaseColors: Record<string, string> = {
    "Growth": "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    "Rising": "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    "Peak/Stable": "bg-purple-500/20 text-purple-600 dark:text-purple-400",
    "Decline": "bg-rose-500/20 text-rose-600 dark:text-rose-400",
  };
  const phaseClass = phaseColors[album.phase] ?? "bg-neutral-500/20 text-neutral-600 dark:text-neutral-400";

  return (
    <div className="group relative bg-[#111118] border border-white/8 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full max-w-sm flex flex-col">
      {/* Album Cover */}
      <div className="relative w-full aspect-square bg-white/5 overflow-hidden">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
            <span className="text-5xl font-black text-white/20">{album.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-xs font-bold uppercase tracking-wider">{album.year}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-base text-white leading-snug line-clamp-2">
            {album.name}
          </h4>
          <span className="text-sm font-black text-white/25 flex-shrink-0">{album.year}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${phaseClass}`}>
            {album.phase}
          </span>
          <div className="flex items-center gap-1">
            {isHighGrowth ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : isNegativeGrowth ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-white/30" />
            )}
            <span className={`text-xs font-bold ${isHighGrowth ? 'text-emerald-400' : isNegativeGrowth ? 'text-rose-400' : 'text-white/40'}`}>
              {album.growth_rate > 0 ? '+' : ''}{(album.growth_rate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
