import type { Messages } from "@/i18n/messages";
import type { UploadText } from "@/components/upload-field";
import { MEDIA_RULES } from "@/lib/domain/media";

export function uploadText(m: Messages, kind: "video" | "photo"): UploadText {
  return {
    choose: kind === "video" ? m.upload.chooseVideo : m.upload.choosePhoto,
    hint: kind === "video" ? m.upload.videoHint : m.upload.photoHint,
    sending: m.upload.sending,
    compressing: m.upload.compressing,
    compressed: m.upload.compressed,
    done: m.upload.done,
    failed: m.upload.failed,
    tooBig: m.upload.tooBig(MEDIA_RULES[kind].maxBytes / 1024 / 1024),
    badType: m.upload.badType,
    keepOpen: m.upload.keepOpen,
  };
}

