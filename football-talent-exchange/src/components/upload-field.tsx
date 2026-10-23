"use client";
import { useRef, useState } from "react";
import { requestUploadAction } from "@/app/actions/media";
import { MEDIA_RULES, type MediaKind } from "@/lib/domain/media";

export interface UploadText {
  choose: string;
  hint: string;
  sending: string; // contient {pct}
  done: string;
  failed: string;
  tooBig: string;
  badType: string;
  keepOpen: string;
}

/**
 * Champ d'envoi direct (téléphone ou ordinateur) vers le stockage.
 * Une fois l'envoi terminé, la clé du fichier est placée dans un champ caché `storageKey`
 * et le bouton du formulaire devient actif.
 */
export function UploadField({ kind, text }: { kind: MediaKind; text: UploadText }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const rule = MEDIA_RULES[kind];

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setKey("");
    setMsg(null);
    if (!file) return;
    if (!rule.types[file.type]) return fail(text.badType);
    if (file.size > rule.maxBytes) return fail(text.tooBig);
    setPreview(kind === "photo" ? URL.createObjectURL(file) : null);
    setState("sending");
    setPct(0);
    const r = await requestUploadAction(kind, file.type, file.size).catch(() => null);
    if (!r || !r.ok) return fail(r && r.error === "size" ? text.tooBig : r && r.error === "type" ? text.badType : text.failed);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", r.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setPct(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setKey(r.key);
        setState("done");
        setPct(100);
      } else fail(text.failed);
    };
    xhr.onerror = () => fail(text.failed);
    xhr.send(file);
  }

  function fail(message: string) {
    setState("error");
    setMsg(message);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-pitch-500/40 bg-pitch-50 p-5 text-center hover:bg-pitch-100">
        <span className="text-3xl" aria-hidden>{kind === "video" ? "🎬" : "📷"}</span>
        <span className="font-semibold text-pitch-900">{text.choose}</span>
        <span className="text-xs text-gray-600">{text.hint}</span>
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept={Object.keys(rule.types).join(",")}
          onChange={onPick}
          disabled={state === "sending"}
          data-testid={`upload-${kind}`}
        />
      </label>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
      )}
      {state === "sending" && (
        <div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-pitch-500 transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-gray-600">{text.sending.replace("{pct}", String(pct))} · {text.keepOpen}</p>
        </div>
      )}
      {state === "done" && <p className="text-sm font-semibold text-pitch-700">{text.done}</p>}
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <input type="hidden" name="storageKey" value={key} />
      {/* Bloque l'envoi du formulaire tant que le fichier n'est pas arrivé. */}
      <input type="text" required value={key} onChange={() => {}} className="sr-only" tabIndex={-1} aria-hidden />
    </div>
  );
}
