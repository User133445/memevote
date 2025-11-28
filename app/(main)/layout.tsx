import { Navbar } from "@/components/navbar";
import { Chatbot } from "@/components/chatbot/chatbot";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Footer } from "@/components/footer";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Chatbot />
      <FloatingActionButton />
    </div>
  );
}
