import React, { useEffect } from "react";

import herojpg from "../assets/img/hero-bg.jpeg";
import aboutjpg from "../assets/img/about.jpg";
import about_2jpg from "../assets/img/about-2.jpg";
import services_1jpg from "../assets/img/services-1.jpg";
import services_2jpg from "../assets/img/services-2.jpg";
import services_3jpg from "../assets/img/services-2.jpg";
import client_1jpg from "../assets/img/clients/client-1.png";
import client_2jpg from "../assets/img/clients/client-2.png";
import client_3jpg from "../assets/img/clients/client-3.png";
import client_4jpg from "../assets/img/clients/client-4.png";
import client_5jpg from "../assets/img/clients/client-5.png";
import client_6jpg from "../assets/img/clients/client-6.png";
import working_1jpg from "../assets/img/working-1.jpg";
import working_2jpg from "../assets/img/working-2.jpg";
import working_3jpg from "../assets/img/working-3.jpg";
import working_4jpg from "../assets/img/working-4.jpg";
import testimonialsjpg from "../assets/img/testimonials-bg.jpg";
import testimonials_1jpg from "../assets/img/testimonials/testimonials-1.jpg";
import testimonials_2jpg from "../assets/img/testimonials/testimonials-2.jpg";
import testimonials_3jpg from "../assets/img/testimonials/testimonials-3.jpg";
import testimonials_4jpg from "../assets/img/testimonials/testimonials-3.jpg";
import testimonials_5jpg from "../assets/img/testimonials/testimonials-5.jpg";
import portfolio_app_1jpg from "../assets/img/portfolio/app-1.jpg";
import portfolio_product1jpg from "../assets/img/portfolio/product-1.jpg";
import portfolio_branding1jpg from "../assets/img/portfolio/branding-1.jpg";
import portfolio_branding2jpg from "../assets/img/portfolio/branding-2.jpg";
import portfoliio_books1jpg from "../assets/img/portfolio/books-1.jpg";
import portfolio_app_2jpg from "../assets/img/portfolio/app-2.jpg";
import portfolio_product2jpg from "../assets/img/portfolio/product-2.jpg";
import portfoliio_books2jpg from "../assets/img/portfolio/books-2.jpg";
import portfolio_app_3jpg from "../assets/img/portfolio/app-3.jpg";
import portfolio_product3jpg from "../assets/img/portfolio/product-3.jpg";
import portfolio_branding3jpg from "../assets/img/portfolio/branding-3.jpg";
import portfoliio_books3jpg from "../assets/img/portfolio/books-3.jpg";
import team1jpg from "../assets/img/team/team-1.jpg";
import team2jpg from "../assets/img/team/team-2.jpg";
import team3jpg from "../assets/img/team/team-3.jpg";

