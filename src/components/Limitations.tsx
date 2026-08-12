import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const limitations = [
  {
    title: "Very large erase areas",
    description:
      "Brushing over a huge swath of the frame leaves the AI too little surrounding context to reconstruct from. Crop tighter or pick a dedicated scene-replacement tool instead.",
  },
  {
    title: "Subjects over ~30% of the frame",
    description:
      "When a person or object dominates the photo, there isn't enough background behind them for the model to invent. Best results come from removing items that occupy under a third of the visible area.",
  },
  {
    title: "Heavy text removal",
    description:
      "The text tool is tuned for watermarks, date stamps, captions, and a few words. Pages of body copy, comic-book panels, or dense screenshots will leave artifacts.",
  },
];

export default function Limitations() {
  return (
    <section className="bg-muted/50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          Honest limitations
        </h2>
        <h3 className="mb-10 text-center text-lg text-muted-foreground">
          When MagicRemover isn&apos;t the right tool
        </h3>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          The AI does great on small, well-defined edits. Here&apos;s where it
          currently falls short — so you don&apos;t spend a credit on a shot it
          can&apos;t fix.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {limitations.map((item, index) => (
            <Card key={item.title} className="bg-background">
              <CardContent>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-warning/10 text-sm font-bold text-warning">
                  {index + 1}
                </div>
                <CardTitle className="mb-2 text-base font-semibold">
                  {item.title}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
