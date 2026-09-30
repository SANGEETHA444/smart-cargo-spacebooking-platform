import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <section className="grid md:grid-cols-2 gap-10 items-center">
      <div>
        <p className="text-brand text-sm font-semibold uppercase tracking-wide">AI-powered logistics</p>
        <h1 className="text-4xl md:text-5xl font-bold mt-2 leading-tight">
          Book shared container space near you
        </h1>
        <p className="text-slate-400 mt-4 text-lg">
          CargoShare connects small exporters with verified logistics providers offering real-time
          partial container capacity — ranked by our DTAB-Rank recommender.
        </p>
        <div className="flex gap-3 mt-8">
          <Link to="/register/trader" className="bg-brand hover:bg-brand-dark px-5 py-2.5 rounded-lg font-medium">
            Start as trader
          </Link>
          <Link
            to="/register/lsp"
            className="border border-slate-600 hover:border-brand px-5 py-2.5 rounded-lg"
          >
            Apply as LSP
          </Link>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h2 className="font-semibold text-lg">Platform highlights</h2>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>Real-time space updates via WebSockets</li>
          <li>15-minute booking hold + Razorpay checkout (mock when keys unset)</li>
          <li>LSP onboarding with ML data-quality score</li>
          <li>Geo search + map view for nearby pickup</li>
        </ul>
      </div>
    </section>
  );
}
