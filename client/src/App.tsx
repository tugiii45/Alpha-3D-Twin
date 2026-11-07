import { AiCard } from "./components/AiCard";
import { HealthCard } from "./components/HealthCard";
import { SmsCard } from "./components/SmsCard";

export function App() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Starter</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hackathon template</h1>
        <p className="mt-3 max-w-xl text-stone-600">
          Health, SMS, and an OpenAI-compatible model route. Drop feature logic into the service
          methods when the product is decided.
        </p>
      </header>
      <div className="grid gap-6">
        <HealthCard />
        <AiCard />
        <SmsCard />
      </div>
    </main>
  );
}
