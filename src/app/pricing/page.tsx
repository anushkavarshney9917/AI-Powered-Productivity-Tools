"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Button from "@/components/ui/Button";

const plans = [
  {
    name: "Starter",
    description: "Perfect for trying out Focus Forge",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { name: "Up to 100 tasks/month", included: true },
      { name: "5 workflow templates", included: true },
      { name: "Basic integrations", included: true },
      { name: "Email support", included: true },
      { name: "Team collaboration", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Custom integrations", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For professionals and small teams",
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      { name: "Unlimited tasks", included: true },
      { name: "Unlimited workflows", included: true },
      { name: "All integrations", included: true },
      { name: "Email support", included: true },
      { name: "Team collaboration", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom integrations", included: false },
      { name: "Priority support", included: true },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      { name: "Unlimited tasks", included: true },
      { name: "Unlimited workflows", included: true },
      { name: "All integrations", included: true },
      { name: "Email support", included: true },
      { name: "Team collaboration", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom integrations", included: true },
      { name: "Priority support", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I try Focus Forge for free?",
    answer:
      "Yes! Our Starter plan is completely free and includes up to 100 tasks per month. You can also try our Pro plan free for 14 days.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can also pay via invoice.",
  },
  {
    question: "Can I change plans at any time?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.",
  },
  {
    question: "Is there a discount for annual billing?",
    answer:
      "Yes! When you pay annually, you save approximately 17% compared to monthly billing.",
  },
  {
    question: "What happens when I exceed my plan limits?",
    answer:
      "We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional capacity as needed.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />

      <main className="pt-24">
        {/* Hero */}
        <section className="py-20 bg-linear-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-3 py-1 text-sm font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4"
            >
              Pricing
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6"
            >
              Simple, transparent pricing
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto text-lg text-zinc-600 dark:text-zinc-400 mb-10"
            >
              Choose the plan that fits your needs. All plans include a 14-day
              free trial.
            </motion.p>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4"
            >
              <span
                className={`text-sm font-medium ${!isYearly ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isYearly ? "bg-violet-600" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    isYearly ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${isYearly ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}
              >
                Yearly
                <span className="ml-1 px-2 py-0.5 text-xs text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 rounded-full">
                  Save 17%
                </span>
              </span>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`relative bg-white dark:bg-zinc-900 rounded-2xl border p-8 ${
                    plan.popular
                      ? "border-2 border-violet-500"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium text-white bg-linear-to-r from-violet-500 to-indigo-600 rounded-full">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    {plan.monthlyPrice !== null ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                          ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400 ml-2">
                          /month
                        </span>
                      </div>
                    ) : (
                      <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                        Custom
                      </span>
                    )}
                  </div>

                  <Link href="/signup" className="block mb-8">
                    <Button
                      variant={plan.popular ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-center gap-3"
                      >
                        {feature.included ? (
                          <svg
                            className="w-5 h-5 text-violet-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-zinc-300 dark:text-zinc-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? "text-zinc-700 dark:text-zinc-300"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-zinc-900 dark:text-white text-center mb-12"
            >
              Frequently Asked Questions
            </motion.h2>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700"
                >
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
