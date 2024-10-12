import React, { useState } from 'react';
import axios from 'axios';
import './ProcesAdse.css';

// *** Código para obter o adse_ss_comp dado um adse_codigo ***
// Função para obter o adse_ss_comp dado um adse_codigo
const getAdseSSComp = async (adse_codigo) => {
  try {
      const response = await axios.get(`http://localhost:5555/adse/sscomp/${adse_codigo}`);
      // imprimir o valor recolhido
      console.log('adse_ss_comp recolhido da BD:', response.data.adse_ss_comp);
      return response.data.adse_ss_comp;
  } catch (error) {
      console.error('Error getting adse_ss_comp:', error);
  }
}
// *** Código para obter o adse_ss_comp dado um adse_codigo ***


function CardSection({ title, items }) {
  return (
    <section className="flex gap-5 justify-between self-stretch px-5 my-auto text-3xl font-semibold text-center text-white whitespace-nowrap max-md:flex-wrap max-md:mt-10">
      {items.map((item, index) => (
        <div key={index} className="justify-center px-2 py-3 bg-sky-500 rounded-xl">
          {item}
        </div>
      ))}
    </section>
  );
}

function InfoSection({ label, name, value, onChange }) {
  return (
    <div className="flex gap-2">
      <label className="grow my-auto text-base text-black">{label}</label>
      <input
        className="shrink-0 bg-zinc-300 h-[61px] w-[174px]"
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function MainForm() {
  const [formData, setFormData] = useState({
    nr_registo: '',
    data_registo: '',
    login: '',
    socio_nr: '', 
    familiar: '',
    nr_documento: '',
    data_doc: '',
    valor_total: '',
    adse_codigo: '', // Ajustado para corresponder ao modelo
    sscomp_cod: '', // inicialmente vazio // Acrescentado por mim CS
    valor_unit: '',
    quantidade: '',
    reembolso: '',
    pago: false,
    data_pagamento: ''
  });

  
  // tratar do sscomp_cod
  const [sscomp_cod, setSSCompCod] = useState('');
  
  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Se o adse_codigo mudar, obter o novo sscomp_cod
    if (name === 'adse_codigo') {
      const newSSCompCod = await getAdseSSComp(value);
      setSSCompCod(newSSCompCod);
    }

  };




  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const adse_ss_comp = await getAdseSSComp(formData.adse_codigo);
      console.log('adse_ss_comp recolhido pela função:', adse_ss_comp); //log de verificação
      const data = { ...formData, sscomp_cod };
      const response = await axios.post('http://localhost:5555/adse/processamento', data); // Certifique-se de que a URL esteja correta
      console.log('Response:', response.data);
      alert('Processamento guardado com sucesso!');

      // Atualiza o valor do reembolso no estado formData
      setFormData({
        ...formData,
        reembolso: response.data.valor_reembolso
      });

    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao guardar o processamento!');
    }
  };

  return (
    <form
      className="flex flex-col items-center self-stretch pr-16 pl-5 mt-12 w-full font-bold text-black max-md:px-5 max-md:mt-10 max-md:max-w-full"
      aria-label="Processing form"
      onSubmit={handleSubmit}
    >
      <section className="flex gap-5 justify-between w-full text-xl max-w-[1041px] max-md:flex-wrap max-md:max-w-full">
        <InfoSection label="Nr. registo:" name="nr_registo" value={formData.nr_registo} onChange={handleChange} />
        <InfoSection label="Data registo:" name="data_registo" value={formData.data_registo} onChange={handleChange} />
        <InfoSection label="Login:" name="login" value={formData.login} onChange={handleChange} />
      </section>
      <div className="flex gap-5 mt-6 ml-0 text-xl max-md:flex-wrap">
        <label className="grow my-auto">Nr. Sócio:</label>
        <input className="shrink-0 bg-white border border-black border-solid h-[61px] w-[174px]" name="socio_nr" value={formData.socio_nr} onChange={handleChange} />
        <input className="shrink-0 max-w-full bg-zinc-300 h-[61px] w-[705px]" name="familiar" value={formData.familiar} onChange={handleChange} />
      </div>
      <div className="flex gap-5 mt-5 ml-0 text-xl whitespace-nowrap max-md:flex-wrap">
        <label className="grow my-auto">Familiar:</label>
        <input className="shrink-0 bg-white border border-black border-solid h-[61px] w-[174px]" name="familiar" value={formData.familiar} onChange={handleChange} />
        <input className="shrink-0 max-w-full bg-zinc-300 h-[61px] w-[705px]" name="nr_documento" value={formData.nr_documento} onChange={handleChange} />
      </div>
      <div className="shrink-0 self-end mt-6 max-w-full h-5 w-[1316px]"></div>
      <section className="flex gap-5 justify-between self-stretch mt-5 w-full text-xl max-md:flex-wrap max-md:max-w-full">
        <InfoSection label="Nr. documento:" name="nr_documento" value={formData.nr_documento} onChange={handleChange} />
        <InfoSection label="Data doc:" name="data_doc" value={formData.data_doc} onChange={handleChange} />
        <InfoSection label="Valor total:" name="valor_total" value={formData.valor_total} onChange={handleChange} />
      </section>
      <div className="flex gap-5 mt-7 ml-0 text-xl max-md:flex-wrap">
        <label className="grow my-auto">Cód. ADSE:</label>
        <input className="shrink-0 bg-white border border-black border-solid h-[61px] w-[174px]" name="adse_codigo" value={formData.adse_codigo} onChange={handleChange} />
        <input className="shrink-0 max-w-full bg-zinc-300 h-[61px] w-[705px]" name="valor_unit" value={formData.valor_unit} onChange={handleChange} />
      </div>
      <section className="flex gap-5 justify-between mt-6 w-full text-xl max-w-[1041px] max-md:flex-wrap max-md:max-w-full">
        <InfoSection label="Valor unit.:" name="valor_unit" value={formData.valor_unit} onChange={handleChange} />
        <InfoSection label="Quantidade:" name="quantidade" value={formData.quantidade} onChange={handleChange} />
        <InfoSection label="Reembolso:" name="reembolso" value={formData.reembolso} onChange={handleChange} />
      </section>
      <div className="shrink-0 self-end mt-8 max-w-full h-5 w-[1316px]"></div>
      <section className="flex gap-5 mt-5 max-w-full text-xl w-[683px] max-md:flex-wrap">
        <InfoSection label="Pago?" name="pago" value={formData.pago} onChange={handleChange} />
        <InfoSection label="Data de pagamento:" name="data_pagamento" value={formData.data_pagamento} onChange={handleChange} />
      </section>
      <div className="flex gap-5 justify-between mt-11 text-xl text-center text-white whitespace-nowrap max-md:flex-wrap max-md:mt-10">
        <button type="submit" className="justify-center px-8 py-7 bg-sky-500 rounded-xl max-md:px-5"> Guardar </button>
        <button type="button" className="justify-center px-5 py-3.5 bg-sky-500 rounded-xl">
          Novo <br /> processamento
        </button>
        <button type="button" className="justify-center px-6 py-6 bg-sky-500 rounded-xl max-md:px-5"> Pesquisar </button>
        <button type="button" className="justify-center px-8 py-7 bg-sky-500 rounded-xl max-md:px-5"> Eliminar </button>
      </div>
    </form>
  );
}

