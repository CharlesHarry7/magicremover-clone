const steps = [
  {
    step: "1",
    title: "Upload a photo",
    description: "Drag and drop any JPG or PNG, or click to pick one. Images over 1536px are resized automatically.",
  },
  {
    step: "2",
    title: "Brush the object",
    description: "Paint a red mask over every pixel you want gone. Use Undo, Clear, and the brush-size slider to be precise.",
  },
  {
    step: "3",
    title: "Download the result",
    description: "Tap Remove objects. In about 15 seconds the AI returns a clean photo — download it as PNG.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-muted px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          How it works
        </h2>
        <h3 className="mb-10 text-center text-lg text-muted-foreground">
          Three steps. About thirty seconds.
        </h3>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {item.step}
              </div>
              <h4 className="mb-2 font-semibold">{item.title}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}