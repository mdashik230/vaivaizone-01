import Header from "../components/Header";
import HeroSlider from "../components/HeroSlider";
import AnnouncementBar from "../components/AnnouncementBar";
import Categories from "../components/Categories";
import FeaturedProducts from "../components/FeaturedProducts";
import SpecialOffers from "../components/SpecialOffers";
import WhyChooseUs from "../components/WhyChooseUs";
import Footer from "../components/Footer";
import FloatingWhatsApp from "../components/FloatingWhatsApp";

import PageTransition from "../components/PageTransition";

export default function HomePage() {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col font-sans">
        <Header />
        
        <main className="flex-grow pb-20 lg:pb-0">
          <HeroSlider />
          <AnnouncementBar />
          <div id="categories">
            <Categories />
          </div>
          <div id="products">
            <FeaturedProducts />
          </div>
          <div id="offers">
            <SpecialOffers />
          </div>
          <WhyChooseUs />
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
}
