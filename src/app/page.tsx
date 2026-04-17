import Link from "next/link";

export default function Home() {
  return (
    <main className="tm-page">
      <section className="tm-shell tm-panel tm-animate-in max-w-4xl p-8 md:p-10">
        <p className="tm-kicker">TravelMate Partner</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">
          Grow your travel business from one partner console.
        </h1>
        <p className="tm-muted mt-4 max-w-2xl text-base">
          Onboard your company, complete verification, manage stays, and track listing lifecycle updates in one place.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="tm-btn tm-btn-primary" href="/auth/signup">
            Create Partner Account
          </Link>
          <Link className="tm-btn tm-btn-outline" href="/auth/login">
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}
