export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-xl tracking-wide">✦</span>
          <span className="font-semibold text-lg tracking-wide">
            Angel Nadar Matrimony
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <a
            href="/login"
            className="px-4 py-1.5 rounded border border-accent text-accent text-sm font-medium hover:bg-accent hover:text-primary transition-colors"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-4 py-1.5 rounded bg-accent text-primary text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Register Free
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center bg-secondary px-6 py-20 text-center">
        <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">
          Exclusively for the Nadar Community
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight mb-4 max-w-2xl">
          Find Your Perfect Life Partner
        </h1>
        <p className="text-text/70 text-lg max-w-xl mb-8">
          Trusted by thousands of Nadar families. Verified profiles, community
          values, and meaningful connections — all in one place.
        </p>
        <a
          href="/register"
          className="px-8 py-3 bg-primary text-white font-semibold rounded-full text-base hover:opacity-90 transition-opacity shadow"
        >
          Find Your Match →
        </a>
      </section>

      {/* Features */}
      <section className="bg-background px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-primary mb-10">
          Why Angel Nadar Matrimony?
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: "🔐",
              title: "Verified Profiles",
              desc: "Every profile is manually reviewed to ensure authenticity and trust within the community.",
            },
            {
              icon: "💍",
              title: "Community Focused",
              desc: "Built exclusively for the Nadar community with shared values, traditions, and culture at heart.",
            },
            {
              icon: "🤝",
              title: "Family Friendly",
              desc: "Designed for families to browse and connect with ease, respecting traditional matrimony norms.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-secondary rounded-2xl p-6 flex flex-col items-center text-center gap-3 shadow-sm border border-accent/20"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="text-primary font-semibold text-lg">
                {feature.title}
              </h3>
              <p className="text-text/70 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white/70 text-center text-xs py-4">
        © {new Date().getFullYear()} Angel Nadar Matrimony. All rights reserved.
      </footer>
    </div>
  );
}