function Home() {
  return (
    <>
      <div className="general">
        <div className="home-css">
        <main className="main">
          {/* <!-- Hero Section --> */}
          <section id="hero" className="hero section dark-background">
            <img src={herojpg} alt="" data-aos="fade-in" />

            <div className="container d-flex flex-column align-items-center">
              <h2 data-aos="fade-up" data-aos-delay="100">
                DISCOVER. CONNECT. COORDINATE.
              </h2>
              <p data-aos="fade-up" data-aos-delay="200">
                We are a platform empowering users to discover, connect, and
                coordinate events seamlessly.
              </p>
              <div
                className="d-flex mt-4"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <a href="#about" className="btn-get-started">
                  Login/Signup
                </a>
                <a
                  href="https://www.youtube.com/watch?v=Y7f98aduVJ8"
                  className="glightbox btn-watch-video d-flex align-items-center"
                >
                  <i className="bi bi-play-circle"></i>
                  <span>Watch Video</span>
                </a>
              </div>
            </div>
          </section>
          {/* <!-- /Hero Section --> */}

          {/* <!-- About Section --> */}
          <section id="about" className="about section">
            <div className="container">
              <div className="row gy-4">
                <div
                  className="col-lg-6"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  <h3>
                    Voluptatem dignissimos provident laboris nisi ut aliquip ex
                    ea commodo
                  </h3>
                  <img
                    src={aboutjpg}
                    className="img-fluid rounded-4 mb-4"
                    alt=""
                  />
                  <p>
                    Ut fugiat ut sunt quia veniam. Voluptate perferendis
                    perspiciatis quod nisi et. Placeat debitis quia recusandae
                    odit et consequatur voluptatem. Dignissimos pariatur
                    consectetur fugiat voluptas ea.
                  </p>
                  <p>
                    Temporibus nihil enim deserunt sed ea. Provident sit
                    expedita aut cupiditate nihil vitae quo officia vel.
                    Blanditiis eligendi possimus et in cum. Quidem eos ut sint
                    rem veniam qui. Ut ut repellendus nobis tempore doloribus
                    debitis explicabo similique sit. Accusantium sed ut omnis
                    beatae neque deleniti repellendus.
                  </p>
                </div>
                <div
                  className="col-lg-6"
                  data-aos="fade-up"
                  data-aos-delay="250"
                >
                  <div className="content ps-0 ps-lg-5">
                    <p className="fst-italic">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.
                    </p>
                    <ul>
                      <li>
                        <i className="bi bi-check-circle-fill"></i>{" "}
                        <span>
                          Ullamco laboris nisi ut aliquip ex ea commodo
                          consequat.
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-check-circle-fill"></i>{" "}
                        <span>
                          Duis aute irure dolor in reprehenderit in voluptate
                          velit.
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-check-circle-fill"></i>{" "}
                        <span>
                          Ullamco laboris nisi ut aliquip ex ea commodo
                          consequat. Duis aute irure dolor in reprehenderit in
                          voluptate trideta storacalaperda mastiro dolore eu
                          fugiat nulla pariatur.
                        </span>
                      </li>
                    </ul>
                    <p>
                      Ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident
                    </p>

                    <div className="position-relative mt-4">
                      <img
                        src={about_2jpg}
                        className="img-fluid rounded-4"
                        alt=""
                      />
                      <a
                        href="https://www.youtube.com/watch?v=Y7f98aduVJ8"
                        className="glightbox pulsating-play-btn"
                      ></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* <!-- /About Section --> */}

          {/* <!-- Stats Section --> */}
          <section id="stats" className="stats section light-background">
            <div className="container" data-aos="fade-up" data-aos-delay="100">
              <div className="row gy-4">
                <div className="col-lg-3 col-md-6">
                  <div className="stats-item d-flex align-items-center w-100 h-100">
                    <i className="bi bi-emoji-smile color-blue flex-shrink-0"></i>
                    <div>
                      <span
                        data-purecounter-start="0"
                        data-purecounter-end="232"
                        data-purecounter-duration="1"
                        className="purecounter"
                      ></span>
                      <p>Happy Clients</p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Stats Item --> */}

                <div className="col-lg-3 col-md-6">
                  <div className="stats-item d-flex align-items-center w-100 h-100">
                    <i className="bi bi-journal-richtext color-orange flex-shrink-0"></i>
                    <div>
                      <span
                        data-purecounter-start="0"
                        data-purecounter-end="521"
                        data-purecounter-duration="1"
                        className="purecounter"
                      ></span>
                      <p>Projects</p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Stats Item --> */}

                <div className="col-lg-3 col-md-6">
                  <div className="stats-item d-flex align-items-center w-100 h-100">
                    <i className="bi bi-headset color-green flex-shrink-0"></i>
                    <div>
                      <span
                        data-purecounter-start="0"
                        data-purecounter-end="1463"
                        data-purecounter-duration="1"
                        className="purecounter"
                      ></span>
                      <p>Hours Of Support</p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Stats Item --> */}

                <div className="col-lg-3 col-md-6">
                  <div className="stats-item d-flex align-items-center w-100 h-100">
                    <i className="bi bi-people color-pink flex-shrink-0"></i>
                    <div>
                      <span
                        data-purecounter-start="0"
                        data-purecounter-end="15"
                        data-purecounter-duration="1"
                        className="purecounter"
                      ></span>
                      <p>Hard Workers</p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Stats Item --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Stats Section --> */}

          {/* <!-- Services Section --> */}
          <section id="services" className="services section">
            {/* <!-- Section Title --> */}
            <div className="container section-title" data-aos="fade-up">
              <h2>Services</h2>
              <p>
                Featured Srvices
                <br />
              </p>
            </div>
            {/* <!-- End Section Title --> */}

            <div className="container" data-aos="fade-up" data-aos-delay="100">
              <div className="row gy-5">
                <div
                  className="col-xl-4 col-md-6"
                  data-aos="zoom-in"
                  data-aos-delay="200"
                >
                  <div className="service-item">
                    <div className="img">
                      <img src={services_1jpg} className="img-fluid" alt="" />
                    </div>
                    <div className="details position-relative">
                      <div className="icon">
                        <i className="bi bi-activity"></i>
                      </div>
                      <a href="service-details.html" className="stretched-link">
                        <h3>Nesciunt Mete</h3>
                      </a>
                      <p>
                        Provident nihil minus qui consequatur non omnis maiores.
                        Eos accusantium minus dolores iure perferendis.
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}

                <div
                  className="col-xl-4 col-md-6"
                  data-aos="zoom-in"
                  data-aos-delay="300"
                >
                  <div className="service-item">
                    <div className="img">
                      <img src={services_2jpg} className="img-fluid" alt="" />
                    </div>
                    <div className="details position-relative">
                      <div className="icon">
                        <i className="bi bi-broadcast"></i>
                      </div>
                      <a href="service-details.html" className="stretched-link">
                        <h3>Eosle Commodi</h3>
                      </a>
                      <p>
                        Ut autem aut autem non a. Sint sint sit facilis nam
                        iusto sint. Libero corrupti neque eum hic non ut
                        nesciunt dolorem.
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}

                <div
                  className="col-xl-4 col-md-6"
                  data-aos="zoom-in"
                  data-aos-delay="400"
                >
                  <div className="service-item">
                    <div className="img">
                      <img src={services_3jpg} className="img-fluid" alt="" />
                    </div>
                    <div className="details position-relative">
                      <div className="icon">
                        <i className="bi bi-easel"></i>
                      </div>
                      <a href="service-details.html" className="stretched-link">
                        <h3>Ledo Markt</h3>
                      </a>
                      <p>
                        Ut excepturi voluptatem nisi sed. Quidem fuga
                        consequatur. Minus ea aut. Vel qui id voluptas adipisci
                        eos earum corrupti.
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Services Section --> */}

          {/* <!-- Clients Section --> */}
          <section id="clients" className="clients section light-background">
            <div className="container" data-aos="fade-up">
              <div className="row gy-4">
                <div className="col-xl-2 col-md-3 col-6 client-logo">
                  <img src={client_1jpg} className="img-fluid" alt="" />
                </div>
                {/* \<!-- End Client Item --> */}

                <div className="col-xl-2 col-md-3 col-6 client-logo">
                  <img src={client_2jpg} className="img-fluid" alt="" />
                </div>
                {/* <!-- End Client Item --> */}

                <div className="col-xl-2 col-md-3 col-6 client-logo">
                  <img src={client_3jpg} className="img-fluid" alt="" />
                </div>
                {/* <!-- End Client Item --> */}

                <div className="col-xl-2 col-md-3 col-6 client-logo">
                  <img src={client_4jpg} className="img-fluid" alt="" />
                </div>
                {/* <!-- End Client Item --> */}

                <div className="col-xl-2 col-md-3 col-6 client-logo">
                  <img src={client_5jpg} className="img-fluid" alt="" />
                </div>
                {/* <!-- End Client Item --> */}

                <div className="col-xl-2 col-md-3 col-6 client-logo">
                  <img src={client_6jpg} className="img-fluid" alt="" />
                </div>
                {/* <!-- End Client Item --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Clients Section --> */}

          {/* <!-- Features Section --> */}
          <section id="features" className="features section">
            <div className="container">
              <ul
                className="nav nav-tabs row  d-flex"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <li className="nav-item col-3">
                  <a
                    className="nav-link active show"
                    data-bs-toggle="tab"
                    data-bs-target="#features-tab-1"
                  >
                    <i className="bi bi-binoculars"></i>
                    <h4 className="d-none d-lg-block">
                      Modi sit est dela pireda nest
                    </h4>
                  </a>
                </li>
                <li className="nav-item col-3">
                  <a
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#features-tab-2"
                  >
                    <i className="bi bi-box-seam"></i>
                    <h4 className="d-none d-lg-block">
                      Unde praesenti mara setra le
                    </h4>
                  </a>
                </li>
                <li className="nav-item col-3">
                  <a
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#features-tab-3"
                  >
                    <i className="bi bi-brightness-high"></i>
                    <h4 className="d-none d-lg-block">
                      Pariatur explica nitro dela
                    </h4>
                  </a>
                </li>
                <li className="nav-item col-3">
                  <a
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#features-tab-4"
                  >
                    <i className="bi bi-command"></i>
                    <h4 className="d-none d-lg-block">Nostrum qui dile node</h4>
                  </a>
                </li>
              </ul>
              {/* <!-- End Tab Nav --> */}

              <div
                className="tab-content"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <div className="tab-pane fade active show" id="features-tab-1">
                  <div className="row">
                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0">
                      <h3>
                        Voluptatem dignissimos provident quasi corporis
                        voluptates sit assumenda.
                      </h3>
                      <p className="fst-italic">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua.
                      </p>
                      <ul>
                        <li>
                          <i className="bi bi-check2-all"></i>
                          <span>
                            Ullamco laboris nisi ut aliquip ex ea commodo
                            consequat.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Duis aute irure dolor in reprehenderit in voluptate
                            velit
                          </span>
                          .
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in
                            voluptate trideta storacalaperda mastiro dolore eu
                            fugiat nulla pariatur.
                          </span>
                        </li>
                      </ul>
                      <p>
                        Ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate
                        velit esse cillum dolore eu fugiat nulla pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum
                      </p>
                    </div>
                    <div className="col-lg-6 order-1 order-lg-2 text-center">
                      <img src={working_1jpg} alt="" className="img-fluid" />
                    </div>
                  </div>
                </div>
                {/* <!-- End Tab Content Item --> */}

                <div className="tab-pane fade" id="features-tab-2">
                  <div className="row">
                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0">
                      <h3>
                        Neque exercitationem debitis soluta quos debitis quo
                        mollitia officia est
                      </h3>
                      <p>
                        Ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate
                        velit esse cillum dolore eu fugiat nulla pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum
                      </p>
                      <p className="fst-italic">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua.
                      </p>
                      <ul>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Ullamco laboris nisi ut aliquip ex ea commodo
                            consequat.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Duis aute irure dolor in reprehenderit in voluptate
                            velit.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Provident mollitia neque rerum asperiores dolores
                            quos qui a. Ipsum neque dolor voluptate nisi sed.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in
                            voluptate trideta storacalaperda mastiro dolore eu
                            fugiat nulla pariatur.
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="col-lg-6 order-1 order-lg-2 text-center">
                      <img src={working_2jpg} alt="" className="img-fluid" />
                    </div>
                  </div>
                </div>
                {/* <!-- End Tab Content Item --> */}

                <div className="tab-pane fade" id="features-tab-3">
                  <div className="row">
                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0">
                      <h3>
                        Voluptatibus commodi ut accusamus ea repudiandae ut
                        autem dolor ut assumenda
                      </h3>
                      <p>
                        Ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate
                        velit esse cillum dolore eu fugiat nulla pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum
                      </p>
                      <ul>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Ullamco laboris nisi ut aliquip ex ea commodo
                            consequat.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Duis aute irure dolor in reprehenderit in voluptate
                            velit.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Provident mollitia neque rerum asperiores dolores
                            quos qui a. Ipsum neque dolor voluptate nisi sed.
                          </span>
                        </li>
                      </ul>
                      <p className="fst-italic">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua.
                      </p>
                    </div>
                    <div className="col-lg-6 order-1 order-lg-2 text-center">
                      <img src={working_3jpg} alt="" className="img-fluid" />
                    </div>
                  </div>
                </div>
                {/* <!-- End Tab Content Item --> */}

                <div className="tab-pane fade" id="features-tab-4">
                  <div className="row">
                    <div className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0">
                      <h3>
                        Omnis fugiat ea explicabo sunt dolorum asperiores sequi
                        inventore rerum
                      </h3>
                      <p>
                        Ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate
                        velit esse cillum dolore eu fugiat nulla pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum
                      </p>
                      <p className="fst-italic">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua.
                      </p>
                      <ul>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Ullamco laboris nisi ut aliquip ex ea commodo
                            consequat.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Duis aute irure dolor in reprehenderit in voluptate
                            velit.
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-check2-all"></i>{" "}
                          <span>
                            Ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in
                            voluptate trideta storacalaperda mastiro dolore eu
                            fugiat nulla pariatur.
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="col-lg-6 order-1 order-lg-2 text-center">
                      <img src={working_4jpg} alt="" className="img-fluid" />
                    </div>
                  </div>
                </div>
                {/* <!-- End Tab Content Item --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Features Section --> */}

          {/* <!-- Services 2 Section --> */}
          <section
            id="services-2"
            className="services-2 section light-background"
          >
            {/* <!-- Section Title --> */}
            <div className="container section-title" data-aos="fade-up">
              <h2>Services</h2>
              <p>CHECK OUR SERVICES</p>
            </div>
            {/* <!-- End Section Title --> */}

            <div className="container">
              <div className="row gy-4">
                <div
                  className="col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  <div className="service-item d-flex position-relative h-100">
                    <i className="bi bi-briefcase icon flex-shrink-0"></i>
                    <div>
                      <h4 className="title">
                        <a href="#" className="stretched-link">
                          Lorem Ipsum
                        </a>
                      </h4>
                      <p className="description">
                        Voluptatum deleniti atque corrupti quos dolores et quas
                        molestias excepturi sint occaecati cupiditate non
                        provident
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}

                <div
                  className="col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  <div className="service-item d-flex position-relative h-100">
                    <i className="bi bi-card-checklist icon flex-shrink-0"></i>
                    <div>
                      <h4 className="title">
                        <a href="#" className="stretched-link">
                          Dolor Sitema
                        </a>
                      </h4>
                      <p className="description">
                        Minim veniam, quis nostrud exercitation ullamco laboris
                        nisi ut aliquip ex ea commodo consequat tarad limino ata
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}

                <div
                  className="col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="300"
                >
                  <div className="service-item d-flex position-relative h-100">
                    <i className="bi bi-bar-chart icon flex-shrink-0"></i>
                    <div>
                      <h4 className="title">
                        <a href="#" className="stretched-link">
                          Sed ut perspiciatis
                        </a>
                      </h4>
                      <p className="description">
                        Duis aute irure dolor in reprehenderit in voluptate
                        velit esse cillum dolore eu fugiat nulla pariatur
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}

                <div
                  className="col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="400"
                >
                  <div className="service-item d-flex position-relative h-100">
                    <i className="bi bi-binoculars icon flex-shrink-0"></i>
                    <div>
                      <h4 className="title">
                        <a href="#" className="stretched-link">
                          Magni Dolores
                        </a>
                      </h4>
                      <p className="description">
                        Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}

                <div
                  className="col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="500"
                >
                  <div className="service-item d-flex position-relative h-100">
                    <i className="bi bi-brightness-high icon flex-shrink-0"></i>
                    <div>
                      <h4 className="title">
                        <a href="#" className="stretched-link">
                          Nemo Enim
                        </a>
                      </h4>
                      <p className="description">
                        At vero eos et accusamus et iusto odio dignissimos
                        ducimus qui blanditiis praesentium voluptatum deleniti
                        atque
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}

                <div
                  className="col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="600"
                >
                  <div className="service-item d-flex position-relative h-100">
                    <i className="bi bi-calendar4-week icon flex-shrink-0"></i>
                    <div>
                      <h4 className="title">
                        <a href="#" className="stretched-link">
                          Eiusmod Tempor
                        </a>
                      </h4>
                      <p className="description">
                        Et harum quidem rerum facilis est et expedita
                        distinctio. Nam libero tempore, cum soluta nobis est
                        eligendi
                      </p>
                    </div>
                  </div>
                </div>
                {/* <!-- End Service Item --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Services 2 Section --> */}

          {/* <!-- Testimonials Section --> */}
          <section
            id="testimonials"
            className="testimonials section dark-background"
          >
            <img src={testimonialsjpg} className="testimonials-bg" alt="" />
            <div
              className="container"
              data-aos="fade-up"
              data-aos-delay="100"
            />
            <div className="swiper init-swiper">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <div className="testimonial-item">
                    <img
                      src={testimonials_1jpg}
                      className="testimonial-img"
                      alt=""
                    />
                    <h3>Saul Goodman</h3>
                    <h4>Ceo &amp; Founder</h4>
                    <div className="stars">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                    <p>
                      <i className="bi bi-quote quote-icon-left"></i>
                      <span>
                        Proin iaculis purus consequat sem cure digni ssim donec
                        porttitora entum suscipit rhoncus. Accusantium quam,
                        ultricies eget id, aliquam eget nibh et. Maecen aliquam,
                        risus at semper.
                      </span>
                      <i className="bi bi-quote quote-icon-right"></i>
                    </p>
                  </div>
                  {/* </div><!-- End testimonial item --> */}

                  <div className="swiper-slide">
                    <div className="testimonial-item">
                      <img
                        src={testimonials_2jpg}
                        className="testimonial-img"
                        alt=""
                      />
                      <h3>Sara Wilsson</h3>
                      <h4>Designer</h4>
                      <div className="stars">
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <p>
                        <i className="bi bi-quote quote-icon-left"></i>
                        <span>
                          Export tempor illum tamen malis malis eram quae irure
                          esse labore quem cillum quid cillum eram malis quorum
                          velit fore eram velit sunt aliqua noster fugiat irure
                          amet legam anim culpa.
                        </span>
                        <i className="bi bi-quote quote-icon-right"></i>
                      </p>
                    </div>
                  </div>
                  {/* <!-- End testimonial item --> */}

                  <div className="swiper-slide">
                    <div className="testimonial-item">
                      <img
                        src={testimonials_3jpg}
                        className="testimonial-img"
                        alt=""
                      />
                      <h3>Jena Karlis</h3>
                      <h4>Store Owner</h4>
                      <div className="stars">
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <p>
                        <i className="bi bi-quote quote-icon-left"></i>
                        <span>
                          Enim nisi quem export duis labore cillum quae magna
                          enim sint quorum nulla quem veniam duis minim tempor
                          labore quem eram duis noster aute amet eram fore quis
                          sint minim.
                        </span>
                        <i className="bi bi-quote quote-icon-right"></i>
                      </p>
                    </div>
                  </div>
                  {/* <!-- End testimonial item --> */}

                  <div className="swiper-slide">
                    <div className="testimonial-item">
                      <img
                        src={testimonials_4jpg}
                        className="testimonial-img"
                        alt=""
                      />
                      <h3>Matt Brandon</h3>
                      <h4>Freelancer</h4>
                      <div className="stars">
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <p>
                        <i className="bi bi-quote quote-icon-left"></i>
                        <span>
                          Fugiat enim eram quae cillum dolore dolor amet nulla
                          culpa multos export minim fugiat minim velit minim
                          dolor enim duis veniam ipsum anim magna sunt elit fore
                          quem dolore labore illum veniam.
                        </span>
                        <i className="bi bi-quote quote-icon-right"></i>
                      </p>
                    </div>
                  </div>
                  {/* <!-- End testimonial item --> */}

                  <div className="swiper-slide">
                    <div className="testimonial-item">
                      <img
                        src={testimonials_5jpg}
                        className="testimonial-img"
                        alt=""
                      />
                      <h3>John Larson</h3>
                      <h4>Entrepreneur</h4>
                      <div className="stars">
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <p>
                        <i className="bi bi-quote quote-icon-left"></i>
                        <span>
                          Quis quorum aliqua sint quem legam fore sunt eram
                          irure aliqua veniam tempor noster veniam enim culpa
                          labore duis sunt culpa nulla illum cillum fugiat legam
                          esse veniam culpa fore nisi cillum quid.
                        </span>
                        <i className="bi bi-quote quote-icon-right"></i>
                      </p>
                    </div>
                  </div>
                  {/* <!-- End testimonial item --> */}
                </div>
                <div className="swiper-pagination"></div>
              </div>
            </div>
          </section>
          {/* <!-- /Testimonials Section --> */}

          {/* <!-- Portfolio Section --> */}
          <section id="portfolio" className="portfolio section">
            {/* <!-- Section Title --> */}
            <div className="container section-title" data-aos="fade-up">
              <h2>Portfolio</h2>
              <p>CHECK OUR PORTFOLIO</p>
            </div>
            {/* <!-- End Section Title --> */}

            <div className="container">
              <div
                className="isotope-layout"
                data-default-filter="*"
                data-layout="masonry"
                data-sort="original-order"
              >
                <ul
                  className="portfolio-filters isotope-filters"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  <li data-filter="*" className="filter-active">
                    All
                  </li>
                  <li data-filter=".filter-app">App</li>
                  <li data-filter=".filter-product">Product</li>
                  <li data-filter=".filter-branding">Branding</li>
                  <li data-filter=".filter-books">Books</li>
                </ul>
                {/* <!-- End Portfolio Filters --> */}

                <div
                  className="row gy-4 isotope-container"
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-app">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_app_1jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>App 1</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_app_1jpg}
                          title="App 1"
                          data-gallery="portfolio-gallery-app"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-product">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_product1jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Product 1</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_product1jpg}
                          title="Product 1"
                          data-gallery="portfolio-gallery-product"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-branding">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_branding1jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Branding 1</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_branding2jpg}
                          title="Branding 1"
                          data-gallery="portfolio-gallery-branding"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-books">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfoliio_books1jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Books 1</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          // href={portfolio_books1jpg}
                          title="Branding 1"
                          data-gallery="portfolio-gallery-book"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-app">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_app_2jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>App 2</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_app_2jpg}
                          title="App 2"
                          data-gallery="portfolio-gallery-app"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-product">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_product2jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Product 2</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_product2jpg}
                          title="Product 2"
                          data-gallery="portfolio-gallery-product"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-branding">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_branding2jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Branding 2</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_branding2jpg}
                          title="Branding 2"
                          data-gallery="portfolio-gallery-branding"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-books">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfoliio_books2jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Books 2</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfoliio_books2jpg}
                          title="Branding 2"
                          data-gallery="portfolio-gallery-book"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-app">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_app_3jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>App 3</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_app_3jpg}
                          title="App 3"
                          data-gallery="portfolio-gallery-app"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-product">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_product3jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Product 3</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_product3jpg}
                          title="Product 3"
                          data-gallery="portfolio-gallery-product"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-branding">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfolio_branding3jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Branding 3</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfolio_branding3jpg}
                          title="Branding 2"
                          data-gallery="portfolio-gallery-branding"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}

                  <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-books">
                    <div className="portfolio-content h-100">
                      <img
                        src={portfoliio_books3jpg}
                        className="img-fluid"
                        alt=""
                      />
                      <div className="portfolio-info">
                        <h4>Books 3</h4>
                        <p>Lorem ipsum, dolor sit amet consectetur</p>
                        <a
                          href={portfoliio_books3jpg}
                          title="Branding 3"
                          data-gallery="portfolio-gallery-book"
                          className="glightbox preview-link"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </a>
                        <a
                          href="portfolio-details.html"
                          title="More Details"
                          className="details-link"
                        >
                          <i className="bi bi-link-45deg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Portfolio Item --> */}
                </div>
                {/* <!-- End Portfolio Container --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Portfolio Section --> */}

          {/* <!-- Team Section --> */}
          <section id="team" className="team section light-background">
            {/* <!-- Section Title --> */}
            <div className="container section-title" data-aos="fade-up">
              <h2>Team</h2>
              <p>CHECK OUR TEAM</p>
            </div>
            {/* <!-- End Section Title --> */}

            <div className="container">
              <div className="row gy-5">
                <div
                  className="col-lg-4 col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  <div className="member">
                    <div className="pic">
                      <img src={team1jpg} className="img-fluid" alt="" />
                    </div>
                    <div className="member-info">
                      <h4>Walter White</h4>
                      <span>Chief Executive Officer</span>
                      <div className="social">
                        <a href="">
                          <i className="bi bi-twitter-x"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-facebook"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-instagram"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-linkedin"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <!-- End Team Member --> */}

                <div
                  className="col-lg-4 col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  <div className="member">
                    <div className="pic">
                      <img src={team2jpg} className="img-fluid" alt="" />
                    </div>
                    <div className="member-info">
                      <h4>Sarah Jhonson</h4>
                      <span>Product Manager</span>
                      <div className="social">
                        <a href="">
                          <i className="bi bi-twitter-x"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-facebook"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-instagram"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-linkedin"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <!-- End Team Member --> */}

                <div
                  className="col-lg-4 col-md-6"
                  data-aos="fade-up"
                  data-aos-delay="300"
                >
                  <div className="member">
                    <div className="pic">
                      <img src={team3jpg} className="img-fluid" alt="" />
                    </div>
                    <div className="member-info">
                      <h4>William Anderson</h4>
                      <span>CTO</span>
                      <div className="social">
                        <a href="">
                          <i className="bi bi-twitter-x"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-facebook"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-instagram"></i>
                        </a>
                        <a href="">
                          <i className="bi bi-linkedin"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <!-- End Team Member --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Team Section --> */}

          {/* <!-- Contact Section --> */}
          <section id="contact" className="contact section">
            {/* <!-- Section Title --> */}
            <div className="container section-title" data-aos="fade-up">
              <h2>Contact</h2>
              <p>Necessitatibus eius consequatur</p>
            </div>
            {/* <!-- End Section Title --> */}

            <div className="container" data-aos="fade-up" data-aos-delay="100">
              <div className="row gy-4">
                <div className="col-lg-6 ">
                  <div className="row gy-4">
                    <div className="col-lg-12">
                      <div
                        className="info-item d-flex flex-column justify-content-center align-items-center"
                        data-aos="fade-up"
                        data-aos-delay="200"
                      >
                        <i className="bi bi-geo-alt"></i>
                        <h3>Address</h3>
                        <p>A108 Adam Street, New York, NY 535022</p>
                      </div>
                    </div>
                    {/* <!-- End Info Item --> */}

                    <div className="col-md-6">
                      <div
                        className="info-item d-flex flex-column justify-content-center align-items-center"
                        data-aos="fade-up"
                        data-aos-delay="300"
                      >
                        <i className="bi bi-telephone"></i>
                        <h3>Call Us</h3>
                        <p>+1 5589 55488 55</p>
                      </div>
                    </div>
                    {/* <!-- End Info Item --> */}

                    <div className="col-md-6">
                      <div
                        className="info-item d-flex flex-column justify-content-center align-items-center"
                        data-aos="fade-up"
                        data-aos-delay="400"
                      >
                        <i className="bi bi-envelope"></i>
                        <h3>Email Us</h3>
                        <p>info@example.com</p>
                      </div>
                    </div>
                    {/* <!-- End Info Item --> */}
                  </div>
                </div>

                <div className="col-lg-6">
                  <form
                    action="forms/contact.php"
                    method="post"
                    className="validate-email"
                    data-aos="fade-up"
                    data-aos-delay="500"
                  >
                    <div className="row gy-4">
                      <div className="col-md-6">
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          placeholder="Your Name"
                          required=""
                        />
                      </div>

                      <div className="col-md-6 ">
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          placeholder="Your Email"
                          required=""
                        />
                      </div>

                      <div className="col-md-12">
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          placeholder="Subject"
                          required=""
                        />
                      </div>

                      <div className="col-md-12">
                        <textarea
                          className="form-control"
                          name="message"
                          rows="4"
                          placeholder="Message"
                          required=""
                        ></textarea>
                      </div>

                      <div className="col-md-12 text-center">
                        <div className="loading">Loading</div>
                        <div className="error-message"></div>
                        <div className="sent-message">
                          Your message has been sent. Thank you!
                        </div>

                        <button type="submit">Send Message</button>
                      </div>
                    </div>
                  </form>
                </div>
                {/* <!-- End Contact Form --> */}
              </div>
            </div>
          </section>
          {/* <!-- /Contact Section --> */}
        </main>
        </div>
      </div>
    </>
  );
}

export default Home;
