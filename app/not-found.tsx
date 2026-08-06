// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-black text-slate-800">404</h1>
      <p className="text-slate-500">This page doesn't exist.</p>
      <a
        href="/sign-in"
        className="text-sm font-medium text-orange-500 hover:underline"
      >
        Go to Home Page
      </a>
    </div>
  );
}
