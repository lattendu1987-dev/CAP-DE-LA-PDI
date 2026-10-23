import Image, { getImageProps } from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { countryName, formatDate } from "@/i18n/format";

/** Scènes du carrousel : visuel, point d'intérêt (recadrage mobile) et destination. */
const SCENES = [
  { img: "/visuals/hero.jpg", mobile: "/visuals/hero-mobile.jpg", href: "/inscription?role=joueur" },
  { img: "/visuals/ballon.jpg", mobile: "/visuals/ballon-mobile.jpg", href: "/inscription?role=joueur" },
  { img: "/visuals/tunnel.jpg", mobile: "/visuals/tunnel-mobile.jpg", href: "/detections" },
  { img: "/visuals/aerien.jpg", mobile: "/visuals/aerien-mobile.jpg", href: "/inscription?role=recruteur" },
  { img: "/visuals/corner.jpg", mobile: "/visuals/corner-mobile.jpg", href: "/tarifs" },
] as const;

/** Image « direction artistique » : cadrage horizontal sur ordinateur, vertical sur téléphone. */
function SceneImage({ img, mobile, alt, priority }: { img: string; mobile: string; alt: string; priority: boolean }) {
  const common = { alt, sizes: "100vw", quality: 80 };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, src: img, width: 1920, height: 1080 });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, src: mobile, width: 1080, height: 1920, priority });
  return (
    <picture>
      <source media="(min-aspect-ratio: 4/5)" srcSet={wide} />
      <source media="(max-aspect-ratio: 4/5)" srcSet={tall} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...rest} alt={alt} className="lx-img" />
    </picture>
  );
}

/** Captures de l'application : [image, légende] — joueurs (profil, détections), recruteurs (recherche, comparateur). */
const PHONES: [string, number][][] = [
  [["/visuals/app-profil.webp", 0], ["/visuals/app-detections.webp", 2]],
  [["/visuals/app-recherche.webp", 1], ["/visuals/app-comparateur.webp", 3]],
];

const FEATURE_ICONS = [
  // vidéo, bouclier, téléphone, alerte, cloche, globe — tracés simples en 24×24
  "M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm12 4 5-3v10l-5-3",
  "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3zm-3 9 2 2 4-4",
  "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 17h2",
  "M12 3 2 20h20L12 3zm0 6v5m0 3v.5",
  "M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2zm4 4a2 2 0 0 0 4 0",
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-9 9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
];

export interface LandingData {
  players: number;
  recruiters: number;
  countries: number;
  trials: { id: string; title: string; startsAt: Date; city: string; country: string }[];
  refQs: string;
}

