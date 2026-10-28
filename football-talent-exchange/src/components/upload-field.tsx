"use client";
import { useRef, useState } from "react";
import { requestUploadAction } from "@/app/actions/media";
import { MEDIA_RULES, type MediaKind } from "@/lib/domain/media";

export interface UploadText {
  choose: string;
  hint: string;
  sending: string; // contient {pct}
  compressing: string; // contient {pct}
  compressed: string; // contient {from} et {to} (en Mo)
  done: string;
  failed: string;
  tooBig: string;
  badType: string;
  keepOpen: string;
}

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0);

/**
 * Champ d'envoi direct (téléphone ou ordinateur).
 * Vidéo : compressée d'abord sur le téléphone quand c'est utile (envoi bien plus rapide en 3G),
 * puis envoyée vers le stockage (S3/R2, local) ou Cloudflare Stream.
 * Une fois l'envoi terminé, la clé du fichier est placée dans le champ caché `storageKey`.
 */
export function UploadField({ kind, text }: { kind: MediaKind; text: UploadText }) {
  const [state, setState] = useState<"idle" | "compressing" | "sending" | "done" | "error">("idle");
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const rule = MEDIA_RULES[kind];

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    let file = e.target.files?.[0];
    setKey("");
    setMsg(null);
    setInfo(null);
    if (!file) return;
    // Certains téléphones ne donnent pas le type des documents Word : on le déduit de l'extension.
    if (!file.type) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mime = Object.entries(rule.types).find(([, e]) => e === ext)?.[0];
      if (mime) file = new File([file], file.name, { type: mime });
    }
    if (!rule.types[file.type]) return fail(text.badType);
    setFileName(file.name);
    setPreview(kind === "photo" ? URL.createObjectURL(file) : null);

    if (kind === "video") {
      setState("compressing");
      setPct(0);
      try {
        const { compressVideo } = await import("@/lib/video-compress");
        const original = file.size;
        const r = await compressVideo(file, setPct);
        if (r.compressed) {
          file = r.file;
          setInfo(text.compressed.replace("{from}", mb(original)).replace("{to}", mb(file.size)));
        }
      } catch (err) {
        // Compression impossible sur cet appareil : on envoie le fichier d'origine.
        console.warn("Compression ignorée", err);
      }
    }
    if (file.size > rule.maxBytes) return fail(text.tooBig);

    setState("sending");
    setPct(0);
    const r = await requestUploadAction(kind, file.type, file.size).catch(() => null);
    if (!r || !r.ok) return fail(r && r.error === "size" ? text.tooBig : r && r.error === "type" ? text.badType : text.failed);
    if (r.method === "BLOB") {
      // Vercel Blob : envoi direct, découpé en morceaux pour les gros fichiers (reprise en cas de coupure).
      try {
        const { upload } = await import("@vercel/blob/client");
        await upload(r.key, file, {
          access: "public",
          handleUploadUrl: r.uploadUrl,
          contentType: file.type,
          multipart: file.size > 8 * 1024 * 1024,
          onUploadProgress: (p) => setPct(Math.round(p.percentage)),
        });
        setKey(r.key);
        setState("done");
        setPct(100);
      } catch {
        fail(text.failed);
      }
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open(r.method === "POST_FORM" ? "POST" : "PUT", r.uploadUrl);
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setPct(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setKey(r.key);
        setState("done");
        setPct(100);
      } else fail(text.failed);
    };
    xhr.onerror = () => fail(text.failed);
    if (r.method === "POST_FORM") {
      const form = new FormData();
      form.append("file", file);
      xhr.send(form);
    } else {
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    }
  }

  function fail(message: string) {
    setState("error");
    setMsg(message);
    if (input.current) input.current.value = "";
  }

  const busy = state === "compressing" || state === "sending";
  return (
    <div className="space-y-2">
      <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-pitch-500/40 bg-pitch-50 p-5 text-center hover:bg-pitch-100 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        <span className="text-3xl" aria-hidden>{kind === "video" ? "🎬" : kind === "cv" ? "📄" : "📷"}</span>
        <span className="font-semibold text-pitch-900">{text.choose}</span>
        <span className="text-xs text-gray-600">{text.hint}</span>
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept={[...Object.keys(rule.types), ...Object.values(rule.types).map((e) => `.${e}`)].join(",")}
          onChange={onPick}
          disabled={busy}
          data-testid={`upload-${kind}`}
        />
      </label>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
      )}
      {busy && (
        <div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div className={`h-full transition-all ${state === "compressing" ? "bg-amber-400" : "bg-pitch-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {(state === "compressing" ? text.compressing : text.sending).replace("{pct}", String(pct))} · {text.keepOpen}
          </p>
        </div>
      )}
      {info && <p className="text-xs text-pitch-700">{info}</p>}
      {state === "done" && <p className="text-sm font-semibold text-pitch-700">{text.done}</p>}
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <input type="hidden" name="storageKey" value={key} />
      <input type="hidden" name="fileName" value={fileName} />
      {/* Bloque l'envoi du formulaire tant que le fichier n'est pas arrivé. */}
      <input type="text" required value={key} onChange={() => {}} className="sr-only" tabIndex={-1} aria-hidden />
    </div>
  );
}
