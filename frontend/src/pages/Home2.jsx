import React from "react";

function DocumentBlock() {
  return (
    <div className="flex flex-col w-[58%] max-md:w-full max-md:ml-0">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/f7f94eebd7c37333a4ef53d030885597eb3e160645f9cc717db38033ff1ca339?apiKey=11c98c9684084f0c9861931750b6f2c6&"
        alt="Header Logo"
        className="shrink-0 max-w-full aspect-[1.33] w-[247px]"
        loading="lazy"
      />
    </div>
  );
}

function InfoBlock() {
  return (
    <div className="flex flex-col ml-5 w-[42%] max-md:ml-0 max-md:w-full">
      <div className="justify-center self-stretch px-4 py-5 my-auto w-48 text-2xl font-semibold text-white whitespace-nowrap bg-sky-500 rounded-xl max-md:mt-10">
        Documentos <br /> Informativos
      </div>
    </div>
  );
}

function LoginButton() {
  return (
    <div className="justify-center items-start px-14 py-8 my-auto text-2xl font-semibold text-white whitespace-nowrap bg-sky-500 rounded-xl max-md:px-5 cursor-pointer">
      Login
    </div>
  );
}

function FooterBlock() {
  return (
    <div className="flex gap-5 justify-between self-stretch mt-11 font-semibold max-md:flex-wrap max-md:mt-10 max-md:max-w-full">
      <div className="flex flex-col my-auto">
        <div className="text-xl">
          Serviços Sociais dos Trabalhadores <br /> do Município de Montemor-o-Novo
        </div>
        <div className="mt-5 text-sm">
          Telefone: +351 266 123 456 <br />
          E-mail: geral@exemplo.pt <br />
          Website: www.exemplo.pt
        </div>
      </div>
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/f7f94eebd7c37333a4ef53d030885597eb3e160645f9cc717db38033ff1ca339?apiKey=11c98c9684084f0c9861931750b6f2c6&"
        alt="Footer Logo"
        className="shrink-0 max-w-full aspect-[1.33] w-[247px]"
        loading="lazy"
      />
    </div>
  );
}

function Home2() {
  return (
    <div className="flex flex-col min-h-screen bg-white px-4 md:px-8 lg:px-16">
      <header className="flex justify-between items-center py-4 w-full">
        <DocumentBlock />
        <InfoBlock />
        <LoginButton />
      </header>
      <main className="flex flex-col items-center self-center mt-2.5 w-full text-black max-w-[1278px] max-md:max-w-full flex-grow">
        <h1 className="text-3xl font-bold max-md:max-w-full text-center">
          Sistema de Gestão de Subsídios e Comparticipações dos Serviços <br />
          Sociais dos Trabalhadores do Município de Montemor-o-Novo
        </h1>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/88849fe5462efd411235f3fefde61d1fae923abff4f4bf9622c2efc8374a76b8?apiKey=11c98c9684084f0c9861931750b6f2c6&"
          alt="Main Banner"
          className="mt-9 w-full border border-black border-solid shadow-sm aspect-[2.27] max-w-[1034px] max-md:max-w-full"
          loading="lazy"
        />
      </main>
      <footer className="py-4">
        <FooterBlock />
      </footer>
    </div>
  );
}

export default Home2;


/*import * as React from "react";


function DocumentBlock() {
  return (
    <div className="flex flex-col w-[58%] max-md:w-full max-md:ml-0">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/f7f94eebd7c37333a4ef53d030885597eb3e160645f9cc717db38033ff1ca339?apiKey=11c98c9684084f0c9861931750b6f2c6&"
        alt="Header Logo"
        className="shrink-0 max-w-full aspect-[1.33] w-[247px]"
        loading="lazy"
      />
    </div>
  );
}

function InfoBlock() {
  return (
    <div className="flex flex-col ml-5 w-[42%] max-md:ml-0 max-md:w-full">
      <div className="justify-center self-stretch px-4 py-5 my-auto w-48 text-2xl font-semibold text-white whitespace-nowrap bg-sky-500 rounded-xl max-md:mt-10">
        Documentos <br /> Informativos
      </div>
    </div>
  );
}

function LoginButton() {
  return (
    <div className="justify-center items-start px-14 py-8 my-auto text-2xl font-semibold text-white whitespace-nowrap bg-sky-500 rounded-xl max-md:px-5">
      Login
    </div>
  );
}

function FooterBlock() {
  return (
    <div className="flex gap-5 justify-between self-stretch mt-11 font-semibold max-md:flex-wrap max-md:mt-10 max-md:max-w-full">
      <div className="flex flex-col my-auto">
        <div className="text-xl">
          Serviços Sociais dos Trabalhadores <br /> do Município de Montemor-o-Novo
        </div>
        <div className="mt-5 text-sm">
          Telefone: +351 266 123 456 <br />
          E-mail: geral@exemplo.pt <br />
          Website: www.exemplo.pt
        </div>
      </div>
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/f7f94eebd7c37333a4ef53d030885597eb3e160645f9cc717db38033ff1ca339?apiKey=11c98c9684084f0c9861931750b6f2c6&"
        alt="Footer Logo"
        className="shrink-0 max-w-full aspect-[1.33] w-[247px] ml-auto"
        loading="lazy"
      />
    </div>
  );
}


function MyComponent() {
  return (
    <div className="flex flex-col py-7 pr-8 bg-white max-md:pr-5">
      <section className="flex gap-5 w-full max-md:flex-wrap max-md:pr-5 max-md:max-w-full">
        <div className="flex-auto max-md:max-w-full">
          <div className="flex gap-5 max-md:flex-col max-md:gap-0">
            <DocumentBlock />
            <InfoBlock />
          </div>
        </div>
        <LoginButton />
      </section>
      <main className="flex flex-col items-center self-center mt-2.5 w-full text-black max-w-[1278px] max-md:max-w-full">
        <h1 className="text-3xl font-bold max-md:max-w-full">
          Sistema de Gestão de Subsídios e Comparticipações dos Serviços <br />
          Sociais dos Trabalhadores do Muncípio de Montemor-o-Novo
        </h1>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/88849fe5462efd411235f3fefde61d1fae923abff4f4bf9622c2efc8374a76b8?apiKey=11c98c9684084f0c9861931750b6f2c6&"
          alt="Main Banner"
          className="mt-9 w-full border border-black border-solid shadow-sm aspect-[2.27] max-w-[1034px] max-md:max-w-full"
          loading="lazy"
        />
        <FooterBlock />
      </main>
    </div>
  );
}

export default MyComponent;*/