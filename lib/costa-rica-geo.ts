export interface Distrito { codigo: string; nombre: string }
export interface Canton { codigo: string; nombre: string; distritos: Distrito[] }
export interface Provincia { codigo: string; nombre: string; cantones: Canton[] }

export const PROVINCIAS: Provincia[] = [
  {
    codigo: "1", nombre: "San José",
    cantones: [
      { codigo: "101", nombre: "San José", distritos: [
        { codigo: "10101", nombre: "Carmen" }, { codigo: "10102", nombre: "Merced" },
        { codigo: "10103", nombre: "Hospital" }, { codigo: "10104", nombre: "Catedral" },
        { codigo: "10105", nombre: "Zapote" }, { codigo: "10106", nombre: "San Francisco de Dos Ríos" },
        { codigo: "10107", nombre: "Uruca" }, { codigo: "10108", nombre: "Mata Redonda" },
        { codigo: "10109", nombre: "Pavas" }, { codigo: "10110", nombre: "Hatillo" },
        { codigo: "10111", nombre: "San Sebastián" },
      ]},
      { codigo: "102", nombre: "Escazú", distritos: [
        { codigo: "10201", nombre: "Escazú" }, { codigo: "10202", nombre: "San Antonio" },
        { codigo: "10203", nombre: "San Rafael" },
      ]},
      { codigo: "103", nombre: "Desamparados", distritos: [
        { codigo: "10301", nombre: "Desamparados" }, { codigo: "10302", nombre: "San Miguel" },
        { codigo: "10303", nombre: "San Juan de Dios" }, { codigo: "10304", nombre: "San Rafael Arriba" },
        { codigo: "10305", nombre: "San Antonio" }, { codigo: "10306", nombre: "Frailes" },
        { codigo: "10307", nombre: "Patarrá" }, { codigo: "10308", nombre: "San Cristóbal" },
        { codigo: "10309", nombre: "Rosario" }, { codigo: "10310", nombre: "Damas" },
        { codigo: "10311", nombre: "San Rafael Abajo" }, { codigo: "10312", nombre: "Gravilias" },
        { codigo: "10313", nombre: "Los Guido" },
      ]},
      { codigo: "104", nombre: "Puriscal", distritos: [
        { codigo: "10401", nombre: "Santiago" }, { codigo: "10402", nombre: "Mercedes Sur" },
        { codigo: "10403", nombre: "Barbacoas" }, { codigo: "10404", nombre: "Grifo Alto" },
        { codigo: "10405", nombre: "San Rafael" }, { codigo: "10406", nombre: "Candelarita" },
        { codigo: "10407", nombre: "Desamparaditos" }, { codigo: "10408", nombre: "San Antonio" },
        { codigo: "10409", nombre: "Chires" },
      ]},
      { codigo: "105", nombre: "Tarrazú", distritos: [
        { codigo: "10501", nombre: "San Marcos" }, { codigo: "10502", nombre: "San Lorenzo" },
        { codigo: "10503", nombre: "San Carlos" },
      ]},
      { codigo: "106", nombre: "Aserrí", distritos: [
        { codigo: "10601", nombre: "Aserrí" }, { codigo: "10602", nombre: "Tarbaca" },
        { codigo: "10603", nombre: "Vuelta de Jorco" }, { codigo: "10604", nombre: "San Gabriel" },
        { codigo: "10605", nombre: "Legua" }, { codigo: "10606", nombre: "Monterrey" },
        { codigo: "10607", nombre: "Salitrillos" },
      ]},
      { codigo: "107", nombre: "Mora", distritos: [
        { codigo: "10701", nombre: "Colón" }, { codigo: "10702", nombre: "Guayabo" },
        { codigo: "10703", nombre: "Tabarcia" }, { codigo: "10704", nombre: "Piedras Negras" },
        { codigo: "10705", nombre: "Picagres" }, { codigo: "10706", nombre: "Jaris" },
        { codigo: "10707", nombre: "Quitirrisí" },
      ]},
      { codigo: "108", nombre: "Goicoechea", distritos: [
        { codigo: "10801", nombre: "Guadalupe" }, { codigo: "10802", nombre: "San Francisco" },
        { codigo: "10803", nombre: "Calle Blancos" }, { codigo: "10804", nombre: "Mata de Plátano" },
        { codigo: "10805", nombre: "Ipís" }, { codigo: "10806", nombre: "Rancho Redondo" },
        { codigo: "10807", nombre: "Purral" },
      ]},
      { codigo: "109", nombre: "Santa Ana", distritos: [
        { codigo: "10901", nombre: "Santa Ana" }, { codigo: "10902", nombre: "Salitral" },
        { codigo: "10903", nombre: "Pozos" }, { codigo: "10904", nombre: "Uruca" },
        { codigo: "10905", nombre: "Piedades" }, { codigo: "10906", nombre: "Brasil" },
      ]},
      { codigo: "110", nombre: "Alajuelita", distritos: [
        { codigo: "11001", nombre: "Alajuelita" }, { codigo: "11002", nombre: "San Josecito" },
        { codigo: "11003", nombre: "San Antonio" }, { codigo: "11004", nombre: "Concepción" },
        { codigo: "11005", nombre: "San Felipe" },
      ]},
      { codigo: "111", nombre: "Vásquez de Coronado", distritos: [
        { codigo: "11101", nombre: "San Isidro" }, { codigo: "11102", nombre: "San Rafael" },
        { codigo: "11103", nombre: "Dulce Nombre de Jesús" }, { codigo: "11104", nombre: "Patalillo" },
        { codigo: "11105", nombre: "Cascajal" },
      ]},
      { codigo: "112", nombre: "Acosta", distritos: [
        { codigo: "11201", nombre: "San Ignacio" }, { codigo: "11202", nombre: "Guaitil" },
        { codigo: "11203", nombre: "Palmichal" }, { codigo: "11204", nombre: "Cangrejal" },
        { codigo: "11205", nombre: "Sabanillas" },
      ]},
      { codigo: "113", nombre: "Tibás", distritos: [
        { codigo: "11301", nombre: "San Juan" }, { codigo: "11302", nombre: "Cinco Esquinas" },
        { codigo: "11303", nombre: "Anselmo Llorente" }, { codigo: "11304", nombre: "León XIII" },
        { codigo: "11305", nombre: "Colima" },
      ]},
      { codigo: "114", nombre: "Moravia", distritos: [
        { codigo: "11401", nombre: "San Vicente" }, { codigo: "11402", nombre: "San Jerónimo" },
        { codigo: "11403", nombre: "La Trinidad" },
      ]},
      { codigo: "115", nombre: "Montes de Oca", distritos: [
        { codigo: "11501", nombre: "San Pedro" }, { codigo: "11502", nombre: "Sabanilla" },
        { codigo: "11503", nombre: "Mercedes" }, { codigo: "11504", nombre: "San Rafael" },
      ]},
      { codigo: "116", nombre: "Turrubares", distritos: [
        { codigo: "11601", nombre: "San Pablo" }, { codigo: "11602", nombre: "San Pedro" },
        { codigo: "11603", nombre: "San Juan de Mata" }, { codigo: "11604", nombre: "San Luis" },
        { codigo: "11605", nombre: "Carara" },
      ]},
      { codigo: "117", nombre: "Dota", distritos: [
        { codigo: "11701", nombre: "Santa María" }, { codigo: "11702", nombre: "Jardín" },
        { codigo: "11703", nombre: "Copey" },
      ]},
      { codigo: "118", nombre: "Curridabat", distritos: [
        { codigo: "11801", nombre: "Curridabat" }, { codigo: "11802", nombre: "Granadilla" },
        { codigo: "11803", nombre: "Sánchez" }, { codigo: "11804", nombre: "Tirrases" },
      ]},
      { codigo: "119", nombre: "Pérez Zeledón", distritos: [
        { codigo: "11901", nombre: "San Isidro de El General" }, { codigo: "11902", nombre: "El General" },
        { codigo: "11903", nombre: "Daniel Flores" }, { codigo: "11904", nombre: "Rivas" },
        { codigo: "11905", nombre: "San Pedro" }, { codigo: "11906", nombre: "Platanares" },
        { codigo: "11907", nombre: "Pejibaye" }, { codigo: "11908", nombre: "Cajón" },
        { codigo: "11909", nombre: "Barú" }, { codigo: "11910", nombre: "Río Nuevo" },
        { codigo: "11911", nombre: "Páramo" }, { codigo: "11912", nombre: "La Amistad" },
      ]},
      { codigo: "120", nombre: "León Cortés Castro", distritos: [
        { codigo: "12001", nombre: "San Pablo" }, { codigo: "12002", nombre: "San Andrés" },
        { codigo: "12003", nombre: "Llano Bonito" }, { codigo: "12004", nombre: "San Isidro" },
        { codigo: "12005", nombre: "Santa Cruz" }, { codigo: "12006", nombre: "San Antonio" },
      ]},
    ],
  },
  {
    codigo: "2", nombre: "Alajuela",
    cantones: [
      { codigo: "201", nombre: "Alajuela", distritos: [
        { codigo: "20101", nombre: "Alajuela" }, { codigo: "20102", nombre: "San José" },
        { codigo: "20103", nombre: "Carrizal" }, { codigo: "20104", nombre: "San Antonio" },
        { codigo: "20105", nombre: "Guácima" }, { codigo: "20106", nombre: "San Isidro" },
        { codigo: "20107", nombre: "Sabanilla" }, { codigo: "20108", nombre: "San Rafael" },
        { codigo: "20109", nombre: "Río Segundo" }, { codigo: "20110", nombre: "Desamparados" },
        { codigo: "20111", nombre: "Turrúcares" }, { codigo: "20112", nombre: "Tambor" },
        { codigo: "20113", nombre: "Garita" }, { codigo: "20114", nombre: "Sarapiquí" },
      ]},
      { codigo: "202", nombre: "San Ramón", distritos: [
        { codigo: "20201", nombre: "San Ramón" }, { codigo: "20202", nombre: "Santiago" },
        { codigo: "20203", nombre: "San Juan" }, { codigo: "20204", nombre: "Piedades Norte" },
        { codigo: "20205", nombre: "Piedades Sur" }, { codigo: "20206", nombre: "San Rafael" },
        { codigo: "20207", nombre: "San Isidro" }, { codigo: "20208", nombre: "Angeles" },
        { codigo: "20209", nombre: "Alfaro" }, { codigo: "20210", nombre: "Volio" },
        { codigo: "20211", nombre: "Concepción" }, { codigo: "20212", nombre: "Zapotal" },
        { codigo: "20213", nombre: "Peñas Blancas" }, { codigo: "20214", nombre: "San Lorenzo" },
      ]},
      { codigo: "203", nombre: "Grecia", distritos: [
        { codigo: "20301", nombre: "Grecia" }, { codigo: "20302", nombre: "San Isidro" },
        { codigo: "20303", nombre: "San José" }, { codigo: "20304", nombre: "San Roque" },
        { codigo: "20305", nombre: "Tacares" }, { codigo: "20306", nombre: "Río Cuarto" },
        { codigo: "20307", nombre: "Puente de Piedra" }, { codigo: "20308", nombre: "Bolívar" },
      ]},
      { codigo: "204", nombre: "San Mateo", distritos: [
        { codigo: "20401", nombre: "San Mateo" }, { codigo: "20402", nombre: "Desmonte" },
        { codigo: "20403", nombre: "Jesús María" }, { codigo: "20404", nombre: "Labrador" },
      ]},
      { codigo: "205", nombre: "Atenas", distritos: [
        { codigo: "20501", nombre: "Atenas" }, { codigo: "20502", nombre: "Jesús" },
        { codigo: "20503", nombre: "Mercedes" }, { codigo: "20504", nombre: "San Isidro" },
        { codigo: "20505", nombre: "Concepción" }, { codigo: "20506", nombre: "San José" },
        { codigo: "20507", nombre: "Santa Eulalia" }, { codigo: "20508", nombre: "Escobal" },
      ]},
      { codigo: "206", nombre: "Naranjo", distritos: [
        { codigo: "20601", nombre: "Naranjo" }, { codigo: "20602", nombre: "San Miguel" },
        { codigo: "20603", nombre: "San José" }, { codigo: "20604", nombre: "Cirrí Sur" },
        { codigo: "20605", nombre: "San Jerónimo" }, { codigo: "20606", nombre: "San Juan" },
        { codigo: "20607", nombre: "El Rosario" }, { codigo: "20608", nombre: "Palmito" },
      ]},
      { codigo: "207", nombre: "Palmares", distritos: [
        { codigo: "20701", nombre: "Palmares" }, { codigo: "20702", nombre: "Zaragoza" },
        { codigo: "20703", nombre: "Buenos Aires" }, { codigo: "20704", nombre: "Santiago" },
        { codigo: "20705", nombre: "Candelaria" }, { codigo: "20706", nombre: "Esquipulas" },
        { codigo: "20707", nombre: "La Granja" },
      ]},
      { codigo: "208", nombre: "Poás", distritos: [
        { codigo: "20801", nombre: "San Juan" }, { codigo: "20802", nombre: "San Luis" },
        { codigo: "20803", nombre: "San Pedro" }, { codigo: "20804", nombre: "San Juan" },
        { codigo: "20805", nombre: "Carrillos" }, { codigo: "20806", nombre: "Sabana Redonda" },
      ]},
      { codigo: "209", nombre: "Orotina", distritos: [
        { codigo: "20901", nombre: "Orotina" }, { codigo: "20902", nombre: "El Mastate" },
        { codigo: "20903", nombre: "Hacienda Vieja" }, { codigo: "20904", nombre: "Coyolar" },
        { codigo: "20905", nombre: "La Ceiba" },
      ]},
      { codigo: "210", nombre: "San Carlos", distritos: [
        { codigo: "21001", nombre: "Ciudad Quesada" }, { codigo: "21002", nombre: "Florencia" },
        { codigo: "21003", nombre: "Buenavista" }, { codigo: "21004", nombre: "Aguas Zarcas" },
        { codigo: "21005", nombre: "Venecia" }, { codigo: "21006", nombre: "Pital" },
        { codigo: "21007", nombre: "La Fortuna" }, { codigo: "21008", nombre: "La Tigra" },
        { codigo: "21009", nombre: "La Palmera" }, { codigo: "21010", nombre: "Venado" },
        { codigo: "21011", nombre: "Cutris" }, { codigo: "21012", nombre: "Monterrey" },
        { codigo: "21013", nombre: "Pocosol" },
      ]},
      { codigo: "211", nombre: "Zarcero", distritos: [
        { codigo: "21101", nombre: "Zarcero" }, { codigo: "21102", nombre: "Laguna" },
        { codigo: "21103", nombre: "Tapesco" }, { codigo: "21104", nombre: "Guadalupe" },
        { codigo: "21105", nombre: "Palmira" }, { codigo: "21106", nombre: "Zapote" },
        { codigo: "21107", nombre: "Brisas" },
      ]},
      { codigo: "212", nombre: "Valverde Vega", distritos: [
        { codigo: "21201", nombre: "Sarchí Norte" }, { codigo: "21202", nombre: "Sarchí Sur" },
        { codigo: "21203", nombre: "Toro Amarillo" }, { codigo: "21204", nombre: "San Pedro" },
        { codigo: "21205", nombre: "Rodríguez" },
      ]},
      { codigo: "213", nombre: "Upala", distritos: [
        { codigo: "21301", nombre: "Upala" }, { codigo: "21302", nombre: "Aguas Claras" },
        { codigo: "21303", nombre: "San José (Pizote)" }, { codigo: "21304", nombre: "Bijagua" },
        { codigo: "21305", nombre: "Delicias" }, { codigo: "21306", nombre: "Dos Ríos" },
        { codigo: "21307", nombre: "Yolillal" }, { codigo: "21308", nombre: "Canalete" },
      ]},
      { codigo: "214", nombre: "Los Chiles", distritos: [
        { codigo: "21401", nombre: "Los Chiles" }, { codigo: "21402", nombre: "Caño Negro" },
        { codigo: "21403", nombre: "El Amparo" }, { codigo: "21404", nombre: "San Jorge" },
      ]},
      { codigo: "215", nombre: "Guatuso", distritos: [
        { codigo: "21501", nombre: "San Rafael" }, { codigo: "21502", nombre: "Buenavista" },
        { codigo: "21503", nombre: "Cote" }, { codigo: "21504", nombre: "Katira" },
      ]},
      { codigo: "216", nombre: "Río Cuarto", distritos: [
        { codigo: "21601", nombre: "Río Cuarto" }, { codigo: "21602", nombre: "Santa Rita" },
        { codigo: "21603", nombre: "Santa Isabel" },
      ]},
    ],
  },
  {
    codigo: "3", nombre: "Cartago",
    cantones: [
      { codigo: "301", nombre: "Cartago", distritos: [
        { codigo: "30101", nombre: "Oriental" }, { codigo: "30102", nombre: "Occidental" },
        { codigo: "30103", nombre: "Carmen" }, { codigo: "30104", nombre: "San Nicolás" },
        { codigo: "30105", nombre: "Aguacaliente (San Francisco)" }, { codigo: "30106", nombre: "Guadalupe (Arenilla)" },
        { codigo: "30107", nombre: "Corralillo" }, { codigo: "30108", nombre: "Tierra Blanca" },
        { codigo: "30109", nombre: "Dulce Nombre" }, { codigo: "30110", nombre: "Llano Grande" },
        { codigo: "30111", nombre: "Quebradilla" },
      ]},
      { codigo: "302", nombre: "Paraíso", distritos: [
        { codigo: "30201", nombre: "Paraíso" }, { codigo: "30202", nombre: "Santiago" },
        { codigo: "30203", nombre: "Orosi" }, { codigo: "30204", nombre: "Cachí" },
        { codigo: "30205", nombre: "Llanos de Santa Lucía" },
      ]},
      { codigo: "303", nombre: "La Unión", distritos: [
        { codigo: "30301", nombre: "Tres Ríos" }, { codigo: "30302", nombre: "San Diego" },
        { codigo: "30303", nombre: "San Juan" }, { codigo: "30304", nombre: "San Rafael" },
        { codigo: "30305", nombre: "Concepción" }, { codigo: "30306", nombre: "Dulce Nombre" },
        { codigo: "30307", nombre: "San Ramón" }, { codigo: "30308", nombre: "Río Azul" },
      ]},
      { codigo: "304", nombre: "Jiménez", distritos: [
        { codigo: "30401", nombre: "Juan Viñas" }, { codigo: "30402", nombre: "Tucurrique" },
        { codigo: "30403", nombre: "Pejibaye" },
      ]},
      { codigo: "305", nombre: "Turrialba", distritos: [
        { codigo: "30501", nombre: "Turrialba" }, { codigo: "30502", nombre: "La Suiza" },
        { codigo: "30503", nombre: "Peralta" }, { codigo: "30504", nombre: "Santa Cruz" },
        { codigo: "30505", nombre: "Santa Teresita" }, { codigo: "30506", nombre: "Pavones" },
        { codigo: "30507", nombre: "Tuis" }, { codigo: "30508", nombre: "Tayutic" },
        { codigo: "30509", nombre: "Santa Rosa" }, { codigo: "30510", nombre: "Tres Equis" },
        { codigo: "30511", nombre: "La Isabel" }, { codigo: "30512", nombre: "Chirripó" },
      ]},
      { codigo: "306", nombre: "Alvarado", distritos: [
        { codigo: "30601", nombre: "Pacayas" }, { codigo: "30602", nombre: "Cervantes" },
        { codigo: "30603", nombre: "Capellades" },
      ]},
      { codigo: "307", nombre: "Oreamuno", distritos: [
        { codigo: "30701", nombre: "San Rafael" }, { codigo: "30702", nombre: "Cot" },
        { codigo: "30703", nombre: "Potrero Cerrado" }, { codigo: "30704", nombre: "Cipreses" },
        { codigo: "30705", nombre: "Santa Rosa" },
      ]},
      { codigo: "308", nombre: "El Guarco", distritos: [
        { codigo: "30801", nombre: "El Tejar" }, { codigo: "30802", nombre: "San Isidro" },
        { codigo: "30803", nombre: "Tobosi" }, { codigo: "30804", nombre: "Patio de Agua" },
      ]},
    ],
  },
  {
    codigo: "4", nombre: "Heredia",
    cantones: [
      { codigo: "401", nombre: "Heredia", distritos: [
        { codigo: "40101", nombre: "Heredia" }, { codigo: "40102", nombre: "Mercedes" },
        { codigo: "40103", nombre: "San Francisco" }, { codigo: "40104", nombre: "Ulloa" },
        { codigo: "40105", nombre: "Varablanca" },
      ]},
      { codigo: "402", nombre: "Barva", distritos: [
        { codigo: "40201", nombre: "Barva" }, { codigo: "40202", nombre: "San Pedro" },
        { codigo: "40203", nombre: "San Pablo" }, { codigo: "40204", nombre: "San Roque" },
        { codigo: "40205", nombre: "Santa Lucía" }, { codigo: "40206", nombre: "San José de la Montaña" },
      ]},
      { codigo: "403", nombre: "Santo Domingo", distritos: [
        { codigo: "40301", nombre: "Santo Domingo" }, { codigo: "40302", nombre: "San Vicente" },
        { codigo: "40303", nombre: "San Miguel" }, { codigo: "40304", nombre: "Paracito" },
        { codigo: "40305", nombre: "Santo Tomás" }, { codigo: "40306", nombre: "Santa Rosa" },
        { codigo: "40307", nombre: "Tures" }, { codigo: "40308", nombre: "Para" },
      ]},
      { codigo: "404", nombre: "Santa Bárbara", distritos: [
        { codigo: "40401", nombre: "Santa Bárbara" }, { codigo: "40402", nombre: "San Pedro" },
        { codigo: "40403", nombre: "San Juan" }, { codigo: "40404", nombre: "Jesús" },
        { codigo: "40405", nombre: "Santo Domingo" }, { codigo: "40406", nombre: "Puraba" },
      ]},
      { codigo: "405", nombre: "San Rafael", distritos: [
        { codigo: "40501", nombre: "San Rafael" }, { codigo: "40502", nombre: "San Josecito" },
        { codigo: "40503", nombre: "Santiago" }, { codigo: "40504", nombre: "Ángeles" },
        { codigo: "40505", nombre: "Concepción" },
      ]},
      { codigo: "406", nombre: "San Isidro", distritos: [
        { codigo: "40601", nombre: "San Isidro" }, { codigo: "40602", nombre: "San José" },
        { codigo: "40603", nombre: "Concepción" }, { codigo: "40604", nombre: "San Francisco" },
      ]},
      { codigo: "407", nombre: "Belén", distritos: [
        { codigo: "40701", nombre: "San Antonio" }, { codigo: "40702", nombre: "La Ribera" },
        { codigo: "40703", nombre: "La Asunción" },
      ]},
      { codigo: "408", nombre: "Flores", distritos: [
        { codigo: "40801", nombre: "San Joaquín" }, { codigo: "40802", nombre: "Barrantes" },
        { codigo: "40803", nombre: "Llorente" },
      ]},
      { codigo: "409", nombre: "San Pablo", distritos: [
        { codigo: "40901", nombre: "San Pablo" }, { codigo: "40902", nombre: "Rincón de Sabanilla" },
      ]},
      { codigo: "410", nombre: "Sarapiquí", distritos: [
        { codigo: "41001", nombre: "Puerto Viejo" }, { codigo: "41002", nombre: "La Virgen" },
        { codigo: "41003", nombre: "Las Horquetas" }, { codigo: "41004", nombre: "Llanuras del Gaspar" },
        { codigo: "41005", nombre: "Cureña" },
      ]},
    ],
  },
  {
    codigo: "5", nombre: "Guanacaste",
    cantones: [
      { codigo: "501", nombre: "Liberia", distritos: [
        { codigo: "50101", nombre: "Liberia" }, { codigo: "50102", nombre: "Cañas Dulces" },
        { codigo: "50103", nombre: "Mayorga" }, { codigo: "50104", nombre: "Nacascolo" },
        { codigo: "50105", nombre: "Curubandé" },
      ]},
      { codigo: "502", nombre: "Nicoya", distritos: [
        { codigo: "50201", nombre: "Nicoya" }, { codigo: "50202", nombre: "Mansión" },
        { codigo: "50203", nombre: "San Antonio" }, { codigo: "50204", nombre: "Quebrada Honda" },
        { codigo: "50205", nombre: "Sámara" }, { codigo: "50206", nombre: "Nosara" },
        { codigo: "50207", nombre: "Belén de Nosarita" },
      ]},
      { codigo: "503", nombre: "Santa Cruz", distritos: [
        { codigo: "50301", nombre: "Santa Cruz" }, { codigo: "50302", nombre: "Bolsón" },
        { codigo: "50303", nombre: "Veintisiete de Abril" }, { codigo: "50304", nombre: "Tempate" },
        { codigo: "50305", nombre: "Cartagena" }, { codigo: "50306", nombre: "Cuajiniquil" },
        { codigo: "50307", nombre: "Diriá" }, { codigo: "50308", nombre: "Cabo Velas" },
        { codigo: "50309", nombre: "Tamarindo" },
      ]},
      { codigo: "504", nombre: "Bagaces", distritos: [
        { codigo: "50401", nombre: "Bagaces" }, { codigo: "50402", nombre: "La Fortuna" },
        { codigo: "50403", nombre: "Mogote" }, { codigo: "50404", nombre: "Río Naranjo" },
      ]},
      { codigo: "505", nombre: "Carrillo", distritos: [
        { codigo: "50501", nombre: "Filadelfia" }, { codigo: "50502", nombre: "Palmira" },
        { codigo: "50503", nombre: "Sardinal" }, { codigo: "50504", nombre: "Belén" },
      ]},
      { codigo: "506", nombre: "Cañas", distritos: [
        { codigo: "50601", nombre: "Cañas" }, { codigo: "50602", nombre: "Palmira" },
        { codigo: "50603", nombre: "San Miguel" }, { codigo: "50604", nombre: "Bebedero" },
        { codigo: "50605", nombre: "Porozal" },
      ]},
      { codigo: "507", nombre: "Abangares", distritos: [
        { codigo: "50701", nombre: "Las Juntas" }, { codigo: "50702", nombre: "Sierra" },
        { codigo: "50703", nombre: "San Juan" }, { codigo: "50704", nombre: "Colorado" },
      ]},
      { codigo: "508", nombre: "Tilarán", distritos: [
        { codigo: "50801", nombre: "Tilarán" }, { codigo: "50802", nombre: "Quebrada Grande" },
        { codigo: "50803", nombre: "Tronadora" }, { codigo: "50804", nombre: "Santa Rosa" },
        { codigo: "50805", nombre: "Líbano" }, { codigo: "50806", nombre: "Tierras Morenas" },
        { codigo: "50807", nombre: "Arenal" }, { codigo: "50808", nombre: "Cabeceras" },
      ]},
      { codigo: "509", nombre: "Nandayure", distritos: [
        { codigo: "50901", nombre: "Carmona" }, { codigo: "50902", nombre: "Santa Rita" },
        { codigo: "50903", nombre: "Zapotal" }, { codigo: "50904", nombre: "San Pablo" },
        { codigo: "50905", nombre: "Porvenir" }, { codigo: "50906", nombre: "Bejuco" },
      ]},
      { codigo: "510", nombre: "La Cruz", distritos: [
        { codigo: "51001", nombre: "La Cruz" }, { codigo: "51002", nombre: "Santa Cecilia" },
        { codigo: "51003", nombre: "La Garita" }, { codigo: "51004", nombre: "Santa Elena" },
      ]},
      { codigo: "511", nombre: "Hojancha", distritos: [
        { codigo: "51101", nombre: "Hojancha" }, { codigo: "51102", nombre: "Monte Romo" },
        { codigo: "51103", nombre: "Puerto Carrillo" }, { codigo: "51104", nombre: "Huacas" },
        { codigo: "51105", nombre: "Matambú" },
      ]},
    ],
  },
  {
    codigo: "6", nombre: "Puntarenas",
    cantones: [
      { codigo: "601", nombre: "Puntarenas", distritos: [
        { codigo: "60101", nombre: "Puntarenas" }, { codigo: "60102", nombre: "Pitahaya" },
        { codigo: "60103", nombre: "Chomes" }, { codigo: "60104", nombre: "Lepanto" },
        { codigo: "60105", nombre: "Paquera" }, { codigo: "60106", nombre: "Manzanillo" },
        { codigo: "60107", nombre: "Guacimal" }, { codigo: "60108", nombre: "Barranca" },
        { codigo: "60109", nombre: "Monte Verde" }, { codigo: "60110", nombre: "Isla del Coco" },
        { codigo: "60111", nombre: "Cóbano" }, { codigo: "60112", nombre: "Chacarita" },
        { codigo: "60113", nombre: "Chira" }, { codigo: "60114", nombre: "Acapulco" },
        { codigo: "60115", nombre: "El Roble" }, { codigo: "60116", nombre: "Arancibia" },
      ]},
      { codigo: "602", nombre: "Esparza", distritos: [
        { codigo: "60201", nombre: "Espíritu Santo" }, { codigo: "60202", nombre: "San Juan Grande" },
        { codigo: "60203", nombre: "Macacona" }, { codigo: "60204", nombre: "San Rafael" },
        { codigo: "60205", nombre: "San Jerónimo" }, { codigo: "60206", nombre: "Caldera" },
      ]},
      { codigo: "603", nombre: "Buenos Aires", distritos: [
        { codigo: "60301", nombre: "Buenos Aires" }, { codigo: "60302", nombre: "Volcán" },
        { codigo: "60303", nombre: "Potrero Grande" }, { codigo: "60304", nombre: "Boruca" },
        { codigo: "60305", nombre: "Pilas" }, { codigo: "60306", nombre: "Colinas" },
        { codigo: "60307", nombre: "Chánguena" }, { codigo: "60308", nombre: "Biolley" },
        { codigo: "60309", nombre: "Brunka" },
      ]},
      { codigo: "604", nombre: "Montes de Oro", distritos: [
        { codigo: "60401", nombre: "Miramar" }, { codigo: "60402", nombre: "La Unión" },
        { codigo: "60403", nombre: "San Isidro" },
      ]},
      { codigo: "605", nombre: "Osa", distritos: [
        { codigo: "60501", nombre: "Puerto Cortés" }, { codigo: "60502", nombre: "Palmar" },
        { codigo: "60503", nombre: "Sierpe" }, { codigo: "60504", nombre: "Bahía Ballena" },
        { codigo: "60505", nombre: "Piedras Blancas" }, { codigo: "60506", nombre: "Bahía Drake" },
      ]},
      { codigo: "606", nombre: "Quepos", distritos: [
        { codigo: "60601", nombre: "Quepos" }, { codigo: "60602", nombre: "Savegre" },
        { codigo: "60603", nombre: "Naranjito" },
      ]},
      { codigo: "607", nombre: "Golfito", distritos: [
        { codigo: "60701", nombre: "Golfito" }, { codigo: "60702", nombre: "Puerto Jiménez" },
        { codigo: "60703", nombre: "Guaycará" }, { codigo: "60704", nombre: "Pavón" },
      ]},
      { codigo: "608", nombre: "Coto Brus", distritos: [
        { codigo: "60801", nombre: "San Vito" }, { codigo: "60802", nombre: "Sabalito" },
        { codigo: "60803", nombre: "Aguabuena" }, { codigo: "60804", nombre: "Limoncito" },
        { codigo: "60805", nombre: "Pittier" }, { codigo: "60806", nombre: "Gutiérrez Braun" },
      ]},
      { codigo: "609", nombre: "Parrita", distritos: [
        { codigo: "60901", nombre: "Parrita" },
      ]},
      { codigo: "610", nombre: "Corredores", distritos: [
        { codigo: "61001", nombre: "Corredor" }, { codigo: "61002", nombre: "La Cuesta" },
        { codigo: "61003", nombre: "Canoas" }, { codigo: "61004", nombre: "Laurel" },
      ]},
      { codigo: "611", nombre: "Garabito", distritos: [
        { codigo: "61101", nombre: "Jacó" }, { codigo: "61102", nombre: "Tárcoles" },
        { codigo: "61103", nombre: "Lagunillas" },
      ]},
      { codigo: "612", nombre: "Monteverde", distritos: [
        { codigo: "61201", nombre: "Monteverde" }, { codigo: "61202", nombre: "Cerro Plano" },
        { codigo: "61203", nombre: "Santa Elena" },
      ]},
    ],
  },
  {
    codigo: "7", nombre: "Limón",
    cantones: [
      { codigo: "701", nombre: "Limón", distritos: [
        { codigo: "70101", nombre: "Limón" }, { codigo: "70102", nombre: "Valle La Estrella" },
        { codigo: "70103", nombre: "Río Blanco" }, { codigo: "70104", nombre: "Matama" },
      ]},
      { codigo: "702", nombre: "Pococí", distritos: [
        { codigo: "70201", nombre: "Guápiles" }, { codigo: "70202", nombre: "Jiménez" },
        { codigo: "70203", nombre: "La Rita" }, { codigo: "70204", nombre: "Roxana" },
        { codigo: "70205", nombre: "Cariari" }, { codigo: "70206", nombre: "Colorado" },
        { codigo: "70207", nombre: "La Colonia" },
      ]},
      { codigo: "703", nombre: "Siquirres", distritos: [
        { codigo: "70301", nombre: "Siquirres" }, { codigo: "70302", nombre: "Pacuarito" },
        { codigo: "70303", nombre: "Florida" }, { codigo: "70304", nombre: "Germania" },
        { codigo: "70305", nombre: "El Cairo" }, { codigo: "70306", nombre: "Alegría" },
        { codigo: "70307", nombre: "Reventazón" },
      ]},
      { codigo: "704", nombre: "Talamanca", distritos: [
        { codigo: "70401", nombre: "Bratsi" }, { codigo: "70402", nombre: "Sixaola" },
        { codigo: "70403", nombre: "Cahuita" }, { codigo: "70404", nombre: "Telire" },
      ]},
      { codigo: "705", nombre: "Matina", distritos: [
        { codigo: "70501", nombre: "Matina" }, { codigo: "70502", nombre: "Batán" },
        { codigo: "70503", nombre: "Carrandi" },
      ]},
      { codigo: "706", nombre: "Guácimo", distritos: [
        { codigo: "70601", nombre: "Guácimo" }, { codigo: "70602", nombre: "Mercedes" },
        { codigo: "70603", nombre: "Pocora" }, { codigo: "70604", nombre: "Río Jiménez" },
        { codigo: "70605", nombre: "Duacarí" },
      ]},
    ],
  },
];

export function getProvincias(): Provincia[] { return PROVINCIAS; }

export function getCantones(provinciaCodigo: string): Canton[] {
  return PROVINCIAS.find((p) => p.codigo === provinciaCodigo)?.cantones ?? [];
}

export function getDistritos(provinciaCodigo: string, cantonCodigo: string): Distrito[] {
  return getCantones(provinciaCodigo).find((c) => c.codigo === cantonCodigo)?.distritos ?? [];
}
