import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-4xl font-bold mb-4">Titan Restaurant AI</h1>
        <p className="text-lg text-gray-300 mb-8">
          Simple business intelligence for small restaurants
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-gray-200"
          >
            Login
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg border border-white px-6 py-3 font-semibold hover:bg-white hover:text-black"
          >
            View Demo
          </Link>
        </div>
      </div>
    </main>
  );
}