export function Landing({ m, locale, data, interval = 7000 }: { m: Messages; locale: Locale; data: LandingData; interval?: number }) {
  const t = m.landing;
  const total = SCENES.length;
  return (
    <div className="lx" data-lx>
      {/* Décide avant l'affichage s'il faut jouer l'introduction (1re visite de la session, sans « réduire les animations »). */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var d=document.documentElement;if(!sessionStorage.getItem('lx-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-lx-intro','on');sessionStorage.setItem('lx-intro','1')}d.classList.add('lx-js')}catch(e){}",
        }}
      />
      <div className="lx-intro" aria-hidden="true">
        <svg className="lx-intro-mark" viewBox="0 0 120 120" role="presentation">
          <circle cx="60" cy="60" r="52" />
          <path d="M60 30 88 50 77 83H43L32 50z" />
          <path d="M60 30V8M88 50l21-7M77 83l13 18M43 83l-13 18M32 50l-21-7" />
        </svg>
        <p className="lx-intro-word">
          <span>Talent</span>
          <em>Exchange</em>
        </p>
        <button type="button" className="lx-skip" data-lx-skip tabIndex={-1}>{t.skip}</button>
      </div>

      <section className="lx-hero" data-carousel style={{ ["--lx-interval" as string]: `${interval}ms` }} aria-roledescription="carousel" aria-label={m.meta.title}>
        <div className="lx-slides">
          {SCENES.map((s, i) => {
            const slide = t.slides[i];
            const Title = i === 0 ? "h1" : "h2";
            return (
              <article key={s.img} className={`lx-slide${i === 0 ? " is-active" : ""}`} data-slide={i} aria-roledescription="slide" aria-label={t.sceneOf(i + 1, total)} aria-hidden={i === 0 ? undefined : true}>
                <div className="lx-media">
                  <SceneImage img={s.img} mobile={s.mobile} alt={slide.alt} priority={i === 0} />
                </div>
                <div className="lx-shade" />
                <div className="lx-copy">
                  <p className="lx-eyebrow"><span className="lx-eyebrow-rule" />{slide.eyebrow}</p>
                  <Title className="lx-title">
                    <span className="lx-line"><span>{slide.title}</span></span>
                    <span className="lx-line lx-accent"><span>{slide.accent}</span></span>
                  </Title>
                  <p className="lx-text">{slide.text}</p>
                  <div className="lx-actions">
                    <Link href={`${s.href}${s.href.includes("?") ? data.refQs.replace("?", "&") : data.refQs}`} className="lx-btn lx-btn--gold" tabIndex={i === 0 ? undefined : -1}>
                      <span>{slide.cta}</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                    </Link>
                    {i === 0 && (
                      <Link href={`/inscription?role=recruteur${data.refQs.replace("?", "&")}`} className="lx-btn lx-btn--ghost">{t.ctaRecruiter}</Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="lx-glare" aria-hidden="true" />
        <div className="lx-hud">
          <p className="lx-counter" aria-live="polite"><span data-lx-current>01</span><span className="lx-counter-sep" /> {String(total).padStart(2, "0")}</p>
          <div className="lx-progress">
            {SCENES.map((s, i) => (
              <button key={s.img} type="button" className={`lx-dot${i === 0 ? " is-active" : ""}`} data-goto={i} aria-label={t.sceneOf(i + 1, total)}>
                <span />
              </button>
            ))}
          </div>
          <div className="lx-controls">
            <button type="button" className="lx-icon" data-prev aria-label={t.prev}><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" /></svg></button>
            <button type="button" className="lx-icon" data-toggle aria-label={t.pause} data-label-pause={t.pause} data-label-play={t.play}>
              <svg className="i-pause" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" /></svg>
              <svg className="i-play" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z" /></svg>
            </button>
            <button type="button" className="lx-icon" data-next aria-label={t.next}><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg></button>
          </div>
        </div>
        <a href="#lx-manifesto" className="lx-scroll"><span>{t.discover}</span><i /></a>
      </section>

      <div className="lx-marquee" aria-hidden="true">
        <div className="lx-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {t.marquee.map((c) => (
                <b key={c}>{c}<i>✦</i></b>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section id="lx-manifesto" className="lx-section lx-manifesto">
        <p className="lx-big" data-reveal>
          {t.manifesto1} <em>{t.manifesto2}</em>
        </p>
        <p className="lx-lead" data-reveal>{t.manifestoText}</p>
      </section>

      <section className="lx-section lx-sides">
        <h2 className="lx-h2" data-reveal>{t.sidesTitle}</h2>
        <div className="lx-sides-grid">
          {([["players", "/inscription?role=joueur"], ["recruiters", "/inscription?role=recruteur"]] as const).map(([k, href], col) => (
            <div key={k} className="lx-side" data-reveal>
              <div className="lx-phones">
                {PHONES[col].map(([src, cap], j) => (
                  <figure key={src} className={`lx-phone lx-phone--${j === 0 ? "front" : "back"}`} data-tilt>
                    <div className="lx-phone-screen">
                      <Image src={src} alt={t.appCaptions[cap]} fill sizes="(max-width: 768px) 60vw, 260px" quality={85} style={{ objectFit: "cover", objectPosition: "top" }} />
                    </div>
                    <figcaption>{t.appCaptions[cap]}</figcaption>
                  </figure>
                ))}
              </div>
              <h3 className="lx-h3">{t[k].title}</h3>
              <ul className="lx-list">
                {t[k].points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <Link href={`${href}${data.refQs.replace("?", "&")}`} className="lx-btn lx-btn--line"><span>{t[k].cta}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="lx-section lx-stats">
        <h2 className="lx-h2" data-reveal>{t.statsTitle}</h2>
        <div className="lx-stats-grid">
          {([[data.players, m.home.statPlayers], [data.recruiters, m.home.statRecruiters], [data.countries, m.home.statCountries]] as const).map(([n, label]) => (
            <div key={label} className="lx-stat" data-reveal>
              <p className="lx-stat-n" data-count={n}>{n}</p>
              <p className="lx-stat-l">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lx-section lx-features">
        <h2 className="lx-h2" data-reveal>{t.featuresTitle}</h2>
        <div className="lx-cards">
          {t.features.map(([title, text], i) => (
            <article key={title} className="lx-card" data-tilt data-reveal>
              <svg className="lx-card-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={FEATURE_ICONS[i]} /></svg>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {data.trials.length > 0 && (
        <section className="lx-section lx-trials">
          <div className="lx-row">
            <h2 className="lx-h2" data-reveal>{t.trialsTitle}</h2>
            <Link href="/detections" className="lx-link">{t.trialsAll} <span className="lx-arrow" aria-hidden="true">→</span></Link>
          </div>
          <div className="lx-trial-list">
            {data.trials.map((tr) => (
              <Link key={tr.id} href={`/detections/${tr.id}`} className="lx-trial" data-reveal>
                <span className="lx-trial-date">{formatDate(tr.startsAt, locale, { day: "2-digit", month: "short" })}</span>
                <span className="lx-trial-title">{tr.title}</span>
                <span className="lx-trial-place">{tr.city}, {countryName(tr.country, locale)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="lx-section lx-pricing" data-reveal>
        <div>
          <h2 className="lx-h2">{t.pricingTitle}</h2>
          <p className="lx-lead">{t.pricingText}</p>
        </div>
        <Link href="/tarifs" className="lx-btn lx-btn--line"><span>{t.pricingCta}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
      </section>

      <section className="lx-final">
        <div className="lx-final-media">
          <Image src="/visuals/tribune.jpg" alt="" fill sizes="100vw" quality={80} style={{ objectFit: "cover" }} />
        </div>
        <div className="lx-final-copy" data-reveal>
          <h2 className="lx-title lx-title--final">
            <span className="lx-line"><span>{t.finalTitle}</span></span>
            <span className="lx-line lx-accent"><span>{t.finalAccent}</span></span>
          </h2>
          <p className="lx-text">{t.finalText}</p>
          <div className="lx-actions">
            <Link href={`/inscription?role=joueur${data.refQs.replace("?", "&")}`} className="lx-btn lx-btn--gold"><span>{t.slides[0].cta}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
            <Link href={`/inscription?role=recruteur${data.refQs.replace("?", "&")}`} className="lx-btn lx-btn--ghost">{t.ctaRecruiter}</Link>
          </div>
        </div>
      </section>
      <Script src="/landing.js" strategy="afterInteractive" />
    </div>
  );
}
