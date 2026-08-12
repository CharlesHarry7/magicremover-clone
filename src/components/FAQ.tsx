"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What is MagicRemover?",
    answer: "MagicRemover is a free AI-powered tool that removes unwanted objects, people, text, watermarks, stickers, and logos from photos in seconds — no signup required.",
  },
  {
    question: "Is MagicRemover really free?",
    answer: "Yes! MagicRemover is 100% free. You get 5 edits every day, forever. No credit card, no trial, no paywall. 2 free edits without signing in, plus 2 more when you sign in.",
  },
  {
    question: "How many photos can I edit each day?",
    answer: "You get 2 free edits per day without signing in. Sign in for 2 additional edits, bringing your total to 4 free edits daily.",
  },
  {
    question: "Do I need an account?",
    answer: "No account is required to use MagicRemover. Simply open the page and start editing. Your browser tracks your daily usage count.",
  },
  {
    question: "How does the AI object remover work?",
    answer: "MagicRemover uses state-of-the-art AI inpainting models. You brush over the area you want to remove, and the AI predicts what should be behind it, reconstructing a realistic background.",
  },
  {
    question: "Can I remove people from photos?",
    answer: "Yes! The Background People Remover can clear passers-by, tourists, and crowds from your photos while keeping your main subject intact.",
  },
  {
    question: "Can I remove watermarks and text?",
    answer: "Yes, MagicRemover can remove watermarks, date stamps, captions, subtitles, and other text overlays. However, please only remove watermarks from images you have the right to edit.",
  },
  {
    question: "What image formats are supported?",
    answer: "MagicRemover supports JPG and PNG image formats, with files up to approximately 10 MB in size.",
  },
  {
    question: "Are my uploaded photos stored?",
    answer: "No. We don't store your uploads or results. Images are processed in memory and cleared after each request. Your privacy is our priority.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
          FAQ
        </h2>
        <h3 className="mb-10 text-center text-lg text-muted">
          The stuff people ask.
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-xl border border-border">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="pr-4 font-medium text-sm">{faq.question}</span>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-muted transition-transform ${openIndex === index ? "rotate-45" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="border-t border-border px-5 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-muted">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}