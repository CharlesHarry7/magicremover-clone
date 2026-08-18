import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { FREE_EDITS_STORY } from "@/lib/remove-limits";

const benefits = [
  {
    title: "Free session",
    description: `${FREE_EDITS_STORY} — no credit card and no trial wall. Not an unlimited forever-free quota.`,
  },
  {
    title: "No signup",
    description: "Open the page and start brushing. No account required.",
  },
  {
    title: "Honest failures",
    description:
      "If removal isn’t available or a request times out, you get a clear error — never a fake success image.",
  },
  {
    title: "Privacy-first",
    description:
      "Uploads are processed for the request. This app does not keep a results archive.",
  },
];

export default function WhyUs() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          Why MagicRemover
        </h2>
        <p className="mb-10 text-center text-lg text-muted-foreground">
          A free session — fast, and honest about limits.
        </p>

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
