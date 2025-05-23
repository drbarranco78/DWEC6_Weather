
const APIKEY = '4J6CGHKLHSJXQW2UUKPY5KJ7N';

let inputCiudad = document.getElementById("inCiudad");
let btTiempoActual = document.getElementById("btTiempoActual");
let btPrevision = document.getElementById("btPrevision");
let ciudadSeleccionada = document.getElementById("ciudadSeleccionada");
let data;
let latitud;
let longitud;
let nombreLugar;
let ciudad;
let divMeteo = document.querySelector('.divMeteo');
let divMapa = document.querySelector('.divMapa');
let divPrevision = document.getElementById("divPrevision");
let contenedor;
let imagenNotFound;

/* Obtiene la ciudad y llama a un método u otro en función de si se ha pulsado el botón de la previsión a 10 días (prevision10=true) 
*  o el de tiempo actual (prevision10="") -> (si le pongo false lo incluye en la URL (¿?) y da error) 
* @param ciudad El nombre de la localidad introducida
* @param prevision10 variable booleana para indicar si se ha solicitado la previsión para 10 días
* 
*/
function obtenerLugar(ciudad, prevision10) {

  $(function () {

    // Borra la imagen que se muestra si no se encontraron resultados
    $('#imagenNotFound').remove();

    // Muestra el gif mientras se carga la página
    $("#ciudadSeleccionada").html("<img src='../img/ajax-loader1.gif'>");

    // Método ajax que recibe la URL de la consulta con el nombre de la ciudad. Se ordenan los resultados por población
    $.ajax({
      url: `http://geodb-free-service.wirefreethought.com/v1/geo/places?limit=10&offset=0&types=CITY&namePrefix=${ciudad}&languageCode=es&sort=-population`,
      type: "GET",
      dataType: "json",
      async: true,

      // Si se produce correctamente
      success: function (datos_devueltos) {

        // Quitamos el gif animado
        $("#ciudadSeleccionada").html("<br />");
        let localidadEnEspana = null;
        let localidadValida = null;

        // Itera sobre las localidades devueltas
        for (let i = 0; i < datos_devueltos.data.length; i++) {
          let localidad = datos_devueltos.data[i];
          if (localidad.countryCode === "ES") {
            // Si encontramos una localidad en España, guardamos sus datos y salimos del bucle
            localidadEnEspana = localidad;
            break;
          }
          if (!localidadValida) {
            // Guarda la primera localidad válida encontrada, sin importar el país
            localidadValida = localidad;
          }
        }

        // Si no se encontró ninguna localidad en España pero hay otra válida
        if (!localidadEnEspana && localidadValida) {
          localidadEnEspana = localidadValida;
        }

        // Si encontramos una localidad válida
        if (localidadEnEspana) {
          // Obtenemos sus datos
          latitud = localidadEnEspana.latitude;
          longitud = localidadEnEspana.longitude;
          nombreLugar = localidadEnEspana.name + ", " + localidadEnEspana.region + ", " + localidadEnEspana.country;

          // Llama al método en función del botón pulsado (Tiempo actual o Previsión 10 días)
          if (prevision10) {
            mostrarTiempo10Dias(latitud, longitud);
          } else {
            obtenerTiempoActual(latitud, longitud);
          }
        } else {

          // Si la localidad no es válida se ocultam los div de datos y el mapa
          divMeteo.style.display = "none";
          divMapa.style.display = "none";
          divPrevision.style.display = "none";
          ciudadSeleccionada.textContent = "No se encontraron resultados para la búsqueda";

          // Crea la imagen que se muestra con el error y la añade al contenedor principal
          imagenNotFound = document.createElement('img');
          imagenNotFound.src = "../img/notfound.png";
          imagenNotFound.id = "imagenNotFound";
          //imagenNotFound.style.transform = "translateX(80vh)";
          imagenNotFound.style.marginTop = "40px";
          imagenNotFound.style.gridArea = "divPrevision"
          contenedor = document.getElementById("contenedor");
          contenedor.appendChild(imagenNotFound);
        }

      },
      // Si la petición falla
      error: function (xhr, estado, error_producido) {
        console.warn("Error producido: " + error_producido);
        console.warn("Estado: " + estado);
      },
      //Tanto si falla como si funciona
      complete: function (xhr, estado) {
        console.log("Petición completa");
      }
    });

  });
}
/*
* Función para obtener datos del tiempo de una localidad en el dia actual
* 
* @param latitud Coordenada de la ubicación 
* @param longitud Coordenada de la ubicación 
*
*/
async function obtenerTiempoActual(latitud, longitud) {

  // Realiza la búsqueda del tiempo por las coordenadas recibidas de la API de GeoPlaces
  const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitud},${longitud}?unitGroup=metric&key=${APIKEY}`;
  let respuesta = await fetch(apiUrl);
  data = await respuesta.json();
  
  // Establece el nombre de la ciudad que se guardó en la consulta a la API de GeoPlaces
  ciudadSeleccionada.textContent = nombreLugar;

  // Obtiene la referencia del icono de estado y genera la ruta de la imagen
  let icono = data.currentConditions.icon;
  let rutaIcono = "../img/" + icono + ".svg";
  // Crea un elemento para la imagen del icono
  let imagenIcono = document.createElement('img');
  imagenIcono.className = "imagenIcono";
  imagenIcono.src = rutaIcono;

  // Vacía el contenido actual del contenedor divMeteo
  divMeteo.innerText = "";

  // Añade el icono al contenedor
  divMeteo.appendChild(imagenIcono);

  // Añade los datos meteorológicos 
  let temperaturaMinima = document.createElement('p');
  temperaturaMinima.textContent = "La temperatura mínima de hoy es: " + data.days[0].tempmin + " °C";
  divMeteo.appendChild(temperaturaMinima);

  divMeteo.innerHTML += "La temperatura máxima de hoy es: " + data.days[0].tempmax + " °C<br>";
  divMeteo.innerHTML += "Velocidad del viento: " + data.currentConditions.windspeed + " Km/h<br>";
  divMeteo.innerHTML += "Dirección del viento: " + data.currentConditions.winddir + " º<br>";

  // Dado que la API devuelve algunos datos null, se comprueba antes de mostrarlos
  if (data.currentConditions.precip == null || data.currentConditions.precip == 0) {
    divMeteo.innerHTML += "No está lloviendo<br>";
  } else {
    divMeteo.innerHTML += "Está lloviendo. Precipitaciones:  " + data.currentConditions.precip + " l/m²<br>";
    if (data.currentConditions.preciptype !== null) {
      divMeteo.innerHTML += "Tipo de lluvia: " + data.currentConditions.preciptype + "<br>";
    }
  }
  if (data.currentConditions.visibility !== null) {
    divMeteo.innerHTML += "Visibilidad: " + data.currentConditions.visibility + " Km<br>";
  }
  divMeteo.innerHTML += "Estaciones meteorológicas: ";
  const estaciones = Object.values(data.stations);
  estaciones.forEach((station, index) => {
    divMeteo.innerHTML += station.id;

    // Evita agregar la coma después del último elemento
    if (index < estaciones.length - 1) {
      divMeteo.innerHTML += ", ";
    }
  });

  // Llama a la función para mostrar el mapa pasándole las coordenadas
  mostrarMapa(data.latitude, data.longitude);
  return true;
};

/*
* Función para mostrar la previsión apara 10 días
* @param latitud Coordenada de la ubicación 
* @param longitud Coordenada de la ubicación 
*
*/
async function mostrarTiempo10Dias(latitud, longitud) {
  // Borra el contenido anterior del contenedor de previsión
  document.querySelector('#divPrevision').innerHTML = '';

  // Construye la URL para la solicitud de tiempo con la latitud y longitud proporcionadas
  const urlLatLng = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitud},${longitud}?unitGroup=metric&key=${APIKEY}`;

  // Recibe la respuesta asíncrona 
  let respuesta = await fetch(urlLatLng);
  data = await respuesta.json();

  // Establece el nombre de la ciudad que se guardó en la consulta a la API de GeoPlaces
  ciudadSeleccionada.textContent = nombreLugar;

  // Bucle para mostrar la información de 10 días 
  for (let i = 0; i < 10; i++) {

    // Crea un contenedor para la ficha del día y le asigna clase
    let fichaDia = document.createElement('div');
    fichaDia.className = "fichaDia";

    // Crea la imagen que muestra el icono en cada ficha 
    let imagenIcono = document.createElement('img');
    let icono = data.days[i].hours[11].icon;
    let rutaIcono = "../img/" + icono + ".svg";
    imagenIcono.src = rutaIcono;
    imagenIcono.className = "iconoFicha";

    // Crea los elementos para mostrar la fecha, hora y temperaturas y le asigna los datos recibidos 
    let fecha = document.createElement('h3');

    // Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
    let hoy = new Date().toISOString();

    // Compara la fecha actual con la fecha que estás procesando
    //if (hoy === data.days[i].datetime) {
    if (hoy.includes(data.days[i].datetime)) {
      fecha.textContent = "Hoy: " + data.days[i].datetime;

      // Cambia el color del borde de la ficha para el dia actual
      fichaDia.style.borderColor = "red";
    } else {
      fecha.textContent = data.days[i].datetime;
    }

    let hora = document.createElement('h4');
    hora.textContent = data.days[i].hours[11].datetime;

    let temp = document.createElement('h1');
    temp.textContent = data.days[i].temp + " ºC";
    temp.style.marginBottom = "0";

    let tempmin = document.createElement('h2');
    let tempmax = document.createElement('h2');

    tempmin.textContent = "Min: " + data.days[i].tempmin + "ºC";
    tempmax.textContent = "Max: " + data.days[i].tempmax + "ºC";

    // Añade los datos a cada div de ficha 

    fichaDia.appendChild(fecha);
    fichaDia.appendChild(hora);
    fichaDia.appendChild(temp);

    fichaDia.appendChild(imagenIcono);
    fichaDia.appendChild(tempmin);
    fichaDia.appendChild(tempmax);

    // Añade las fichas al contenedor 
    divPrevision.appendChild(fichaDia);

  }
}

