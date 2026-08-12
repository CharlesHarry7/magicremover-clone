import TryEditorButton from "@/components/TryEditorButton";
import { MAX_IMAGE_DIM } from "@/lib/remove-limits";

const steps = [
  {
    step: "1",
    title: "Upload a photo",
    description: `Drag and drop a JPG, PNG, or WebP — or paste from the clipboard. Images over ${MAX_IMAGE_DIM}px are resized automatically.`,
  },
  {
    step: "2",
    title: "Brush the object",
    description:
      "Paint a red mask over every pixel you want gone. Use Undo, Clear, and the brush-size slider to be precise.",
  },
  {
    step: "3",
    title: "Download the result",
    description:
      "Tap Remove objects. In about 15–30 seconds the AI returns a clean photo — then download or share the result.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-card px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          How it works
        </h2>
        <p className="mb-10 text-center text-lg text-muted-foreground">
          Three steps. About thirty seconds.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="mb-2 font-semibold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <TryEditorButton>Open the editor</TryEditorButton>
        </div>
      </div>
    </section>
  );
}
