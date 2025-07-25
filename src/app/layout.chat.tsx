import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | NexusChat",
  description: "Real-time messaging interface",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
