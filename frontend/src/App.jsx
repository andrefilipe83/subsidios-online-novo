import React from "react";
import {Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import CreateSocio from './pages/CreateSocio';
import EditSocio from './pages/EditSocio';
import DeleteSocio from './pages/DeleteSocio';
import ShowSocio from './pages/ShowSocio';
import Home2 from './pages/Home2';
import ProcesAdse from './pages/ProcesAdse';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/socios/create" element={<CreateSocio />} />
      <Route path="/socios/edit/:id" element={<EditSocio />} />
      <Route path="/socios/delete/:id" element={<DeleteSocio />} />
      <Route path="/socios/show/:id" element={<ShowSocio />} />
      <Route path="/home2" element={<Home2 />} />
      <Route path="/procesadse" element={<ProcesAdse />} />
    </Routes>
  );
}

export default App;