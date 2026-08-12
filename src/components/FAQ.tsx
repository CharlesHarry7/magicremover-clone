"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is MagicRemover?",
    answer:
      "MagicRemover is a free AI-powered tool that removes unwanted objects, people, text, watermarks, stickers, and logos from photos — brush a mask, run remove, then download.",
  },
  {
    question: "Is this clone really free?",
    answer:
      "Yes. There is no Stripe and no paywall in this clone. The editor offers two demo edits per browser session (refresh resets the counter). No account is required.",
  },
  {
    question: "How many photos can I edit?",
    answer:
      "This clone tracks two demo edits in memory for the current page session. It does not implement sign-in bonuses or a persistent daily quota.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. Open the page and start editing. There is no login flow in this clone.",
  },
  {
    question: "How does the AI object remover work?",
    answer:
      "You brush over the area to erase. The app sends the image and a binary mask to /api/remove-object, which calls a Replicate inpainting model when configured. The Worker aims to finish within ~30s and returns a clear timeout error if it cannot.",
  },
  {
    question: "What if removal is not configured?",
    answer:
      "If the server has no removal token configured, the API returns HTTP 503 with code MISSING_API_KEY instead of a fake success image.",
  },
  {
    question: "Can I remove people, watermarks, and text?",
    answer:
      "Yes — brush the unwanted pixels. Only remove watermarks or logos from images you have the right to edit.",
  },
  {
    question: "What image formats are supported?",
    answer:
      "JPG, PNG, and WebP, up to about 10 MB. Oversized payloads get HTTP 413 from the API.",
  },
  {
    question: "Are my uploaded photos stored?",
    answer:
      "No archive. Images are processed for the request and are not kept by this app afterward.",
  },
];

export default function FAQ() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">FAQ</h2>
        <h3 className="mb-10 text-center text-lg text-muted-foreground">
          Honest answers for this clone.
        </h3>

        <Accordion className="rounded-xl border border-border px-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`item-${index}`}>
              <AccordionTrigger className="py-4 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
