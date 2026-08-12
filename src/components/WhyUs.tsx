import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const benefits = [
  {
    title: "100% free",
    description:
      "5 edits every day, forever. No credit card, no trial, no paywall.",
  },
  {
    title: "No signup",
    description:
      "Open the page and start editing. Your browser tracks your daily count.",
  },
  {
    title: "High quality",
    description:
      "Backed by a state-of-the-art inpainting model that reconstructs background detail.",
  },
  {
    title: "Privacy-first",
    description:
      "We don't store your uploads or results. Images leave memory after each request.",
  },
];

export default function WhyUs() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          Why MagicRemover
        </h2>
        <h3 className="mb-10 text-center text-lg text-muted-foreground">
          Free, fast, and refreshingly simple.
        </h3>

        <div className="grid gap-6 sm:grid-cols-2">
          {benefits.map((item) => (
            <Card key={item.title}>
              <CardContent>
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
