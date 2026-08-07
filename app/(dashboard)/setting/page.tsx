import Link from "next/link";
import { Settings, ArrowLeft, Wrench } from "lucide-react";

export default function SettingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg p-10 text-center border border-gray-100">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Settings className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Settings
        </h1>

        <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
          <Wrench className="h-5 w-5" />
          <span className="font-medium">Under Development</span>
        </div>

        <p className="mt-4 text-gray-600 leading-relaxed">
          The Settings module is currently being developed.
          It will be available in a future update.
        </p>

        <Link
          href="/home"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-white font-medium transition hover:bg-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}