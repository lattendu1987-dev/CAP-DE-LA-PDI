import Link from "next/link";
import { Avatar, Badge } from "./ui";
import { ageOn } from "@/lib/domain/age";
import { countryName, FOOT_LABELS, levelLabel, positionLabel } from "@/lib/domain/reference";

export interface PlayerCardData {
  slug: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  photoUrl: string | null;
  country: string;
  nationalities: string[];
  mainPosition: string | null;
  foot: string | null;
  heightCm: number | null;
  currentLevel: string | null;
  contractStatus: string;
  featured?: boolean;
  videoCount?: number;
  verifiedStats?: boolean;
}

export function PlayerCard({ p, action }: { p: PlayerCardData; action?: React.ReactNode }) {
  const name = `${p.firstName} ${p.lastName}`;
  return (
    <div className={`card flex gap-4 ${p.featured ? "ring-2 ring-amber-300" : ""}`}>
      <Avatar name={name} url={p.photoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/joueurs/${p.slug}`} className="truncate font-bold text-gray-900 hover:text-pitch-700">{name}</Link>
          {p.featured && <Badge tone="gold">★ Premium</Badge>}
          {p.contractStatus === "FREE" ? <Badge tone="green">Libre</Badge> : <Badge>Sous contrat</Badge>}
          {p.verifiedStats && <Badge tone="blue">✓ Stats vérifiées</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-gray-700">
          {positionLabel(p.mainPosition)} · {ageOn(p.birthDate)} ans · {p.foot ? `pied ${FOOT_LABELS[p.foot].toLowerCase()}` : "pied —"}
          {p.heightCm ? ` · ${p.heightCm} cm` : ""}
        </p>
        <p className="muted mt-0.5 truncate">
          {countryName(p.country)} · {levelLabel(p.currentLevel)}
          {p.videoCount ? ` · 🎥 ${p.videoCount} vidéo${p.videoCount > 1 ? "s" : ""}` : ""}
        </p>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
