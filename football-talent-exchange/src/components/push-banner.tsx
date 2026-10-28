import { PushToggle } from "./push-toggle";
import { pushText } from "@/lib/ui-text";
import type { Messages } from "@/i18n/messages";

/** Proposition d'activer les notifications (affichée seulement si le service est configuré). */
export function PushBanner({ m, compact = true }: { m: Messages; compact?: boolean }) {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key || !process.env.VAPID_PRIVATE_KEY) return null;
  return <PushToggle publicKey={key} text={pushText(m)} compact={compact} />;
}
