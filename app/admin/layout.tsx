import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - MemeVote",
  description: "Administration panel for MemeVote",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}

