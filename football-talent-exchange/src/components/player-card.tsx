import Link from "next/link";
import { Avatar, Badge } from "./ui";
import { ageOn } from "@/lib/domain/age";
import { footLabel, levelLabel, positionLabel } from "@/lib/domain/reference";
import { countryName } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";

export interface PlayerCardData {
  slug: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  photoUrl: string | null;
  country: string;
  mainPosition: string | null;
  foot: string | null;
  heightCm: number | null;
  currentLevel: string | null;
  contractStatus: string;
  featured?: boolean;
  /** Boost acheté : affiché « À la une » en tête des résultats. */
  boosted?: boolean;
  videoCount?: number;
  verifiedStats?: boolean;
}

export function PlayerCard({ p, m, locale, action }: { p: PlayerCardData; m: Messages; locale: Locale; action?: React.ReactNode }) {
  const name = `${p.firstName} ${p.lastName}`;
  return (
    <div className={`card flex gap-4 ${p.boosted ? "ring-2 ring-amber-400" : p.featured ? "ring-2 ring-amber-300" : ""}`}>
      <Avatar name={name} url={p.photoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/joueurs/${p.slug}`} className="truncate font-bold text-gray-900 hover:text-pitch-700">{name}</Link>
          {p.boosted && <Badge tone="gold">🚀 {m.search.boosted}</Badge>}
          {p.featured && <Badge tone="gold">{m.labels.premium}</Badge>}
          {p.contractStatus === "FREE" ? <Badge tone="green">{m.labels.free}</Badge> : <Badge>{m.labels.underContract}</Badge>}
          {p.verifiedStats && <Badge tone="blue">{m.labels.verifiedStats}</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-gray-700">
          {positionLabel(m, p.mainPosition)} · {m.common.years(ageOn(p.birthDate))}
          {p.foot ? ` · ${m.labels.footShort(footLabel(m, p.foot))}` : ""}
          {p.heightCm ? ` · ${p.heightCm} cm` : ""}
        </p>
        <p className="muted mt-0.5 truncate">
          {countryName(p.country, locale)} · {levelLabel(m, p.currentLevel)}
          {p.videoCount ? ` · ${m.labels.videoCount(p.videoCount)}` : ""}
        </p>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
