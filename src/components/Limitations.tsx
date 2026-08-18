import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const limitations = [
  {
    title: "Very large erase areas",
    description:
      "Brushing over a huge swath of the frame leaves the AI too little surrounding context. Crop tighter or use a scene-replacement tool instead.",
  },
  {
    title: "Subjects over ~30% of the frame",
    description:
      "When a person or object dominates the photo, there isn’t enough background to invent. Best results come from items under a third of the frame.",
  },
  {
    title: "Heavy text removal",
    description:
      "Tuned for watermarks, date stamps, captions, and a few words — not pages of body copy or dense comic panels.",
  },
];

export default function Limitations() {
  return (
    <section className="bg-muted/50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          Honest limitations
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
          Great on small, well-defined edits — here&apos;s where it falls short,
          so you don&apos;t burn a demo edit on a shot it can&apos;t fix.
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
