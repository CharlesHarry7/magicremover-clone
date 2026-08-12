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
      "MagicRemover is a free AI-powered tool that removes unwanted objects, people, text, watermarks, stickers, and logos from photos in seconds — no signup required.",
  },
  {
    question: "Is MagicRemover really free?",
    answer:
      "Yes! MagicRemover is 100% free. You get 5 edits every day, forever. No credit card, no trial, no paywall. 2 free edits without signing in, plus 2 more when you sign in.",
  },
  {
    question: "How many photos can I edit each day?",
    answer:
      "You get 2 free edits per day without signing in. Sign in for 2 additional edits, bringing your total to 4 free edits daily.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No account is required to use MagicRemover. Simply open the page and start editing. Your browser tracks your daily usage count.",
  },
  {
    question: "How does the AI object remover work?",
    answer:
      "MagicRemover uses state-of-the-art AI inpainting models. You brush over the area you want to remove, and the AI predicts what should be behind it, reconstructing a realistic background.",
  },
  {
    question: "Can I remove people from photos?",
    answer:
      "Yes! The Background People Remover can clear passers-by, tourists, and crowds from your photos while keeping your main subject intact.",
  },
  {
    question: "Can I remove watermarks and text?",
    answer:
      "Yes, MagicRemover can remove watermarks, date stamps, captions, subtitles, and other text overlays. However, please only remove watermarks from images you have the right to edit.",
  },
  {
    question: "What image formats are supported?",
    answer:
      "MagicRemover supports JPG, PNG, and WebP image formats, with files up to approximately 10 MB in size.",
  },
  {
    question: "Are my uploaded photos stored?",
    answer:
      "No. We don't store your uploads or results. Images are processed in memory and cleared after each request. Your privacy is our priority.",
  },
];

export default function FAQ() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">FAQ</h2>
        <h3 className="mb-10 text-center text-lg text-muted-foreground">
          The stuff people ask.
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
