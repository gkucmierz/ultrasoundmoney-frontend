import * as React from "react";
import EthLogo from "../../assets/ethereum-logo-2014-5.svg";
// import Timeline from "./timeline";
import { TranslationsContext } from "../../translations-context";
const BeforeGenesis: React.FC<{}> = () => {
  const t = React.useContext(TranslationsContext);
  return (
    <>
      <section data-aos="fade-up" id="before-genesis">
        <div className="flex flex-col justify-center w-full lg:w-6/12 md:m-auto px-16 md:px-8 lg:px-0">
          <img
            className="text-center mx-auto mb-8"
            width="30"
            height="48"
            src={EthLogo}
            alt="ultra sound money"
          />
          <h1 className="text-white font-light text-base md:text-3xl leading-normal text-center mb-6 leading-title font-inter">
            {t.landing_before_genesis_title}
          </h1>
          <p className="text-blue-shipcove font-light text-sm text-center mb-10 font-inter">
            {t.landing_before_genesis_text}
          </p>
        </div>
        {/* <Timeline /> */}
      </section>
    </>
  );
};

export default BeforeGenesis;