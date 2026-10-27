"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sauvegarde automatique d'un formulaire dans le navigateur.
 *
 * À placer à l'intérieur d'un <form>. Chaque saisie est enregistrée (localStorage, 7 jours) ;
 * le brouillon est restauré si la personne revient plus tard, si la connexion a coupé,
 * ou si le serveur renvoie le formulaire avec une erreur. Une fois l'envoi réussi
 * (retour sans paramètre « erreur »), le brouillon est effacé.
 * Jamais enregistrés : mots de passe, fichiers, champs cachés.
 */

const PREFIX = "fte-draft:";
const MAX_AGE = 7 * 24 * 3600 * 1000;

type Draft = { at: number; submittedAt?: number; values: Record<string, string | string[]> };

function savable(el: Element): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return false;
  if (!el.name || el.disabled || el.dataset.noAutosave !== undefined) return false;
  if (el instanceof HTMLInputElement && ["password", "file", "hidden", "submit", "button"].includes(el.type)) return false;
  return true;
}

function read(form: HTMLFormElement) {
  const values: Record<string, string | string[]> = {};
  for (const el of Array.from(form.elements)) {
    if (!savable(el)) continue;
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      const list = (values[el.name] as string[] | undefined) ?? [];
      if (el.checked) list.push(el.value);
      values[el.name] = list;
    } else {
      values[el.name] = el.value;
    }
  }
  return values;
}

/** Remplit un champ en prévenant React, pour les champs contrôlés comme pour les autres. */
function setValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(el);
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function apply(form: HTMLFormElement, values: Draft["values"]) {
  let restored = 0;
  for (const el of Array.from(form.elements)) {
    if (!savable(el) || !(el.name in values)) continue;
    const v = values[el.name];
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      const on = Array.isArray(v) && v.includes(el.value);
      if (el.checked !== on) {
        el.checked = on;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        restored++;
      }
    } else if (typeof v === "string" && el.value !== v) {
      setValue(el, v);
      restored++;
    }
  }
  return restored;
}

export interface AutosaveText {
  restored: string;
  clear: string;
}

export function FormAutosave({ id, text }: { id: string; text: AutosaveText }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [restored, setRestored] = useState(false);
  const key = PREFIX + id;

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    let draft: Draft | null = null;
    try {
      draft = JSON.parse(localStorage.getItem(key) || "null");
    } catch {}
    const failed = new URLSearchParams(location.search).has("erreur");
    if (draft && (Date.now() - draft.at > MAX_AGE || (draft.submittedAt && !failed))) {
      // Trop ancien, ou déjà envoyé avec succès : on repart d'un formulaire propre.
      try { localStorage.removeItem(key); } catch {}
      draft = null;
    }
    if (draft && apply(form, draft.values) > 0) setRestored(true);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = (extra?: Partial<Draft>) => {
      timer = undefined;
      try {
        localStorage.setItem(key, JSON.stringify({ at: Date.now(), values: read(form), ...extra } satisfies Draft));
      } catch {}
    };
    const onInput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => save(), 400);
    };
    const onSubmit = () => {
      clearTimeout(timer);
      save({ submittedAt: Date.now() });
    };
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    form.addEventListener("submit", onSubmit);
    // Fermeture de l'onglet ou passage en arrière-plan : on enregistre tout de suite.
    // Seule une saisie encore en attente est enregistrée (jamais par-dessus le marqueur d'envoi).
    const flush = () => { if (timer) { clearTimeout(timer); save(); } };
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
      form.removeEventListener("submit", onSubmit);
      window.removeEventListener("pagehide", flush);
    };
  }, [key]);

  function clear() {
    try { localStorage.removeItem(key); } catch {}
    const form = anchor.current?.closest("form");
    form?.reset();
    setRestored(false);
  }

  return (
    <span ref={anchor} className="block" data-testid={`autosave-${id}`}>
      {restored && (
        <span role="status" className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          💾 {text.restored}
          <button type="button" onClick={clear} className="font-semibold underline">{text.clear}</button>
        </span>
      )}
    </span>
  );
}
