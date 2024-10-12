import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import Home2 from './pages/Home2.jsx'
import ProcesAdse from './pages/ProcesAdse.jsx'
import {BrowserRouter} from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)

ReactDOM.render(
  <React.StrictMode>
    <Home2 />
  </React.StrictMode>,
  document.getElementById("root")
);

ReactDOM.render(
  <React.StrictMode>
    <ProcesAdse />
  </React.StrictMode>,
  document.getElementById("root")
);