function MyComponent() {
  return (
    <div className="flex flex-col items-center py-6 bg-white">
      <header className="w-full max-w-[1412px] max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col max-md:gap-0">
          <div className="flex flex-col w-[78%] max-md:ml-0 max-md:w-full">
            <div className="grow max-md:mt-7 max-md:max-w-full">
              <div className="flex gap-5 max-md:flex-col max-md:gap-0">
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/89d6d77b8a37c4371d5051f9adb954f4312e10fa15365658433a1a6254503692?apiKey=11c98c9684084f0c9861931750b6f2c6&"
                  className="grow shrink-0 max-w-full aspect-[1.33] w-[200px] max-md:mt-3"
                  alt=""
                />
                <CardSection title="Card Section" items={['Sócios', 'Processamentos', 'Pagamentos', 'Relatórios']} />
              </div>
            </div>
          </div>
          <div className="flex flex-col ml-5 w-[22%] max-md:ml-0 max-md:w-full">
            <div className="flex gap-2.5 self-stretch px-5 my-auto font-semibold max-md:mt-10">
              <div className="grow my-auto text-base text-black"> Olá, USERNAME </div>
              <button className="justify-center items-start px-14 py-9 text-2xl text-white whitespace-nowrap bg-sky-500 rounded-xl max-md:px-5"> Menu </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mt-8 text-3xl font-bold text-black"> Processamento ADSE </main>
      <MainForm />
      <footer className="flex gap-5 justify-between items-start mt-20 w-full font-semibold max-w-[1231px] max-md:flex-wrap max-md:mt-10 max-md:max-w-full">
        <div className="flex flex-col self-end mt-12 max-md:mt-10">
          <div className="text-xl">
            Serviços Sociais dos Trabalhadores <br /> do Município de Montemor-o-Novo
          </div>
          <div className="mt-5 text-sm"> Telefone: +351 266 123 456 E-mail: geral@exemplo.pt Website: www.exemplo.pt </div>
        </div>
        <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/89d6d77b8a37c4371d5051f9adb954f4312e10fa15365658433a1a6254503692?apiKey=11c98c9684084f0c9861931750b6f2c6&" className="shrink-0 self-start max-w-full aspect-[1.33] w-[200px]" alt="" />
      </footer>
    </div>
  );
}

export default MyComponent;

