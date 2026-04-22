import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PricingCardsProps = {
  compact?: boolean;
};

export function PricingCards({ compact = false }: PricingCardsProps) {
  const stripePaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  const plans = [
    {
      name: "Pay Per PR",
      price: "$5",
      frequency: "per pull request",
      badge: "Best for occasional release notes",
      features: [
        "3-bullet non-technical changelog",
        "Reads commit messages and linked issues",
        "Ready-to-paste output for Slack or email",
      ],
      highlight: false,
    },
    {
      name: "Unlimited",
      price: "$29",
      frequency: "per month",
      badge: "Best value for teams shipping daily",
      features: [
        "Unlimited PR summaries",
        "Faster weekly stakeholder updates",
        "One-click dashboard access after purchase",
      ],
      highlight: true,
    },
  ];

  return (
    <div className={cn("grid gap-6 md:grid-cols-2", compact && "max-w-4xl") }>
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={cn(
            "relative overflow-hidden",
            plan.highlight && "border-[#3fb950]/40 shadow-[0_0_0_1px_rgba(63,185,80,0.35)]"
          )}
        >
          <CardHeader>
            <div className="mb-3 flex items-center justify-between gap-2">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <Badge variant={plan.highlight ? "default" : "info"}>{plan.badge}</Badge>
            </div>
            <CardDescription className="text-base">
              <span className="text-3xl font-semibold text-[#e6edf3]">{plan.price}</span>{" "}
              <span className="text-[#8b949e]">{plan.frequency}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-[#c9d1d9]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3fb950]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <a
              href={stripePaymentLink}
              className={cn(
                buttonVariants({ variant: plan.highlight ? "default" : "outline", size: "lg" }),
                "w-full"
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy With Stripe Checkout
            </a>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
