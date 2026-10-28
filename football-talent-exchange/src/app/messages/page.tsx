import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMessages } from "@/i18n/server";
import { Empty } from "@/components/ui";

export async function generateMetadata() {
  return { title: (await getMessages()).messages.metaTitle };
}

export default async function MessagesPage() {
  const user = await requireUser();
  const m = await getMessages();
  const convs = await db.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: { participants: { include: { user: { include: { recruiter: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="h1 mb-6">{m.messages.title}</h1>
      {convs.length === 0 ? (
        <Empty>{user.role === "RECRUITER" ? m.messages.emptyRecruiter : m.messages.emptyPlayer}</Empty>
      ) : (
        <ul className="card divide-y divide-gray-100 p-0">
          {convs.map((c) => {
            const me = c.participants.find((p) => p.userId === user.id)!;
            const others = c.participants.filter((p) => p.userId !== user.id);
            const last = c.messages[0];
            const unread = last && last.senderId !== user.id && last.createdAt > me.lastReadAt;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className={`truncate ${unread ? "font-bold" : "font-medium"}`}>
                      {others.map((o) => (o.user.recruiter ? `${o.user.name} (${o.user.recruiter.organization})` : o.user.name)).join(", ")}
                    </p>
                    <p className="muted truncate">{last?.body ?? ""}</p>
                  </div>
                  {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-pitch-500" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
