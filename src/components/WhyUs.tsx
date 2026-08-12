import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const benefits = [
  {
    title: "Free demo",
    description:
      "Two demo edits per browser session. No credit card, no trial wall, no Stripe.",
  },
  {
    title: "No signup",
    description:
      "Open the page and start brushing. There is no account system in this clone.",
  },
  {
    title: "Honest failures",
    description:
      "Missing config returns HTTP 503. Timeouts and oversized payloads return clear codes — never a fake success.",
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
        <h3 className="mb-10 text-center text-lg text-muted-foreground">
          Free, fast, and refreshingly honest.
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
