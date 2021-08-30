import React, {useState, useEffect} from 'react';
import Header from './components/Header';
import Formulario from './components/Formulario';
import Clima from './components/clima';
import Error from './components/Error';

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

  const [error, guardarError] = useState(false);

  useEffect(() => {
    
    const consultarAPI = async () => {

      if (consultar) {

        const appId = 'f51866455e5f338819bf3743a81013d8';
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${ciudad},${pais}&appid=${appId}`;
  
        const respuesta = await fetch(url);
        const resultado = await respuesta.json();
  
        guardarResultado(resultado);
        guardarConsultar(false);

        //Detecta si hay error
        if(resultado.cod === "404"){
          guardarError(true);
        } else {
          guardarError(false);
        }
      }
    }
    consultarAPI();

  }, [ciudad, pais, consultar]);

  let componente;
  if (error) {
    componente = <Error mensaje="No hay resultado" />
  } else {
    componente = <Clima
                    resultado = {resultado}
                  />
  }

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
              {componente}
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
