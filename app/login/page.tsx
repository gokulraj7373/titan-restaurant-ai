export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/20 p-8">
        <h1 className="text-3xl font-bold mb-3">Login</h1>
        <p className="text-gray-300 mb-6">
          This is the login page for Titan Restaurant AI.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 outline-none"
          />
          <button className="w-full rounded-lg bg-white text-black px-4 py-3 font-semibold hover:bg-gray-200">
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}