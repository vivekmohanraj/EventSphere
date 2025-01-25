import React, { useEffect } from "react";
import "aos/dist/aos.css";
import AOS from "aos";
import GLightbox from "glightbox";
import PureCounter from "@srexi/purecounterjs";
import Swiper from "swiper";
import Isotope from "isotope-layout";
import imagesLoaded from "imagesloaded";

const Homejs = () => {
  useEffect(() => {
    // Scroll class toggle
    const toggleScrolled = () => {
      const selectBody = document.querySelector("body");
      const selectHeader = document.querySelector("#header");
      if (
        !selectHeader.classList.contains("scroll-up-sticky") &&
        !selectHeader.classList.contains("sticky-top") &&
        !selectHeader.classList.contains("fixed-top")
      )
        return;
      window.scrollY > 100
        ? selectBody.classList.add("scrolled")
        : selectBody.classList.remove("scrolled");
    };

    // Mobile nav toggle
    const mobileNavToogle = () => {
      document.querySelector("body").classList.toggle("mobile-nav-active");
      const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");
      mobileNavToggleBtn.classList.toggle("bi-list");
      mobileNavToggleBtn.classList.toggle("bi-x");
    };

    // AOS initialization
    const aosInit = () => {
      AOS.init({
        duration: 600,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    };

    // Swiper initialization
    const initSwiper = () => {
      document.querySelectorAll(".init-swiper").forEach((swiperElement) => {
        if (!swiperElement.classList.contains("swiper-initialized")) {
          const swiperConfig = {
            loop: true,
              speed: 600,
              autoplay: {
                delay: 5000,
              },
              pagination: {
                el: ".swiper-pagination",
                type: "bullets",
                clickable: true,},
          };
    
          new Swiper(swiperElement, swiperConfig);
        }
      });
    };
    

    // Isotope initialization
    const initIsotope = () => {
      document
        .querySelectorAll(".isotope-layout")
        .forEach(function (isotopeItem) {
          let layout = isotopeItem.getAttribute("data-layout") ?? "masonry";
          let filter = isotopeItem.getAttribute("data-default-filter") ?? "*";
          let sort = isotopeItem.getAttribute("data-sort") ?? "original-order";

          imagesLoaded(
            isotopeItem.querySelector(".isotope-container"),
            function () {
              const isotope = new Isotope(
                isotopeItem.querySelector(".isotope-container"),
                {
                  itemSelector: ".isotope-item",
                  layoutMode: layout,
                  filter: filter,
                  sortBy: sort,
                }
              );

              isotopeItem
                .querySelectorAll(".isotope-filters li")
                .forEach(function (filters) {
                  filters.addEventListener(
                    "click",
                    function () {
                      isotopeItem
                        .querySelector(".isotope-filters .filter-active")
                        .classList.remove("filter-active");
                      this.classList.add("filter-active");
                      isotope.arrange({
                        filter: this.getAttribute("data-filter"),
                      });
                      aosInit();
                    },
                    false
                  );
                });
            }
          );
        });
    };

    // Navmenu Scrollspy
    const navmenuScrollspy = () => {
      const navmenulinks = document.querySelectorAll(".navmenu a");
      navmenulinks.forEach((navmenulink) => {
        if (!navmenulink.hash) return;
        let section = document.querySelector(navmenulink.hash);
        if (!section) return;
        let position = window.scrollY + 200;
        if (
          position >= section.offsetTop &&
          position <= section.offsetTop + section.offsetHeight
        ) {
          document
            .querySelectorAll(".navmenu a.active")
            .forEach((link) => link.classList.remove("active"));
          navmenulink.classList.add("active");
        } else {
          navmenulink.classList.remove("active");
        }
      });
    };

    // Event listeners
    window.addEventListener("scroll", toggleScrolled);
    window.addEventListener("load", toggleScrolled);
    window.addEventListener("load", aosInit);
    window.addEventListener("load", initSwiper);
    window.addEventListener("load", initIsotope);
    window.addEventListener("load", navmenuScrollspy);
    document.addEventListener("scroll", navmenuScrollspy);

    // Mobile nav toggle
    const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");
    mobileNavToggleBtn.addEventListener("click", mobileNavToogle);

    // Hide mobile nav on same-page/hash links
    document.querySelectorAll("#navmenu a").forEach((navmenu) => {
      navmenu.addEventListener("click", () => {
        if (document.querySelector(".mobile-nav-active")) {
          mobileNavToogle();
        }
      });
    });

    // Toggle mobile nav dropdowns
    document
      .querySelectorAll(".navmenu .toggle-dropdown")
      .forEach((navmenu) => {
        navmenu.addEventListener("click", function (e) {
          e.preventDefault();
          this.parentNode.classList.toggle("active");
          this.parentNode.nextElementSibling.classList.toggle(
            "dropdown-active"
          );
          e.stopImmediatePropagation();
        });
      });

    // Preloader
    const preloader = document.querySelector("#preloader");
    if (preloader) {
      window.addEventListener("load", () => {
        preloader.remove();
      });
    }

    // Scroll top button
    const scrollTop = document.querySelector(".scroll-top");
    const toggleScrollTop = () => {
      if (scrollTop) {
        window.scrollY > 100
          ? scrollTop.classList.add("active")
          : scrollTop.classList.remove("active");
      }
    };
    scrollTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
    window.addEventListener("load", toggleScrollTop);
    document.addEventListener("scroll", toggleScrollTop);

    // Hash link scrolling
    window.addEventListener("load", function (e) {
      if (window.location.hash) {
        if (document.querySelector(window.location.hash)) {
          setTimeout(() => {
            let section = document.querySelector(window.location.hash);
            let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
            window.scrollTo({
              top: section.offsetTop - parseInt(scrollMarginTop),
              behavior: "smooth",
            });
          }, 100);
        }
      }
    });

    // Lightbox and counter initializations
    const glightbox = GLightbox({
      selector: ".glightbox",
    });
    new PureCounter();

    // Cleanup function
    return () => {
      window.removeEventListener("scroll", toggleScrolled);
      window.removeEventListener("load", toggleScrolled);
      window.removeEventListener("load", aosInit);
      window.removeEventListener("load", initSwiper);
      window.removeEventListener("load", initIsotope);
      window.removeEventListener("load", navmenuScrollspy);
      document.removeEventListener("scroll", navmenuScrollspy);
    };
  }, []);

  return null; // This component doesn't render anything directly
};

export default Homejs;
