import { useEffect } from "react";

const Homejs = () => {
  useEffect(() => {
    // Handle preloader removal
    const removePreloader = () => {
      const preloader = document.querySelector("#preloader");
      if (preloader && preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    };

    // Remove preloader after a short delay to ensure DOM is ready
    setTimeout(removePreloader, 1000);

    // Initialize UI components after preloader is removed
    const initUI = () => {
      // Apply .scrolled class to the body as the page is scrolled down
      const toggleScrolled = () => {
        const selectBody = document.querySelector("body");
        const selectHeader = document.querySelector("#header");
        if (
          !selectHeader ||
          (!selectHeader.classList.contains("scroll-up-sticky") &&
            !selectHeader.classList.contains("sticky-top") &&
            !selectHeader.classList.contains("fixed-top"))
        )
          return;
        window.scrollY > 100
          ? selectBody.classList.add("scrolled")
          : selectBody.classList.remove("scrolled");
      };

      document.addEventListener("scroll", toggleScrolled);
      window.addEventListener("load", toggleScrolled);

      // Mobile nav toggle
      const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");

      function mobileNavToogle() {
        document.querySelector("body").classList.toggle("mobile-nav-active");
        mobileNavToggleBtn.classList.toggle("bi-list");
        mobileNavToggleBtn.classList.toggle("bi-x");
      }

      if (mobileNavToggleBtn) {
        mobileNavToggleBtn.addEventListener("click", mobileNavToogle);
      }

      // Hide mobile nav on same-page/hash links
      document.querySelectorAll("#navmenu a").forEach((navmenu) => {
        navmenu.addEventListener("click", () => {
          if (document.querySelector(".mobile-nav-active")) {
            mobileNavToogle();
          }
        });
      });

      // Scroll top button
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

      // Initialize AOS
      if (window.AOS) {
        window.AOS.init({
          duration: 600,
          easing: "ease-in-out",
          once: true,
          mirror: false,
        });
      }

      // Initialize GLightbox
      if (window.GLightbox) {
        window.GLightbox({ selector: ".glightbox" });
      }

      // Initialize PureCounter
      if (window.PureCounter) {
        new window.PureCounter();
      }
    };

    // Initialize UI after a delay to ensure everything is loaded
    setTimeout(initUI, 1500);

    return () => {
      // Cleanup event listeners
      document.removeEventListener("scroll", () => {});
      window.removeEventListener("load", () => {});
    };
  }, []);

  return null;
};

export default Homejs;