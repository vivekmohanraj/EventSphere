import React, { useEffect, useCallback } from "react";
import "aos/dist/aos.css";
import AOS from "aos";
import GLightbox from "glightbox";
import PureCounter from "@srexi/purecounterjs";
import Swiper from "swiper";
import Isotope from "isotope-layout";
import imagesLoaded from "imagesloaded";

const Homejs = () => {
  // Memoized initialization functions
  const initAOS = useCallback(() => {
    AOS.init({
      duration: 600,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }, []);

  const initSwiper = useCallback(() => {
    document.querySelectorAll(".init-swiper").forEach((swiperElement) => {
      if (!swiperElement.swiper) {
        new Swiper(swiperElement, {
          loop: true,
          speed: 600,
          autoplay: { delay: 5000 },
          pagination: {
            el: ".swiper-pagination",
            type: "bullets",
            clickable: true,
          },
        });
      }
    });
  }, []);

  const initIsotope = useCallback(() => {
    document.querySelectorAll(".isotope-layout").forEach((isotopeItem) => {
      const iso = new Isotope(isotopeItem.querySelector(".isotope-container"), {
        itemSelector: ".isotope-item",
        layoutMode: isotopeItem.dataset.layout || "masonry",
        filter: isotopeItem.dataset.defaultFilter || "*",
        sortBy: isotopeItem.dataset.sort || "original-order",
      });

      imagesLoaded(isotopeItem, () => {
        iso.layout();
      });

      isotopeItem.querySelectorAll(".isotope-filters li").forEach((filter) => {
        filter.addEventListener("click", () => {
          iso.arrange({ filter: filter.dataset.filter });
          AOS.refresh();
        });
      });
    });
  }, []);

  // Event handlers
  const handleScroll = useCallback(() => {
    const body = document.body;
    const header = document.getElementById("header");
    if (!header) return;

    // Toggle scrolled class
    body.classList.toggle("scrolled", window.scrollY > 100);

    // Scroll top button
    const scrollTop = document.querySelector(".scroll-top");
    if (scrollTop) {
      scrollTop.classList.toggle("active", window.scrollY > 100);
    }
  }, []);

  const handleNavMenu = useCallback((e) => {
    if (e.target.closest(".toggle-dropdown")) {
      e.preventDefault();
      const parent = e.target.closest("li");
      parent.classList.toggle("active");
      parent.nextElementSibling.classList.toggle("dropdown-active");
    }

    if (e.target.closest("#navmenu a")) {
      const body = document.body;
      if (body.classList.contains("mobile-nav-active")) {
        body.classList.remove("mobile-nav-active");
        document.querySelector(".mobile-nav-toggle").classList.replace("bi-x", "bi-list");
      }
    }
  }, []);

  useEffect(() => {
    // Initialize core components
    initAOS();
    GLightbox({ selector: ".glightbox" });
    new PureCounter();

    // Initialize third-party libs after DOM update
    const initTimeout = setTimeout(() => {
      initSwiper();
      initIsotope();
    }, 500);

    // Event listeners
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("click", handleNavMenu);

    // Preloader cleanup
    const preloader = document.getElementById("preloader");
    if (preloader) preloader.remove();

    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleNavMenu);
      
      // Destroy Swiper instances
      document.querySelectorAll(".init-swiper").forEach(swiperElement => {
        if (swiperElement.swiper) swiperElement.swiper.destroy();
      });

      // Destroy Isotope instances
      document.querySelectorAll(".isotope-layout").forEach(isoElement => {
        if (isoElement.isotope) isoElement.isotope.destroy();
      });
    };
  }, [initAOS, initSwiper, initIsotope, handleScroll, handleNavMenu]);

  return null;
};

export default Homejs;