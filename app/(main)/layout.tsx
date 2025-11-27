import { Navbar } from "@/components/navbar";
import { Chatbot } from "@/components/chatbot/chatbot";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Chatbot />
    </div>
  );
}
