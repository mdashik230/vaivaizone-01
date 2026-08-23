import { Truck, ShieldCheck, RotateCcw, CreditCard } from "lucide-react";

const features = [
  {
    icon: <Truck size={32} className="text-primary" />,
    title: "Fast Delivery",
    desc: "Lightning fast shipping across Bangladesh"
  },
  {
    icon: <ShieldCheck size={32} className="text-primary" />,
    title: "Trusted Products",
    desc: "100% Genuine and quality verified items"
  },
  {
    icon: <RotateCcw size={32} className="text-primary" />,
    title: "Easy Return",
    desc: "Hassle-free 7-day return policy"
  },
  {
    icon: <CreditCard size={32} className="text-primary" />,
    title: "Secure Payment",
    desc: "Multiple secure payment options available"
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-white dark:bg-neutral-950 border-y border-neutral-100 dark:border-neutral-800 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center p-4">
              <div className="mb-4 bg-primary/5 dark:bg-primary/10 p-4 rounded-3xl">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[200px]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
