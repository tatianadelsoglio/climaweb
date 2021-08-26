import React, {useState, useEffect} from 'react';
import Header from './components/Header';
import Formulario from './components/Formulario';
import Clima from './components/clima';


function App() {

  //defino state del formulario
  const [busqueda, guardarBusqueda] = useState({
    ciudad: '',
    pais: ''
  });

  //extraer ciudad y país
  const {ciudad, pais} = busqueda;

  const [consultar, guardarConsultar] = useState(false);

  const [resultado, guardarResultado] = useState({});

  useEffect(() => {
    
    const consultarAPI = async () => {

      if (consultar) {

        const appId = 'c11a5e2033f0f29d1b7944c7a5563668';
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${ciudad},${pais}&appid=${appId}`;
  
        const respuesta = await fetch(url);
        const resultado = await respuesta.json();
  
        guardarResultado(resultado);
        guardarConsultar(false);
      }
    }
    consultarAPI();

  }, [ciudad, pais, consultar]);

  return (
    <>
      <Header
        titulo='Clima React App'
      />
      <div className="contenedor-form">
        <div className="conteiner">
          <div className="row">
            <div className="col m6 s12">
              <Formulario
                busqueda={busqueda}
                guardarBusqueda={guardarBusqueda}
                guardarConsultar={guardarConsultar}
              />
            </div>
            <div className="col m6 s12">
              <Clima
                resultado={resultado}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
