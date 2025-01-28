import { useEffect } from "react";

const Homejs = () => {
  useEffect(() => {
    "use strict";

    /**
     * Apply .scrolled class to the body as the page is scrolled down
     */
    function toggleScrolled() {
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
    }

    document.addEventListener("scroll", toggleScrolled);
    window.addEventListener("load", toggleScrolled);

    /**
     * Mobile nav toggle
     */
    const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");

    function mobileNavToogle() {
      document.querySelector("body").classList.toggle("mobile-nav-active");
      mobileNavToggleBtn.classList.toggle("bi-list");
      mobileNavToggleBtn.classList.toggle("bi-x");
    }

    if (mobileNavToggleBtn) {
      mobileNavToggleBtn.addEventListener("click", mobileNavToogle);
    }

    /**
     * Hide mobile nav on same-page/hash links
     */
    document.querySelectorAll("#navmenu a").forEach((navmenu) => {
      navmenu.addEventListener("click", () => {
        if (document.querySelector(".mobile-nav-active")) {
          mobileNavToogle();
        }
      });
    });

    /**
     * Toggle mobile nav dropdowns
     */
    document.querySelectorAll(".navmenu .toggle-dropdown").forEach((navmenu) => {
      navmenu.addEventListener("click", function (e) {
        e.preventDefault();
        this.parentNode.classList.toggle("active");
        this.parentNode.nextElementSibling.classList.toggle("dropdown-active");
        e.stopImmediatePropagation();
      });
    });

    /**
     * Preloader
     */
    const preloader = document.querySelector("#preloader");
    if (preloader) {
      window.addEventListener("load", () => {
        preloader.remove();
      });
    }

    /**
     * Scroll top button
     */
    let scrollTop = document.querySelector(".scroll-top");

    function toggleScrollTop() {
      if (scrollTop) {
        window.scrollY > 100
          ? scrollTop.classList.add("active")
          : scrollTop.classList.remove("active");
      }
    }

    if (scrollTop) {
      scrollTop.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    }

    window.addEventListener("load", toggleScrollTop);
    document.addEventListener("scroll", toggleScrollTop);

    /**
     * Animation on scroll function and init
     */
    function aosInit() {
      if (window.AOS) {
        window.AOS.init({
          duration: 600,
          easing: "ease-in-out",
          once: true,
          mirror: false,
        });
      }
    }
    window.addEventListener("load", aosInit);

    /**
     * Initiate glightbox
     */
    if (window.GLightbox) {
      window.GLightbox({ selector: ".glightbox" });
    }

    /**
     * Initiate Pure Counter
     */
    if (window.PureCounter) {
      new window.PureCounter();
    }

    /**
     * Init swiper sliders
     */
    function initSwiper() {
      if (window.Swiper) {
        document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
          let config = {
            loop: true,
            speed: 600,
            autoplay: {
              delay: 5000,
            },
            slidesPerView: "auto",
            pagination: {
              el: ".swiper-pagination",
              type: "bullets",
              clickable: true,
            },
          };

          new window.Swiper(swiperElement, config);
        });
      }
    }

    window.addEventListener("load", initSwiper);

    /**
     * Init isotope layout and filters
     */
    document.querySelectorAll(".isotope-layout").forEach(function (isotopeItem) {
      let layout = isotopeItem.getAttribute("data-layout") ?? "masonry";
      let filter = isotopeItem.getAttribute("data-default-filter") ?? "*";
      let sort = isotopeItem.getAttribute("data-sort") ?? "original-order";

      let initIsotope;
      imagesLoaded(isotopeItem.querySelector(".isotope-container"), function () {
        initIsotope = new window.Isotope(isotopeItem.querySelector(".isotope-container"), {
          itemSelector: ".isotope-item",
          layoutMode: layout,
          filter: filter,
          sortBy: sort,
        });
      });

      isotopeItem.querySelectorAll(".isotope-filters li").forEach(function (filters) {
        filters.addEventListener("click", function () {
          isotopeItem.querySelector(".isotope-filters .filter-active").classList.remove("filter-active");
          this.classList.add("filter-active");
          initIsotope.arrange({
            filter: this.getAttribute("data-filter"),
          });
          if (typeof aosInit === "function") {
            aosInit();
          }
        });
      });
    });

    /**
     * Correct scrolling position upon page load for URLs containing hash links.
     */
    window.addEventListener("load", function () {
      if (window.location.hash) {
        const section = document.querySelector(window.location.hash);
        if (section) {
          setTimeout(() => {
            const scrollMarginTop = getComputedStyle(section).scrollMarginTop;
            window.scrollTo({
              top: section.offsetTop - parseInt(scrollMarginTop),
              behavior: "smooth",
            });
          }, 100);
        }
      }
    });

    /**
     * Navmenu Scrollspy
     */
    let navmenulinks = document.querySelectorAll(".navmenu a");

    function navmenuScrollspy() {
      navmenulinks.forEach((navmenulink) => {
        if (!navmenulink.hash) return;
        const section = document.querySelector(navmenulink.hash);
        if (!section) return;
        const position = window.scrollY + 200;
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
    }

    window.addEventListener("load", navmenuScrollspy);
    document.addEventListener("scroll", navmenuScrollspy);

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener("scroll", toggleScrolled);
      if (mobileNavToggleBtn) {
        mobileNavToggleBtn.removeEventListener("click", mobileNavToogle);
      }
      if (scrollTop) {
        scrollTop.removeEventListener("click", toggleScrollTop);
      }
      document.removeEventListener("scroll", toggleScrollTop);
      document.removeEventListener("scroll", navmenuScrollspy);
    };
  }, []);

  return null;
};

export default Homejs;