/*
* Función para mostrar en un mapa la ubicación según las coordenadas recibidas
* @param latitud Coordenada de la ubicación 
* @param longitud Coordenada de la ubicación 
*
*/
function mostrarMapa(latitud, longitud) {

  // Crea el IFrame donde se insertará el mapa 
  let iframe = document.createElement('iframe');

  // Configura los atributos del iframe
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitud - 0.01},${latitud - 0.01},${longitud + 0.01},${latitud + 0.01}&layer=mapnik`;

  // Limpia el contenido anterior del div e inserta el iFrame con el mapa
  divMapa.innerHTML = '';
  divMapa.appendChild(iframe);
}

// Listener para el botón que muestra los datos del tiempo actual
btTiempoActual.addEventListener("click", function () {

  // Obtiene la ciudad que se haya introducido en el input 
  ciudad = document.getElementById('inCiudad').value;

  // Comprueba que la ciudad no sea una cadena vacía
  if (ciudad !== "") {
    // Oculta el contenedor de provisión a 10 días y muestra los de datos y mapa
    document.getElementById("divMeteo").style.display = "block";
    document.getElementById("divMapa").style.display = "block";
    document.getElementById("divPrevision").style.display = "none";

    // Llama a la función obtenerLugar  
    obtenerLugar(ciudad, "");
  }
});

// Listener para el botón de previsión a 10 días
btPrevision.addEventListener("click", function () {

  // Obtiene la ciudad que se haya introducido en el input 
  ciudad = document.getElementById('inCiudad').value;
  if (ciudad !== "") {
    // Muestra el contenedor de previsión a 10 días y oculta los demás 
    document.getElementById("divMeteo").style.display = "none";
    document.getElementById("divMapa").style.display = "none";
    document.getElementById("divPrevision").style.display = "flex";

    /* Envía la ciudad a la función obtenerLugar,
    true para indicar que se pide una previsión de 10 días */
    obtenerLugar(ciudad, true);
  }

});
