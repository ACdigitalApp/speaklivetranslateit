const FAQS = [
  {
    q: "Cos'è Speak & Translate Live?",
    a: "Speak & Translate Live è un'app AC Digital App per tradurre voce e testo in tempo reale.",
  },
  {
    q: "A cosa serve Speak & Translate Live?",
    a: "Serve ad aiutare le persone a comunicare in più lingue durante viaggi, lavoro, studio e conversazioni quotidiane.",
  },
  {
    q: "Speak & Translate Live traduce la voce?",
    a: "Sì, l'app è pensata per tradurre contenuti vocali e facilitare conversazioni multilingua.",
  },
  {
    q: "Posso usare Speak & Translate Live anche per il testo?",
    a: "Sì, l'app permette anche di inserire testo da tradurre.",
  },
  {
    q: "È utile per viaggiare?",
    a: "Sì, può essere utile per comunicare all'estero, chiedere informazioni, comprendere frasi e gestire conversazioni semplici.",
  },
  {
    q: "È utile per lavoro e studio?",
    a: "Sì, può aiutare nella comprensione e traduzione di contenuti in contesti professionali o di studio.",
  },
  {
    q: "Speak & Translate Live fa parte di AC Digital App?",
    a: "Sì, Speak & Translate Live fa parte dell'ecosistema AC Digital App.",
  },
  {
    q: "Come posso contattare AC Digital App?",
    a: "Puoi scrivere a acdigital.app@gmail.com.",
  },
];

export const HOME_FAQ_DATA = FAQS;

export default function HomeFAQ() {
  return (
    <section
      aria-labelledby="faq-title"
      className="mx-auto w-full max-w-3xl px-5 py-10 text-[#1f2d27]"
    >
      <h2 id="faq-title" className="text-xl font-semibold mb-4">
        Domande frequenti su Speak & Translate Live
      </h2>
      <dl className="space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-lg border border-[#2D6A4F]/15 bg-white/60 p-4"
          >
            <summary className="cursor-pointer list-none font-medium text-[#1f2d27]">
              {f.q}
            </summary>
            <dd className="mt-2 text-sm text-[#4E6358]">{f.a}</dd>
          </details>
        ))}
      </dl>
    </section>
  );
}
