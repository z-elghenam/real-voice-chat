"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Channel as StreamChannel, StreamChat } from "stream-chat";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatSidebarProps = {
  channel: StreamChannel;
  client: StreamChat;
  roomName: string;
};

export function ChatSidebar({ channel, client, roomName }: ChatSidebarProps) {
  const [messages, setMessages] = useState(() => channel.state.messages);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncState = () => {
      setMessages([...channel.state.messages]);
      setTypingNames(
        Object.values(channel.state.typing)
          .map((typing) => typing.user?.name || typing.user?.id)
          .filter((value): value is string => Boolean(value))
          .filter((value) => value !== client.user?.name && value !== client.userID),
      );
    };

    syncState();
    const subscription = channel.on(syncState);

    return () => {
      subscription.unsubscribe();
    };
  }, [channel, client.user?.name, client.userID]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => !message.parent_id),
    [messages],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = text.trim();
    if (!value) return;

    setIsSending(true);

    try {
      await channel.sendMessage({ text: value });
      setText("");
      await channel.stopTyping();
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="h-full min-h-[24rem] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-xl shadow-black/20">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Text chat
          </div>
          <div className="mt-1 text-lg font-semibold text-white">{roomName}</div>
        </div>
        <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {visibleMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
              No messages yet. Break the ice for the room.
            </div>
          ) : (
            visibleMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
              >
                <div className="mb-1 text-sm font-medium text-white">
                  {message.user?.name || message.user?.id || "Participant"}
                </div>
                <div className="text-sm leading-7 text-slate-200">{message.text}</div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <div className="mb-3 min-h-5 text-sm text-slate-400">
            {typingNames.length > 0
              ? `${typingNames.join(", ")} ${
                  typingNames.length === 1 ? "is" : "are"
                } typing...`
              : ""}
          </div>
          <form className="flex gap-3" onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={async (event) => {
                const nextValue = event.target.value;
                setText(nextValue);
                if (nextValue.trim()) {
                  await channel.keystroke();
                } else {
                  await channel.stopTyping();
                }
              }}
              onBlur={() => {
                void channel.stopTyping();
              }}
              className="min-h-[88px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
              placeholder="Message the room..."
            />
            <Button type="submit" disabled={isSending} className="self-end">
              <SendHorizontal className="h-4 w-4" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
