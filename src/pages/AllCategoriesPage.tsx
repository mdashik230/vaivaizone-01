import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useSettings } from "../context/SettingsContext";
import { useAdmin } from "../context/AdminContext";

export default function AllCategoriesPage() {
  const { t } = useSettings();
  const { categories } = useAdmin();

  return (
    <div className="min-h-screen flex flex-col font-sans dark:bg-neutral-950 transition-colors">
      <Header />
      <main className="flex-grow py-8 pb-28 md:pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-8">
            {t("categories")}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categories).map(([id, category]: [string, any]) => (
              <Link
                key={id}
                to={`/category/${id}`}
                className="group flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 group-hover:scale-110 transition-transform">
                    <img src={category.image || "https://images.unsplash.com/photo-1546054452-963030310217?auto=format&fit=crop&q=80&w=1200"} alt={category.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
